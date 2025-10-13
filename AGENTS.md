# Agent Guidelines for git-workhours

## Build/Test Commands
- `npm test` - Run all Jest tests
- `npm run lint` - Run ESLint
- `jest src/__tests__/analyzer.test.js` - Run single test file

## Code Style
- Use `'use strict';` at top of all JS files
- Require statements use CommonJS (`require()`/`module.exports`)
- JSDoc comments for all exported functions with `@param` and `@returns`
- Camelcase naming for variables/functions, kebab-case for file names
- 2-space indentation, single quotes for strings
- Use descriptive variable names (e.g., `afterHoursCount`, `memberLogins`)
- Error handling with try/catch and descriptive error messages
- Use const/let appropriately, avoid var
- Mock external dependencies in tests with `jest.mock()`
- Use async/await for async operations
- Cache keys format: `"type:org:repo:since:until"`
- Consistent comment style: `// comment` for single line, `/** */` for JSDoc
- Test files in `src/__tests__/` with `.test.js` suffix
- Array initialization: `Array(24).fill(0)` for fixed-size arrays
- Use Sets for membership checking: `new Set(array)`
- Close resources properly (cache connections, etc.)