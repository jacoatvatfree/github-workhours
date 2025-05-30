# System Patterns: github-workhours

## Architecture Overview
The package follows a modular architecture with clear separation of concerns:

```mermaid
flowchart TD
    CLI[CLI Interface] --> Core[Core Analysis Engine]
    API[Programmatic API] --> Core
    Core --> GitHubClient[GitHub API Client]
    Core --> DataProcessor[Data Processor]
    GitHubClient --> RateLimiter[Rate Limiter]
    DataProcessor --> Storage[Data Cache]
```

## Key Components
1. **CLI Interface**: Command-line tool for running analyses
2. **Programmatic API**: JavaScript interface for integration
3. **GitHub API Client**: Handles all GitHub API interactions
4. **Rate Limiter**: Ensures API usage stays within limits
5. **Data Processor**: Analyzes raw commit data
6. **Data Cache**: Stores results to minimize API calls

## Design Patterns
- **Functional Clean Architecture**: Single-purpose functions in separate files
- **Factory Functions**: Dependency injection through factory functions (e.g., `makeUser`)
- **Repository Pattern**: Abstracts data access logic
- **Strategy Pattern**: Pluggable analysis strategies
- **Factory Pattern**: Creates appropriate analyzers based on parameters
- **Observer Pattern**: Monitors and reacts to rate limit changes
- **Command Pattern**: Encapsulates analysis requests

## Data Flow
1. User initiates analysis via CLI or API
2. System fetches repository list for organization
3. For each repository, system fetches commit history
4. Commit data is processed to extract timing patterns
5. Results are aggregated by contributor
6. Final analysis is returned in JSON format

## Data Structures
1. **Contributor Data**:
   ```javascript
   {
     byHourAndDay: Array[7][24],  // 2D array for day-hour tracking [day][hour]
                                  // Hours are in local timezone of the server
     byHour: Array(24),           // Commits by hour of day (local timezone)
     byDay: Array(7),             // Commits by day of week
     total: Number                // Total commit count
   }
   ```

2. **Analysis Result**:
   ```javascript
   {
     org: String,                 // Organization name
     since: String,               // Start date (ISO format)
     until: String,               // End date (ISO format)
     analysis: {                  // Analysis by contributor
       [username]: {
         byHourAndDay: Array[7][24], // 2D array for day-hour tracking
         byHour: Array,           // Commits by hour
         byDay: Array,            // Commits by day
         totalCommits: Number,    // Total commits
         afterHoursCommits: Number // After-hours commit count
       }
     }
   }
   ```

## Optimization Strategies
- Incremental data fetching to avoid redundant API calls
- Local caching of previously fetched data
- Parallel processing where appropriate
- Backoff strategies for rate limit handling

## Timezone Handling
- Commit timestamps from GitHub API are in UTC format (e.g., '2023-01-01T10:00:00Z')
- When creating JavaScript Date objects, timestamps are automatically converted to the server's local timezone
- Work hours are defined as 9am to 5pm in the local timezone of the server
- After-hours commits include:
  - All commits on weekends (Saturday and Sunday)
  - Weekday commits before 9am or after 5pm local time
