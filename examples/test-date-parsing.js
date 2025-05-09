#!/usr/bin/env node
'use strict';

const { subDays, subMonths, subYears, format } = require('date-fns');

// Function to simulate the CLI's date parsing logic
function parseNaturalLanguageDate(input) {
  if (!input) return null;
  
  // Support both full words and shorthand notations (y, mo, w, d), with or without spaces
  const nlMatch = input.match(/^(\d+)\s*(d|day|days|w|week|weeks|mo|month|months|y|year|years)$/i);
  if (nlMatch) {
    const num = parseInt(nlMatch[1], 10);
    const unit = nlMatch[2].toLowerCase();
    let result;
    
    switch (unit) {
      case 'd':
      case 'day':
      case 'days':
        result = subDays(new Date(), num);
        break;
      case 'w':
      case 'week':
      case 'weeks':
        // Convert weeks to days (1 week = 7 days)
        result = subDays(new Date(), num * 7);
        break;
      case 'mo':
      case 'month':
      case 'months':
        result = subMonths(new Date(), num);
        break;
      case 'y':
      case 'year':
      case 'years':
        result = subYears(new Date(), num);
        break;
      default:
        return null;
    }
    
    return {
      input,
      parsed: result,
      iso: result.toISOString(),
      formatted: format(result, 'yyyy-MM-dd')
    };
  }
  
  return { input, error: 'Not a valid natural language date' };
}

// Test cases
const testCases = [
  '1d',
  '1 d',
  '2day',
  '3days',
  '1w',
  '1 w',
  '2week',
  '3weeks',
  '1mo',
  '1 mo',
  '2month',
  '3months',
  '1y',
  '1 y',
  '2year',
  '3years',
  'invalid'
];

// Run tests
console.log('Testing natural language date parsing:');
console.log('======================================');
testCases.forEach(test => {
  const result = parseNaturalLanguageDate(test);
  console.log(`Input: "${test}"`);
  if (result && result.error) {
    console.log(`  Error: ${result.error}`);
  } else if (result) {
    console.log(`  Parsed: ${result.formatted} (${result.iso})`);
  } else {
    console.log('  Result: null');
  }
  console.log('-------------------------------------');
});
