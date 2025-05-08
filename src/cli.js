#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const { subDays, subMonths, subYears } = require('date-fns');
const { analyzeWorkHours } = require('./analyzer');

program
  .name('github-workhours')
  .description('Analyze GitHub commit patterns to determine after-hours activity')
  .option('-o, --org <org>', 'GitHub organization name (or set GITHUB_ORG env var)')
  .option('-s, --since <since>', 'Start date (ISO format, e.g., 2023-01-01T00:00:00Z)')
  .option('-u, --until <until>', 'End date (ISO format, e.g., 2024-01-01T00:00:00Z)')
  .option('-t, --token <token>', 'GitHub Personal Access Token (or set GITHUB_TOKEN env var)')
  .version('1.0.0')
  .parse(process.argv);

const options = program.opts();
const org = options.org || process.env.GITHUB_ORG;
const token = options.token || process.env.GITHUB_TOKEN;

// parse since flag (ISO date or natural language duration like "2 months")
let since;
if (options.since) {
  const nlMatch = options.since.match(/^(\d+)\s*(day|days|month|months|year|years)$/i);
  if (nlMatch) {
    const num = parseInt(nlMatch[1], 10);
    const unit = nlMatch[2].toLowerCase();
    switch (unit) {
      case 'day':
      case 'days':
        since = subDays(new Date(), num).toISOString();
        break;
      case 'month':
      case 'months':
        since = subMonths(new Date(), num).toISOString();
        break;
      case 'year':
      case 'years':
        since = subYears(new Date(), num).toISOString();
        break;
    }
  } else {
    since = options.since;
  }
}

const until = options.until;

if (!org) {
  console.error('Error: Organization name is required. Provide via --org or GITHUB_ORG env var.');
  process.exit(1);
}
if (!token) {
  console.error('Error: GitHub token is required. Provide via --token or GITHUB_TOKEN env var.');
  process.exit(1);
}

(async () => {
  const { default: ora } = await import('ora');
  const spinner = ora(`Analyzing commits for organization: ${org}`).start();
  try {
    const result = await analyzeWorkHours({ org, since, until, token });
    spinner.succeed('Analysis complete');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(error.message);
    process.exit(1);
  }
})();
