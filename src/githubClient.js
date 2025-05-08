'use strict';

const fetch = require('node-fetch');
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
  reservoir: 5000,                 // initial number of requests
  reservoirRefreshAmount: 5000,    // number of requests to restore at each interval
  reservoirRefreshInterval: 60 * 60 * 1000, // restore reservoir every hour
  maxConcurrent: 1,               // one request at a time
  minTime: 200                    // at most 5 requests per second
});

const GITHUB_API_BASE = 'https://api.github.com';

function makeGithubClient({ token }) {
  if (!token) {
    throw new Error('GitHub token is required. Set GITHUB_TOKEN environment variable.');
  }

  async function request(path) {
    const url = `${GITHUB_API_BASE}${path}`;
    return limiter.schedule(() =>
      fetch(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      })
    ).then(async (res) => {
      if (!res.ok) {
        const message = `GitHub request failed: ${res.status} ${res.statusText}`;
        const errorBody = await res.text();
        throw new Error(`${message}\n${errorBody}`);
      }
      return res.json();
    });
  }

  async function listOrgRepos(org, page = 1, per_page = 100) {
    return request(`/orgs/${org}/repos?per_page=${per_page}&page=${page}`);
  }

  async function listRepoCommits(owner, repo, since, until, page = 1, per_page = 100) {
    let query = `?per_page=${per_page}&page=${page}`;
    if (since) query += `&since=${encodeURIComponent(since)}`;
    if (until) query += `&until=${encodeURIComponent(until)}`;
    return request(`/repos/${owner}/${repo}/commits${query}`);
  }

  async function listOrgMembers(org, page = 1, per_page = 100) {
    return request(`/orgs/${org}/members?per_page=${per_page}&page=${page}`);
  }

  return {
    listOrgRepos,
    listRepoCommits,
    listOrgMembers
  };
}

module.exports = {
  makeGithubClient
};
