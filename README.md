# github-workhours

Analyze GitHub commit patterns to determine after-hours activity across an organization’s repositories.

## Installation

```bash
npm install github-workhours
```

Or install globally to use the CLI:

```bash
npm install -g github-workhours
```

## Configuration

The library and CLI use a GitHub Personal Access Token (PAT) to authenticate. You can provide your token in one of two ways:

1. Set the `GITHUB_TOKEN` environment variable:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```
2. Pass the token via the CLI flag:
   ```bash
   github-workhours -o my-org -t your_token_here
   ```

### Rate Limiting & Caching

- Uses [Bottleneck](https://github.com/SGrondin/bottleneck) to stay within GitHub API rate limits.
- Default settings:
  - 5,000 requests per hour (refreshed hourly)
  - Maximum 5 requests per second
  - Single-request concurrency
- Flexible caching strategy:
  - In-memory cache (1 hour TTL) by default using [node-cache](https://github.com/node-cache/node-cache)
  - Redis cache (24 hour TTL) when `REDIS_URL` environment variable is set

#### Redis Configuration

To enable Redis caching, set the `REDIS_URL` environment variable:

```bash
export REDIS_URL=redis://localhost:6379
```

This will cache GitHub API responses for 24 hours, significantly reducing API usage for repeated analyses.

## CLI Usage & Environment Variables

The CLI supports passing options via flags or environment variables.

```bash
github-workhours --help
```

Basic example (using flags):

> The `--since` option accepts an ISO date or a natural language duration (e.g., `--since "2 months"`).

```bash
github-workhours -o my-org -s 2023-01-01T00:00:00Z -u 2023-12-31T23:59:59Z
```

Or using environment variables:

```bash
export GITHUB_ORG=my-org
export GITHUB_TOKEN=your_token_here
github-workhours
```

Sample output (JSON):

```json
{
  "org": "my-org",
  "since": "2023-01-01T00:00:00Z",
  "until": "2023-12-31T23:59:59Z",
  "analysis": {
    "alice": {
      "byHour": [ ... ],
      "byDay": [ ... ],
      "totalCommits": 123,
      "afterHoursCommits": 45
    },
    "bob": { ... }
  }
}
```

## Programmatic API

```js
const { analyzeWorkHours } = require('github-workhours');

(async () => {
  const result = await analyzeWorkHours({
    org: 'my-org',
    since: '2023-01-01T00:00:00Z',
    until: '2023-12-31T23:59:59Z',
    token: process.env.GITHUB_TOKEN
  });
  console.log(result);
})();
```

## Examples

An example script is provided in `examples/run-analysis.js`:

```bash
node examples/run-analysis.js
```

## Development & Testing

Clone the repo and install dependencies:

```bash
git clone https://github.com/your-org/github-workhours.git
cd github-workhours
npm install
```

Run tests:

```bash
npm test
```

## License

MIT
