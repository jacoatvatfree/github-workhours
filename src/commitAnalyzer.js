'use strict';

/**
 * Module for analyzing commit patterns and calculating after-hours activity
 */

/**
 * Initialize contributor data structure
 * @returns {Object} Empty contributor data with 2D arrays for hour/day tracking
 */
function initializeContributorData() {
  return {
    // Create a 2D array with 7 rows (days) and 24 columns (hours)
    byHourAndDay: Array(7).fill().map(() => Array(24).fill(0)),
    byHour: Array(24).fill(0),
    byDay: Array(7).fill(0),
    total: 0
  };
}

/**
 * Process a single commit and update contributor data
 * @param {Object} commitItem - GitHub commit object
 * @param {Object} contributors - Contributors data object to update
 * @param {Set} memberLogins - Set of organization member logins
 */
function processCommit(commitItem, contributors, memberLogins) {
  // only include commits from org members
  if (!commitItem.author || !memberLogins.has(commitItem.author.login)) return;
  
  const commit = commitItem.commit;
  const author = (commitItem.author && commitItem.author.login) ? commitItem.author.login : 'unknown';
  const date = new Date(commit.author.date);
  const hour = date.getHours();
  const day = date.getDay(); // 0 (Sun) - 6 (Sat)

  if (!contributors[author]) {
    contributors[author] = initializeContributorData();
  }
  
  // Access the 2D array directly with [day][hour]
  contributors[author].byHourAndDay[day][hour] += 1;
  contributors[author].byHour[hour] += 1;
  contributors[author].byDay[day] += 1;
  contributors[author].total += 1;
}

/**
 * Calculate after-hours commits for a contributor
 * @param {Object} data - Contributor data with byHourAndDay array
 * @returns {number} Number of after-hours commits
 */
function calculateAfterHours(data) {
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
  
  return afterHoursCount;
}

/**
 * Generate final analysis from contributor data
 * @param {Object} contributors - Contributors data object
 * @returns {Object} Analysis results
 */
function generateAnalysis(contributors) {
  const analysis = {};
  
  for (const [author, data] of Object.entries(contributors)) {
    const afterHoursCommits = calculateAfterHours(data);
    
    analysis[author] = {
      byHourAndDay: data.byHourAndDay,
      byHour: data.byHour,
      byDay: data.byDay,
      totalCommits: data.total,
      afterHoursCommits: afterHoursCommits
    };
  }
  
  return analysis;
}

module.exports = {
  initializeContributorData,
  processCommit,
  calculateAfterHours,
  generateAnalysis
};