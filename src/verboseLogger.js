'use strict';

const fs = require('fs').promises;

/**
 * Module for handling verbose logging and commit message details
 */

/**
 * Log commit details to a file in verbose mode
 * @param {string} logFile - Path to log file
 * @param {string} org - Organization name
 * @param {string} repoName - Repository name
 * @param {Array} commits - Array of commit objects
 * @param {Set} memberLogins - Set of organization member logins
 */
async function logCommitDetails(logFile, org, repoName, commits, memberLogins) {
  if (!logFile) return;
  
  const logEntries = [];
  logEntries.push(`\n=== Repository: ${org}/${repoName} ===`);
  logEntries.push(`Timestamp: ${new Date().toISOString()}`);
  logEntries.push(`Total commits found: ${commits.length}`);
  
  const memberCommits = commits.filter(commit => 
    commit.author && memberLogins.has(commit.author.login)
  );
  
  logEntries.push(`Member commits: ${memberCommits.length}`);
  logEntries.push('');
  
  for (const commitItem of memberCommits) {
    const commit = commitItem.commit;
    const author = commitItem.author ? commitItem.author.login : 'unknown';
    const date = new Date(commit.author.date);
    const sha = commitItem.sha.substring(0, 7);
    const message = commit.message.split('\n')[0]; // First line only
    
    logEntries.push(`[${date.toISOString()}] ${author} (${sha}): ${message}`);
  }
  
  logEntries.push('');
  
  try {
    await fs.appendFile(logFile, logEntries.join('\n'));
  } catch (error) {
    console.warn(`Warning: Failed to write to log file ${logFile}:`, error.message);
  }
}

/**
 * Initialize log file with header information
 * @param {string} logFile - Path to log file
 * @param {string} org - Organization name
 * @param {string} since - Start date
 * @param {string} until - End date
 */
async function initializeLogFile(logFile, org, since, until) {
  if (!logFile) return;
  
  const header = [
    'GitHub Work Hours Analysis - Verbose Log',
    `Organization: ${org}`,
    `Analysis Period: ${since || 'all time'} to ${until || 'now'}`,
    `Started: ${new Date().toISOString()}`,
    `${'='.repeat(80)}`,
    ''
  ].join('\n');
  
  try {
    await fs.writeFile(logFile, header);
    console.log(`Verbose logging enabled. Details will be written to: ${logFile}`);
  } catch (error) {
    console.warn(`Warning: Failed to initialize log file ${logFile}:`, error.message);
  }
}

/**
 * Write analysis summary to log file
 * @param {string} logFile - Path to log file
 * @param {Object} analysis - Analysis results
 */
async function logAnalysisSummary(logFile, analysis) {
  if (!logFile) return;
  
  const summary = [
    '',
    `${'='.repeat(80)}`,
    'ANALYSIS SUMMARY',
    `${'='.repeat(80)}`,
    ''
  ];
  
  const contributors = Object.keys(analysis);
  summary.push(`Total contributors analyzed: ${contributors.length}`);
  summary.push('');
  
  for (const author of contributors) {
    const data = analysis[author];
    const afterHoursPercent = data.totalCommits > 0 
      ? ((data.afterHoursCommits / data.totalCommits) * 100).toFixed(1)
      : '0.0';
    
    summary.push(`${author}:`);
    summary.push(`  Total commits: ${data.totalCommits}`);
    summary.push(`  After-hours commits: ${data.afterHoursCommits} (${afterHoursPercent}%)`);
    summary.push('');
  }
  
  summary.push(`Analysis completed: ${new Date().toISOString()}`);
  summary.push('');
  
  try {
    await fs.appendFile(logFile, summary.join('\n'));
  } catch (error) {
    console.warn(`Warning: Failed to write summary to log file ${logFile}:`, error.message);
  }
}

module.exports = {
  logCommitDetails,
  initializeLogFile,
  logAnalysisSummary
};