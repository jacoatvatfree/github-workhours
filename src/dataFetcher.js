'use strict';

/**
 * Module for fetching data from GitHub API
 */

/**
 * Helper to fetch all pages of a paginated GitHub API endpoint
 * @param {Function} fetchPageFn - Function that fetches a single page
 * @param {...any} args - Arguments to pass to the fetch function
 * @returns {Promise<Array>} Array of all items across all pages
 */
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

/**
 * Fetch all repositories for an organization
 * @param {Object} client - GitHub client
 * @param {string} org - Organization name
 * @returns {Promise<Array>} Array of repository objects
 */
async function fetchOrgRepos(client, org) {
  return await fetchAll(client.listOrgRepos, org);
}

/**
 * Fetch all members for an organization
 * @param {Object} client - GitHub client
 * @param {string} org - Organization name
 * @returns {Promise<Set>} Set of member login names
 */
async function fetchOrgMembers(client, org) {
  const membersList = await fetchAll(client.listOrgMembers, org);
  return new Set(membersList.map(m => m.login));
}

/**
 * Fetch commits for a repository with caching
 * @param {Object} client - GitHub client
 * @param {Object} cache - Cache instance
 * @param {string} org - Organization name
 * @param {string} repoName - Repository name
 * @param {string} since - Start date
 * @param {string} until - End date
 * @returns {Promise<Array>} Array of commit objects
 */
async function fetchRepoCommits(client, cache, org, repoName, since, until) {
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
  
  return commits;
}

module.exports = {
  fetchAll,
  fetchOrgRepos,
  fetchOrgMembers,
  fetchRepoCommits
};