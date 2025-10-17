// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from 'apify';
// Tomba SDK for author finding
import { Finder, TombaClient } from 'tomba';

interface ActorInput {
    tombaApiKey: string;
    tombaApiSecret: string;
    urls?: string[];
    maxResults?: number;
}

// Rate limiting: 150 requests per minute
const RATE_LIMIT = 150;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
let requestCount = 0;
let windowStart = Date.now();

async function rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Reset counter if window has passed
    if (now - windowStart > RATE_LIMIT_WINDOW) {
        requestCount = 0;
        windowStart = now;
    }

    // Check if we've hit the rate limit
    if (requestCount >= RATE_LIMIT) {
        const waitTime = RATE_LIMIT_WINDOW - (now - windowStart);
        console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
        await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), waitTime);
        });

        // Reset after waiting
        requestCount = 0;
        windowStart = Date.now();
    }

    requestCount++;
    return await requestFn();
}

// The init() call configures the Actor for its environment
await Actor.init();

try {
    // Get input from the Actor
    const input = (await Actor.getInput()) as ActorInput;

    if (!input) {
        throw new Error('No input provided');
    }

    if (!input.tombaApiKey || !input.tombaApiSecret) {
        throw new Error('Tomba API key and secret are required');
    }

    console.log('Starting Tomba Author Finder Actor...');
    console.log(`Processing ${input.urls?.length || 0} URLs`);

    // Initialize Tomba client
    const client = new TombaClient();
    const finder = new Finder(client);

    client.setKey(input.tombaApiKey).setSecret(input.tombaApiSecret);

    const results: unknown[] = [];
    const maxResults = input.maxResults || 50;

    // Process URLs
    if (input.urls && input.urls.length > 0) {
        console.log(`Processing ${input.urls.length} URLs...`);

        for (const url of input.urls) {
            if (results.length >= maxResults) break;

            try {
                console.log(`Finding authors for URL: ${url}`);

                // Use Tomba's authorFinder method with rate limiting
                const tombaResult = await rateLimitedRequest(async () => finder.authorFinder(url));

                if (tombaResult && tombaResult.data) {
                    // Handle the response structure - tombaResult.data contains the author info
                    const authorData = tombaResult.data;

                    if (authorData.first_name) {
                        results.push(authorData);
                        console.log(`Found author: ${authorData.full_name} (${authorData.email})`);
                    }
                }
            } catch (error) {
                console.log(`Error processing URL ${url}:`, error);
            }
        }
    }

    if (results.length > 0) {
        await Actor.pushData(results);
    }

    // Log summary
    console.log('=== SUMMARY ===');
    console.log(`Total authors found: ${results.length}`);
} catch (error) {
    console.error('Actor failed:', error);
    throw error;
}

await Actor.exit();
