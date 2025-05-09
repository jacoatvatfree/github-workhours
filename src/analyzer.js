'use strict';

const { makeGithubClient } = require('./githubClient');
const { createCache } = require('./cache');

// Cache instance will be initialized in analyzeWorkHours
let cache;
let isCacheClosed = false;

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
        // Create a 2D array with 7 rows (days) and 24 columns (hours)
        const byHourAndDay = Array(7).fill().map(() => Array(24).fill(0));
        
        contributors[author] = {
          byHourAndDay,
          byHour: Array(24).fill(0),
          byDay: Array(7).fill(0),
          total: 0
        };
      }
      
      // Access the 2D array directly with [day][hour]
      contributors[author].byHourAndDay[day][hour] += 1;
      contributors[author].byHour[hour] += 1;
      contributors[author].byDay[day] += 1;
      contributors[author].total += 1;
    }
  }

  // compute after-hours: 
  // - For weekdays (Mon-Fri): before 9am or after 5pm
  // - For weekends (Sat-Sun): all hours count as after-hours
  const analysis = {};
  for (const [author, data] of Object.entries(contributors)) {
    // Calculate after-hours commits by considering both time and day of week
    let afterHoursCount = 0;
    
    // Count commits by hour and day combination directly using 2D array
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // 0 = Sunday, 6 = Saturday
        const isWeekend = day === 0 || day === 6; 
        
        // Before 9am or after 5pm in the local timezone
        // Note: Date.getHours() already returns hours in local timezone
        const isAfterHours = hour < 9 || hour >= 17; 
        
        // For weekends, all hours count as after-hours
        // For weekdays, only before 9am or after 5pm count as after-hours
        if (isWeekend || isAfterHours) {
          // Now we have exact hour+day combined data, no need to estimate
          afterHoursCount += data.byHourAndDay[day][hour];
        }
      }
    }
    analysis[author] = {
      byHourAndDay: data.byHourAndDay,
      byHour: data.byHour,
      byDay: data.byDay,
      totalCommits: data.total,
      afterHoursCommits: afterHoursCount
    };
  }

  return { org, since, until, analysis };
}

/**
 * Close the cache connection to prevent hanging processes.
 * This should be called when the application is shutting down.
 */
async function closeCache() {
  if (cache && !isCacheClosed) {
    try {
      await cache.close();
    } catch (error) {
      console.error('Error closing cache:', error);
    } finally {
      // Force cleanup even if there was an error
      cache = null;
      isCacheClosed = true;
    }
  }
}

module.exports = { analyzeWorkHours, closeCache };
