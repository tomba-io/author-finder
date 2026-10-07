// End-to-end tests: run the Actor against a mock Tomba API.
import assert from 'node:assert/strict';
import { after, afterEach, describe, it } from 'node:test';

import type { MockHandler, MockServer } from './helpers.js';
import { removeStorage, runActor, startMockTomba, totalCharges } from './helpers.js';

const ARTICLE = 'https://www.shopify.com/blog/self-publish-a-book';

const AUTHOR = {
    email: 'jane.doe@shopify.com',
    first_name: 'Jane',
    last_name: 'Doe',
    full_name: 'Jane Doe',
    website_url: 'shopify.com',
    company: 'Shopify',
    position: 'Content Writer',
    country: 'CA',
    gender: 'female',
    twitter: 'https://twitter.com/janedoe',
    linkedin: 'https://www.linkedin.com/in/janedoe',
    score: 96,
    accept_all: false,
    phone_number: false,
    verification: { date: '2025-10-17T00:00:00+02:00', status: 'valid' },
    sources: [
        {
            uri: ARTICLE,
            website_url: 'shopify.com',
            extracted_on: '2024-09-17T11:26:56+02:00',
            last_seen_on: '2025-09-06T04:51:06+02:00',
            still_on_page: true,
        },
    ],
};

/** Default Tomba behaviour, keyed on the article URL. */
const tomba: MockHandler = (req) => {
    assert.equal(req.method, 'GET');
    assert.equal(req.path, '/author-finder');
    const { url } = req.query;
    if (url.includes('emptyobj')) return { body: { data: {} } };
    if (url.includes('empty')) return { body: { data: null } };
    if (url.includes('noemail'))
        return {
            body: {
                data: { email: null, first_name: 'John', last_name: 'Smith', full_name: 'John Smith', score: 0 },
            },
        };
    if (url.includes('invalid')) return { status: 422, body: { errors: { message: 'Invalid url' } } };
    if (url.includes('html')) return { raw: '<html>Bad gateway</html>' };
    return { body: { data: AUTHOR } };
};

const servers: MockServer[] = [];
const dirs: string[] = [];

async function mock(handler: MockHandler = tomba): Promise<MockServer> {
    const server = await startMockTomba(handler);
    servers.push(server);
    return server;
}

async function run(...args: Parameters<typeof runActor>) {
    const result = await runActor(...args);
    dirs.push(result.storageDir);
    return result;
}

afterEach(async () => {
    await Promise.all(servers.splice(0).map(async (s) => s.close()));
});

after(async () => {
    await Promise.all(dirs.map(removeStorage));
});

describe('author-finder', () => {
    it('returns the author and charges one event per billable URL', async () => {
        const server = await mock();
        const result = await run({ input: { urls: [ARTICLE, 'https://example.com/empty'] }, endpoint: server.url });

        assert.equal(result.code, 0, result.output);
        assert.equal(server.requests.length, 2);
        const found = result.items.find((i) => i.input_url === ARTICLE);
        assert.deepEqual(found, {
            ...AUTHOR,
            input_url: ARTICLE,
            source: 'tomba_author_finder',
            chargedCredits: 1,
            charged: true,
            cached: false,
        });

        const empty = result.items.find((i) => i.input_url === 'https://example.com/empty');
        assert.deepEqual(empty, {
            input_url: 'https://example.com/empty',
            email: null,
            source: 'tomba_author_finder',
            chargedCredits: 0,
            charged: false,
            cached: false,
            error: 'No author found',
        });

        assert.deepEqual(result.chargeCounts, { 'tomba-request': 1 });
    });

    it('sends the built-in credentials and the URL to Tomba', async () => {
        const server = await mock();
        await run({ input: { urls: [ARTICLE] }, endpoint: server.url });
        assert.equal(server.requests.length, 1);
        assert.equal(server.requests[0].query.url, ARTICLE);
        assert.equal(server.requests[0].headers['x-tomba-key'], 'ta_test_key');
        assert.equal(server.requests[0].headers['x-tomba-secret'], 'ts_test_secret');
    });

    it('sends webhook_url only when it is set', async () => {
        const server = await mock();
        await run({ input: { urls: [ARTICLE] }, endpoint: server.url });
        await run({ input: { urls: [ARTICLE], webhookUrl: '   ' }, endpoint: server.url });
        const result = await run({
            input: { urls: [ARTICLE], webhookUrl: ' https://hooks.example.com/tomba ' },
            endpoint: server.url,
        });

        assert.deepEqual(
            server.requests.map((r) => r.query),
            [{ url: ARTICLE }, { url: ARTICLE }, { url: ARTICLE, webhook_url: 'https://hooks.example.com/tomba' }],
        );
        // A webhook does not change the price: still 1 credit per URL.
        assert.equal(result.items[0].chargedCredits, 1);
        assert.deepEqual(result.chargeCounts, { 'tomba-request': 1 });
    });

    it('trims and deduplicates URLs and ignores blank entries', async () => {
        const server = await mock();
        const result = await run({
            input: { urls: [`  ${ARTICLE}  `, ARTICLE, '', '   '] },
            endpoint: server.url,
        });
        assert.equal(result.code, 0, result.output);
        assert.deepEqual(
            server.requests.map((r) => r.query.url),
            [ARTICLE],
        );
        assert.equal(result.items.length, 1);
    });

    it('does not charge an empty data object', async () => {
        const server = await mock();
        const result = await run({ input: { urls: ['https://example.com/emptyobj'] }, endpoint: server.url });
        assert.equal(result.items[0].charged, false);
        assert.equal(result.items[0].email, null);
        assert.equal(result.items[0].error, 'No author found');
        assert.equal(totalCharges(result), 0);
    });

    it('charges a negative answer (author record without an email)', async () => {
        const server = await mock();
        const result = await run({ input: { urls: ['https://example.com/noemail'] }, endpoint: server.url });
        assert.equal(result.items.length, 1);
        assert.equal(result.items[0].email, null);
        assert.equal(result.items[0].full_name, 'John Smith');
        assert.equal(result.items[0].charged, true);
        assert.equal(result.items[0].error, undefined);
        assert.deepEqual(result.chargeCounts, { 'tomba-request': 1 });
    });

    it('does not charge Tomba error statuses and does not retry them', async () => {
        const server = await mock();
        const result = await run({ input: { urls: ['https://example.com/invalid'] }, endpoint: server.url });
        assert.equal(result.code, 0, result.output);
        assert.equal(server.requests.length, 1);
        assert.equal(result.items[0].charged, false);
        assert.equal(result.items[0].email, null);
        assert.match(String(result.items[0].error), /422: Invalid url/);
        assert.equal(totalCharges(result), 0);
    });

    it('does not charge a non-JSON body', async () => {
        const server = await mock();
        const result = await run({ input: { urls: ['https://example.com/html'] }, endpoint: server.url });
        assert.equal(result.items[0].charged, false);
        assert.match(String(result.items[0].error), /Invalid response/);
        assert.equal(totalCharges(result), 0);
    });

    it('retries 429 and 5xx responses, then charges the success once', async () => {
        let calls = 0;
        const server = await mock(async (req) => {
            calls++;
            if (calls === 1)
                return {
                    status: 429,
                    body: { errors: { message: 'Too many requests' } },
                    headers: { 'retry-after': '1' },
                };
            if (calls === 2) return { status: 503, body: {} };
            return tomba(req);
        });
        const result = await run({ input: { urls: [ARTICLE], maxRetries: 3 }, endpoint: server.url });
        assert.equal(server.requests.length, 3);
        assert.equal(result.items[0].charged, true);
        assert.equal(result.items[0].email, AUTHOR.email);
        assert.deepEqual(result.chargeCounts, { 'tomba-request': 1 });
    });

    it('serves repeated runs from the cache for free', async () => {
        const server = await mock();
        const first = await run({ input: { urls: [ARTICLE] }, endpoint: server.url });
        const second = await run({ input: { urls: [ARTICLE] }, endpoint: server.url, storageDir: first.storageDir });

        assert.equal(server.requests.length, 1);
        assert.equal(second.items.length, 1);
        assert.equal(second.items[0].email, AUTHOR.email);
        assert.equal(second.items[0].cached, true);
        assert.equal(second.items[0].charged, false);
        assert.equal(second.items[0].chargedCredits, 0);
        assert.equal(totalCharges(second), 0);
    });

    it('calls Tomba again when the cache is disabled', async () => {
        const server = await mock();
        const first = await run({ input: { urls: [ARTICLE], useCache: false }, endpoint: server.url });
        await run({ input: { urls: [ARTICLE], useCache: false }, endpoint: server.url, storageDir: first.storageDir });
        assert.equal(server.requests.length, 2);
    });

    it('stops at the max charge limit and resumes without reprocessing', async () => {
        const server = await mock();
        const urls = ['a', 'b', 'c', 'd', 'e'].map((p) => `https://example.com/${p}`);
        const input = { urls, maxConcurrency: 1, useCache: false, maxResults: 100 };

        // Locally every event costs $1, so a $2 budget allows two billable requests.
        const first = await run({ input, endpoint: server.url, maxTotalChargeUsd: 2 });
        assert.equal(first.code, 0, first.output);
        assert.equal(totalCharges(first), 2);
        assert.equal(server.requests.length, 2);
        assert.equal(first.items.length, 2);

        const second = await run({ input, endpoint: server.url, storageDir: first.storageDir, keepStorage: true });
        assert.equal(second.code, 0, second.output);
        assert.deepEqual(
            server.requests.map((r) => r.query.url),
            urls,
        );
        assert.equal(totalCharges(second), 5);
        assert.equal(second.items.length, 5);
    });

    it('respects maxResults', async () => {
        const server = await mock();
        const result = await run({
            input: { urls: ['https://a.com/1', 'https://b.com/2', 'https://c.com/3'], maxResults: 2 },
            endpoint: server.url,
        });
        assert.equal(server.requests.length, 2);
        assert.equal(result.items.length, 2);
        assert.equal(totalCharges(result), 2);
    });

    it('runs requests in parallel', async () => {
        let active = 0;
        let peak = 0;
        const server = await mock(async (req) => {
            active++;
            peak = Math.max(peak, active);
            await new Promise((r) => {
                setTimeout(r, 100);
            });
            active--;
            return tomba(req);
        });
        const urls = Array.from({ length: 8 }, (_, i) => `https://site${i}.com/post`);
        await run({ input: { urls, maxConcurrency: 4 }, endpoint: server.url });
        assert.equal(server.requests.length, 8);
        assert.ok(peak > 1 && peak <= 4, `peak concurrency ${peak}`);
    });

    it('fails without Tomba credentials and never calls the API', async () => {
        const server = await mock();
        const result = await run({ input: { urls: [ARTICLE] }, endpoint: server.url, withCredentials: false });
        assert.notEqual(result.code, 0);
        assert.match(result.output, /misconfigured/);
        assert.doesNotMatch(result.output, /ta_test_key|ts_test_secret/);
        assert.equal(server.requests.length, 0);
    });

    it('fails on empty input', async () => {
        const server = await mock();
        const result = await run({ input: { urls: [] }, endpoint: server.url });
        assert.notEqual(result.code, 0);
        assert.equal(server.requests.length, 0);
    });
});
