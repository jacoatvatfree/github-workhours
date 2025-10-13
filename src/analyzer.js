'use strict';

const { makeGithubClient } = require('./githubClient');
const { createCache } = require('./cache');
const { fetchOrgRepos, fetchOrgMembers, fetchRepoCommits } = require('./dataFetcher');
const { processCommit, generateAnalysis } = require('./commitAnalyzer');
const { initializeLogFile, logCommitDetails, logAnalysisSummary } = require('./verboseLogger');

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
 * @param {boolean} [options.verbose] - Enable verbose logging
 * @param {string} [options.logFile] - Path to log file for verbose output
 * @returns {Promise<Object>} analysis result
 */
async function analyzeWorkHours({ org, since, until, token, verbose, logFile }) {
  // Initialize cache if not already done
  if (!cache) {
    cache = await createCache();
  }
  if (!org) {
    throw new Error('Organization name is required');
  }
  token = token || process.env.GITHUB_TOKEN;
  const client = makeGithubClient({ token });

  // Initialize verbose logging if enabled
  if (verbose && logFile) {
    await initializeLogFile(logFile, org, since, until);
  }

  // get all repos in org
  const repos = await fetchOrgRepos(client, org);
  
  // fetch organization members and build a set of logins
  const memberLogins = await fetchOrgMembers(client, org);

  // initialize aggregation
  const contributors = {};

  // for each repo, fetch commits and aggregate
  for (const repo of repos) {
    const repoName = repo.name;
    const commits = await fetchRepoCommits(client, cache, org, repoName, since, until);

    // Log commit details if verbose mode is enabled
    if (verbose && logFile) {
      await logCommitDetails(logFile, org, repoName, commits, memberLogins);
    }

    for (const commitItem of commits) {
      processCommit(commitItem, contributors, memberLogins);
    }
  }

  // Generate final analysis
  const analysis = generateAnalysis(contributors);

  // Log analysis summary if verbose mode is enabled
  if (verbose && logFile) {
    await logAnalysisSummary(logFile, analysis);
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