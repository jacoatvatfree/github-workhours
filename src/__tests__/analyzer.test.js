'use strict';

// Mock the GitHub client to include listOrgMembers, listOrgRepos, listRepoCommits
jest.mock('../githubClient', () => ({
  makeGithubClient: jest.fn(() => ({
    listOrgRepos: jest.fn(() =>
      Promise.resolve([{ name: 'repo1' }])
    ),
    listRepoCommits: jest.fn(() =>
      Promise.resolve([
        {
          author: { login: 'alice' },
          commit: { author: { name: 'alice', date: '2023-01-01T10:00:00Z' } }
        },
        {
          author: { login: 'alice' },
          commit: { author: { name: 'alice', date: '2023-01-01T18:00:00Z' } }
        },
        {
          author: { login: 'bob' },
          commit: { author: { name: 'bob', date: '2023-01-01T20:00:00Z' } }
        }
      ])
    ),
    listOrgMembers: jest.fn(() =>
      Promise.resolve([{ login: 'alice' }])
    )
  }))
}));

const { analyzeWorkHours } = require('../analyzer');

describe('analyzeWorkHours', () => {
  it('includes only organization members and aggregates commit counts and after-hours properly', async () => {
    const result = await analyzeWorkHours({
      org: 'test-org',
      since: '2023-01-01T00:00:00Z',
      until: '2023-01-02T00:00:00Z',
      token: 'dummy-token'
    });

    expect(result.org).toBe('test-org');
    expect(result.since).toBe('2023-01-01T00:00:00Z');
    expect(result.until).toBe('2023-01-02T00:00:00Z');

    // Only 'alice' should be included, 'bob' is not an org member
    expect(result.analysis.bob).toBeUndefined();

    const alice = result.analysis.alice;
    expect(alice.totalCommits).toBe(2);
    expect(alice.afterHoursCommits).toBe(1); // only hour 18 is after 17
  });
});
