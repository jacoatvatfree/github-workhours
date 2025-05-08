# Project Brief: github-workhours

## Overview
An npm package that analyzes GitHub commit patterns across an organization's repositories to determine when contributors are most active, with a focus on identifying after-hours work patterns.

## Core Requirements
- Track commit timing (hour of day and day of week) for each contributor
- Analyze commit patterns across all repositories in an organization
- Support data analysis over a 2-year timespan
- Optimize GitHub API usage to avoid rate limits
- Provide both CLI and programmatic interfaces
- Output data in JSON format

## Technical Constraints
- Use JavaScript (not TypeScript)
- Prefer lightweight, focused libraries over multi-function ones
- Authenticate with GitHub using Personal Access Tokens (PAT)

## Success Criteria
- Accurate reporting of commit patterns by contributor
- Efficient API usage that respects GitHub rate limits
- Clear identification of after-hours activity
- Reliable operation across different organizations and repository structures
