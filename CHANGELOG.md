# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 1.0.0 (2026-10-07)

### ⚠ BREAKING CHANGES

- `tombaApiKey` and `tombaApiSecret` inputs were removed. The Actor now uses built-in Tomba credentials from the `TOMBA_API_KEY` / `TOMBA_API_SECRET` environment variables, so users no longer need a Tomba account.

### Features

- Pay-per-event pricing: 1 credit of $0.00312 per billable request (`tomba-request`); errors, empty results and cache hits are free
- New `webhookUrl` input, sent to Tomba as `webhook_url`
- Each item includes `chargedCredits`
- No client-side rate limit; parallel processing with `maxConcurrency`
- Automatic retries with exponential backoff for network errors, 429 and 5xx (`maxRetries`)
- Cross-run result cache (`useCache`, `cacheTtlHours`)
- Resume after migration or restart
- Each dataset item now includes `charged` and `cached`
- URLs are trimmed and deduplicated
- Every item now includes `input_url` and `source`; URLs without an author are pushed with an `error` field instead of being dropped

### Dependencies

- `tomba` upgraded to 1.1.1 (responses are now `{ data, rateLimit }`)
- `apify` upgraded to 3.7.2

### [0.0.3](https://github.com/tomba-io/author-finder/compare/v0.0.2...v0.0.3) (2025-10-27)

### 0.0.2 (2025-10-20)
