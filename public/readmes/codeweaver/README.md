# codeweaver

Full-stack coding agent that reads your repository, plans changes across multiple files, writes or refactors code, runs your test suite, and opens a pull request with a detailed description.

## How it works

- Clones and indexes your repository structure
- Plans the change set — which files, what changes, in what order
- Writes or modifies code across all affected files
- Runs your existing test suite and fixes failing tests
- Opens a PR with a summary, diff, and test results

## Parameters

| Field | Description |
|---|---|
| **Input** | GitHub repo URL + plain-English description of the change you want |
| **Output** | Open GitHub pull request with code changes, passing tests, and PR description |

## Example prompts

- Add rate limiting middleware (100 req/min per IP) to all POST endpoints in my Express API.
- Refactor the authentication module from session-based to JWT, update all tests.

## Limitations

- Requires GitHub access token with repo read/write permissions
- Works best on repos under 100k lines of code
- Cannot resolve pre-existing merge conflicts in open PRs
