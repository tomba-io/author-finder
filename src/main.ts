import { Actor, log } from 'apify';
import { Finder } from 'tomba';

import type { RunOptions } from './tomba.js';
import { callTomba, isBillable, logSummary, runPool, setupTomba, unique, useRunState } from './tomba.js';

interface ActorInput extends RunOptions {
    urls: string[];
    maxResults?: number;
    webhookUrl?: string;
}

const SOURCE = 'tomba_author_finder';

await Actor.init();

const input = await Actor.getInput<ActorInput>();
if (!input?.urls?.length) {
    await Actor.fail('Input must contain at least one URL in "urls".');
}

const { urls: rawUrls, maxResults = 50, webhookUrl, ...runOptions } = input!;
const webhook = typeof webhookUrl === 'string' && webhookUrl.trim() ? webhookUrl.trim() : undefined;
const client = await setupTomba(runOptions);
const finder = new Finder(client);
const state = await useRunState();

const urls = unique(rawUrls.map((url) => (typeof url === 'string' ? url.trim() : '')));
const doneCount = urls.filter((url) => state.done[url]).length;
const pending = urls.filter((url) => !state.done[url]).slice(0, Math.max(0, maxResults - doneCount));
if (doneCount > 0) {
    log.info(`Resuming: ${doneCount} URLs already processed.`);
}

const startedAt = Date.now();
log.info(`Finding authors for ${pending.length} URLs`, { webhook: Boolean(webhook) });

await runPool(pending, async (url) => {
    // Author Finder costs 1 credit per billable URL. `webhook_url` is only sent (and part of the cache key) when set.
    const params: { url: string; webhook_url?: string } = webhook ? { url, webhook_url: webhook } : { url };
    const res = await callTomba('author-finder', params, async () => finder.authorFinder(url, params.webhook_url));
    if (res.skipped) return;

    if (isBillable(res.body)) {
        const data = res.data as Record<string, unknown>;
        await Actor.pushData({
            ...data,
            input_url: url,
            source: SOURCE,
            chargedCredits: res.chargedCount ?? 0,
            charged: res.charged,
            cached: res.cached,
        });
        const author = data.full_name ?? data.email ?? 'no author found';
        log.info(`${url}: ${String(author)}${res.cached ? ' (cached)' : ''}`);
    } else {
        await Actor.pushData({
            input_url: url,
            email: null,
            source: SOURCE,
            chargedCredits: 0,
            charged: res.charged,
            cached: res.cached,
            error: res.error ?? 'No author found',
        });
        log.info(`${url}: ${res.error ?? 'no author found'}`);
    }

    state.done[url] = true;
});

logSummary('Author Finder', urls.length, startedAt);

await Actor.exit();
