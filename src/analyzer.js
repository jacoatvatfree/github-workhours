'use strict';

const { makeGithubClient } = require('./githubClient');
const { createCache } = require('./cache');

// Cache instance will be initialized in analyzeWorkHours
let cache;

/**
 * Analyze GitHub work hours for an organization.
 *
 * @param {Object} options
 * @param {string} options.org - GitHub organization name
 * @param {string} [options.since] - ISO date to start from (e.g., '2023-01-01T00:00:00Z')
 * @param {string} [options.until] - ISO date to end at
 * @param {string} [options.token] - GitHub PAT (defaults to process.env.GITHUB_TOKEN)
 * @returns {Promise<Object>} analysis result
 */
async function analyzeWorkHours({ org, since, until, token }) {
  // Initialize cache if not already done
  if (!cache) {
    cache = await createCache();
  }
  if (!org) {
    throw new Error('Organization name is required');
  }
  token = token || process.env.GITHUB_TOKEN;
  const client = makeGithubClient({ token });

  // helper to fetch all pages of an endpoint
  async function fetchAll(fetchPageFn, ...args) {
    const per_page = 100;
    let page = 1;
    const results = [];
    while (true) {
      const items = await fetchPageFn(...args, page, per_page);
      if (!items || items.length === 0) break;
      results.push(...items);
      // stop if fewer than per_page results returned
      if (items.length < per_page) break;
      page += 1;
    }
    return results;
  }

  // get all repos in org
  const repos = await fetchAll(client.listOrgRepos, org);
  
  // fetch organization members and build a set of logins
  const membersList = await fetchAll(client.listOrgMembers, org);
  const memberLogins = new Set(membersList.map(m => m.login));

  // initialize aggregation
  const contributors = {};

  // for each repo, fetch commits and aggregate
  for (const repo of repos) {
    const repoName = repo.name;
    const cacheKey = `commits:${org}:${repoName}:${since || ''}:${until || ''}`;
    let commits = await cache.get(cacheKey);
    if (!commits) {
      try {
        commits = await fetchAll(
          (o, r, page, per_page) => client.listRepoCommits(o, r, since, until, page, per_page),
          org,
          repoName
        );
      } catch (err) {
        // skip empty repositories
        if (err.message.includes('Git Repository is empty')) {
          commits = [];
        } else {
          throw err;
        }
      }
      await cache.set(cacheKey, commits);
    }

    for (const commitItem of commits) {
      // only include commits from org members
      if (!commitItem.author || !memberLogins.has(commitItem.author.login)) continue;
      const commit = commitItem.commit;
      const author = (commitItem.author && commitItem.author.login) ? commitItem.author.login : 'unknown';
      const date = new Date(commit.author.date);
      const hour = date.getHours();
      const day = date.getDay(); // 0 (Sun) - 6 (Sat)

      if (!contributors[author]) {
        contributors[author] = {
          byHour: Array(24).fill(0),
          byDay: Array(7).fill(0),
          total: 0
        };
      }

      contributors[author].byHour[hour] += 1;
      contributors[author].byDay[day] += 1;
      contributors[author].total += 1;
    }
  }

  // compute after-hours: before 9 or after 17 local
  const analysis = {};
  for (const [author, data] of Object.entries(contributors)) {
    const afterHoursCount = data.byHour
      .reduce((sum, count, h) => sum + (h < 9 || h >= 17 ? count : 0), 0);
    analysis[author] = {
      byHour: data.byHour,
      byDay: data.byDay,
      totalCommits: data.total,
      afterHoursCommits: afterHoursCount
    };
  }

  return { org, since, until, analysis };
}

module.exports = { analyzeWorkHours };
