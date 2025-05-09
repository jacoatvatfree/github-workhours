'use strict';

const { analyzeWorkHours, closeCache } = require('../analyzer');

// Mock the GitHub client to include listOrgMembers, listOrgRepos, listRepoCommits
jest.mock('../githubClient', () => ({
  makeGithubClient: jest.fn(() => ({
    listOrgRepos: jest.fn(() =>
      Promise.resolve([{ name: 'repo1' }])
    ),
    listRepoCommits: jest.fn(() =>
      Promise.resolve([
        // Sunday (weekend) at 10:00 - should count as after-hours
        {
          author: { login: 'alice' },
          commit: { author: { name: 'alice', date: '2023-01-01T10:00:00Z' } } // Sunday
        },
        // Monday (weekday) at 18:00 - should count as after-hours (after 5pm)
        {
          author: { login: 'alice' },
          commit: { author: { name: 'alice', date: '2023-01-02T18:00:00Z' } } // Monday
        },
        // Monday (weekday) at 12:00 - should NOT count as after-hours (9am-5pm)
        {
          author: { login: 'alice' },
          commit: { author: { name: 'alice', date: '2023-01-02T12:00:00Z' } } // Monday
        },
        // Non-member commit - should be ignored
        {
          author: { login: 'bob' },
          commit: { author: { name: 'bob', date: '2023-01-02T20:00:00Z' } }
        }
      ])
    ),
    listOrgMembers: jest.fn(() =>
      Promise.resolve([{ login: 'alice' }])
    )
  }))
}));


describe('analyzeWorkHours', () => {
  // Close the cache after all tests to prevent hanging processes
  afterAll(async () => {
    await closeCache();
  });
  
  it('includes only organization members and aggregates commit counts and after-hours properly', async () => {
    const result = await analyzeWorkHours({
      org: 'test-org',
      since: '2023-01-01T00:00:00Z',
      until: '2023-01-03T00:00:00Z', // Extended to include Monday
      token: 'dummy-token'
    });

    expect(result.org).toBe('test-org');
    expect(result.since).toBe('2023-01-01T00:00:00Z');
    expect(result.until).toBe('2023-01-03T00:00:00Z');

    // Only 'alice' should be included, 'bob' is not an org member
    expect(result.analysis.bob).toBeUndefined();

    const alice = result.analysis.alice;
    expect(alice.totalCommits).toBe(3);
    
    // We should have 2 after-hours commits:
    // 1. Sunday at 10:00 (weekend, all hours count as after-hours)
    // 2. Monday at 18:00 (weekday, after 5pm counts as after-hours)
    // The Monday at 12:00 commit should NOT count as after-hours
    expect(alice.afterHoursCommits).toBe(2); // Now we can assert the exact count with byHourAndDay
    
    // Verify the byHourAndDay 2D array contains the correct values
    // Note: Hours are in local timezone (South Africa, GMT+0200)
    // Sunday (day 0) at 12:00 local time (10:00 UTC)
    expect(alice.byHourAndDay[0][12]).toBe(1);
    // Monday (day 1) at 20:00 local time (18:00 UTC)
    expect(alice.byHourAndDay[1][20]).toBe(1);
    // Monday (day 1) at 14:00 local time (12:00 UTC)
    expect(alice.byHourAndDay[1][14]).toBe(1);
  });
});
