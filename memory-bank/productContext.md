# Product Context: github-workhours

## Problem Statement
Organizations need visibility into when their contributors are working, particularly to identify after-hours activity that might indicate:
- Work-life balance issues
- Time zone differences in distributed teams
- Unusual work patterns that might correlate with burnout
- Potential security concerns from irregular commit timing

## User Stories
1. As an engineering manager, I want to see when my team members are making commits so I can identify potential burnout risks.
2. As an organization admin, I want to analyze commit patterns across all repositories to understand overall work habits.
3. As a team lead, I want to identify after-hours work to ensure healthy work-life balance.
4. As a security analyst, I want to flag unusual commit timing patterns that might indicate compromised accounts.

## Usage Scenarios
- **Team Health Monitoring**: Track commit patterns to identify potential burnout or work-life balance issues
- **Distributed Team Analysis**: Understand how teams across different time zones collaborate
- **Security Monitoring**: Identify unusual commit patterns that deviate from established norms
- **Workload Distribution**: Analyze how work is distributed throughout the week

## User Experience Goals
- Simple CLI interface for quick analysis
- Programmatic API for integration with other tools
- Clear JSON output that can be easily processed or visualized
- Minimal setup requirements (just needs a GitHub PAT)
