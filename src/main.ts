import { log } from 'apify';
import { Finder } from 'tomba';

import { InputError, queryInt, queryList, queryString, runActor } from './standby.js';
import type { RunOptions } from './tomba.js';
import { callTomba, getClient, isBillable, runPool, unique } from './tomba.js';

interface ActorInput extends RunOptions {
    urls?: string[];
    maxResults?: number;
    webhookUrl?: string;
}

const SOURCE = 'tomba_author_finder';

await runActor<ActorInput>({
    title: 'Author Finder',
    count: (input) => input.urls?.length ?? 0,
    fromQuery: (query) => ({
        urls: queryList(query, 'url', 'urls'),
        webhookUrl: queryString(query, 'webhookUrl'),
        maxResults: queryInt(query, 'maxResults'),
    }),
    run: async (input, { push, isDone, markDone, standby }) => {
        if (!Array.isArray(input.urls) || !input.urls.length) {
            throw new InputError('Input must contain at least one URL in "urls".');
        }

        const maxResults = input.maxResults ?? 50;
        const { webhookUrl } = input;
        const webhook = typeof webhookUrl === 'string' && webhookUrl.trim() ? webhookUrl.trim() : undefined;
        const finder = new Finder(getClient());

        const urls = unique(input.urls.map((url) => (typeof url === 'string' ? url.trim() : '')));
        const doneCount = urls.filter((url) => isDone(url)).length;
        const pending = urls.filter((url) => !isDone(url)).slice(0, Math.max(0, maxResults - doneCount));
        if (doneCount > 0) {
            log.info(`Resuming: ${doneCount} URLs already processed.`);
        }
        if (!standby) log.info(`Finding authors for ${pending.length} URLs`, { webhook: Boolean(webhook) });

        await runPool(pending, async (url) => {
            // Author Finder costs 1 credit per billable URL. `webhook_url` is only sent (and part of the cache key) when set.
            const params: { url: string; webhook_url?: string } = webhook ? { url, webhook_url: webhook } : { url };
            const res = await callTomba('author-finder', params, async () =>
                finder.authorFinder(url, params.webhook_url),
            );
            if (res.skipped) return;

            if (isBillable(res.body)) {
                const data = res.data as Record<string, unknown>;
                await push({
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
                await push({
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

            markDone(url);
        });
    },
});
