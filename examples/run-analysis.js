'use strict';

const { analyzeWorkHours } = require('../src/analyzer');

/**
 * Example script to run work-hours analysis.
 *
 * Usage:
 *   node examples/run-analysis.js <org> [since] [until]
 * 
 * Arguments:
 *   org     - GitHub organization name
 *   since   - ISO date to start from, default '2023-01-01T00:00:00Z'
 *   until   - ISO date to end at, default now
 */
(async () => {
  const [org, sinceArg, untilArg] = process.argv.slice(2);
  if (!org) {
    console.error('Usage: node examples/run-analysis.js <org> [since] [until]');
    process.exit(1);
  }

  const since = sinceArg || '2023-01-01T00:00:00Z';
  const until = untilArg || new Date().toISOString();
  const token = process.env.GITHUB_TOKEN;

  try {
    const result = await analyzeWorkHours({ org, since, until, token });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
