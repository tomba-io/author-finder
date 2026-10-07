# Development

Notes for maintainers of the Tomba Author Finder Actor. The README is the end-user page shown on Apify Store.

## Requirements

- Node.js 20+
- [Apify CLI](https://docs.apify.com/cli) for deployment

## Scripts

```bash
npm install
npm run build     # compile TypeScript to dist/
npm run lint      # ESLint (src and test)
npm run format    # Prettier
npm test          # unit + end-to-end tests (node:test)
npm start         # run locally with tsx
```

## Credentials

The Actor uses our Tomba account. Credentials come from environment variables, never from the input:

| Variable             | Description                                        |
| -------------------- | -------------------------------------------------- |
| `TOMBA_API_KEY`      | Tomba API key (`ta_…`)                             |
| `TOMBA_API_SECRET`   | Tomba secret (`ts_…`)                              |
| `TOMBA_API_ENDPOINT` | Optional API base URL; only used by the test suite |

`.actor/actor.json` maps the variables to Apify secrets:

```bash
apify secrets add tombaApiKey ta_xxxxxxxxxxxxxxxxxxxx
apify secrets add tombaApiSecret ts_xxxxxxxxxxxxxxxxxxxx
apify push
```

When deploying from a linked Git repository instead, add `TOMBA_API_KEY` and `TOMBA_API_SECRET` as secret environment variables in the Actor settings.

Run locally:

```bash
TOMBA_API_KEY=ta_… TOMBA_API_SECRET=ts_… npm start
```

## Pricing (pay per event)

In **Apify Console → Publication → Monetization**, choose **Pay per event** and add:

| Event           | Price    | Charged when                                  |
| --------------- | -------- | --------------------------------------------- |
| `tomba-request` | $0.00312 | Tomba returns a billable response (see below) |

Author Finder costs 1 credit per billable URL (one `tomba-request` event); the item's `chargedCredits` is `res.chargedCount` (1, or 0 when not charged or cached). `webhookUrl` does not change the price.

`isBillable()` in `src/tomba.ts` mirrors Tomba's billing:

| Tomba outcome                                                      | Charged |
| ------------------------------------------------------------------ | ------- |
| JSON with non-empty `data`, including an author with `email: null` | Yes     |
| Error status (4xx, 5xx, including 422 and 429)                     | No      |
| Success with empty or null `data`                                  | No      |
| Success with an `errors` object                                    | No      |
| Non-JSON body (reported as 502)                                    | No      |
| Cache hit                                                          | No      |

## Architecture

- `src/tomba.ts`: shared helper, identical in every Tomba Actor. It handles credentials, caching (`tomba-cache` key-value store), retries with exponential backoff, pay-per-event charging, budget reservation, the concurrency pool and resume state.
- `src/main.ts`: trims and deduplicates `urls`, limits them to `maxResults`, calls `GET /author-finder?url=…` (`Finder.authorFinder(url, webhook_url)`) for each one and pushes one item per URL: the Tomba `data` object plus `input_url`, `source`, `chargedCredits`, `charged` and `cached`, or an `error` item with `email: null` and `chargedCredits: 0` when nothing billable came back. `webhook_url` is only sent when `webhookUrl` is non-blank and is part of the cache key.
- The `tomba` SDK v1.1.1 resolves every call to `{ data, rateLimit }`, where `data` is the response body. Its `.d.ts` types still declare the old return type, so always go through `callTomba()`.

## Tests

- `test/tomba.test.ts`: unit tests for the shared helper (identical in every Actor)
- `test/main.test.ts`: end-to-end tests that run `src/main.ts` against a local mock Tomba API
- `test/helpers.ts`: mock server and Actor runner (identical in every Actor)

Locally, the Apify SDK prices every event at $1 when `ACTOR_TEST_PAY_PER_EVENT=true`, so the tests use `maxTotalChargeUsd` as an event count.

## Standby mode (real-time API)

`.actor/actor.json` sets `usesStandbyMode: true` and `webServerSchema: ./web_server_schema.json` (OpenAPI 3).

- `src/standby.ts` (shared, identical in every Actor): `runActor()` runs a batch job, or, when `APIFY_META_ORIGIN=STANDBY`, starts an HTTP server on `Actor.config.get('containerPort')`.
    - `GET /` with the `x-apify-container-server-readiness-probe` header, or with no query: readiness / usage.
    - `GET /?…`: input built by `fromQuery()` from `url` / `urls` (repeated or comma-separated, so URLs containing commas need `POST`), `webhookUrl` and `maxResults`.
    - `POST /`: the same JSON input as a batch run.
    - Responses: `200 { items }`, `400` invalid input, `402` max charge limit reached, `404`, `405`.
- `run(input, ctx)` in `src/main.ts` is shared by both modes: `ctx.push()` writes to the dataset in batch runs and to the HTTP response in Standby; `ctx.isDone()`/`ctx.markDone()` persist resume state only in batch runs. Input errors throw `InputError` (failed run in batch, `400` in Standby).
- Caching and pay-per-event charging work the same in both modes.

Try it locally:

```bash
APIFY_META_ORIGIN=STANDBY ACTOR_WEB_SERVER_PORT=8080 TOMBA_API_KEY=ta_… TOMBA_API_SECRET=ts_… npm start
curl "localhost:8080/?url=https%3A%2F%2Fwww.shopify.com%2Fblog%2Fself-publish-a-book"
```

## Key-value store schema

`.actor/key_value_store_schema.json` documents the default key-value store records (`INPUT`, `TOMBA_STATE`). The cross-run cache lives in the separate named store `tomba-cache`.

## Memory

`defaultMemoryMbytes` is 256: the Actor only makes HTTP calls, so more memory just costs more.
