# Tomba Author Finder

[![Price](https://img.shields.io/badge/Price-%243.12%20per%201K%20URLs-brightgreen)](#pricing)
[![No signup](https://img.shields.io/badge/Tomba%20account-not%20needed-blue)](#quick-start)
[![No rate limit](https://img.shields.io/badge/Rate%20limit-none-brightgreen)](#built-for-big-lists)

**Turn any article into a verified contact.** Paste blog post or article URLs and get the author's name, verified email address, position, company and social profiles, ready to export.

No Tomba account. No API key. No subscription. **You pay $0.00312 per URL, and only when we find something.**

## Why teams choose this Actor

- **Start in 30 seconds**: Open the Actor, paste your article URLs, click Start. Nothing to sign up for
- **Verified emails**: Each author email comes with its verification status and a confidence score
- **Pay only for results**: URLs with no author, errors and invalid inputs are free
- **$3.12 per 1,000 URLs**: No monthly plan, no credits that expire, no minimum spend
- **Built for big lists**: No rate limit. Thousands of URLs run in parallel
- **Never pay twice**: URLs you looked up in the last 24 hours come back from cache for free
- **Export anywhere**: Download as CSV, Excel or JSON, or send results straight to your CRM with Apify integrations

## Promises we actually keep

- **Less than 5% bounce rate** — Every email is verified in real time before you're charged.
- **Highest coverage on the market** — 81% email coverage. That's 2x more valid emails than the next best competitor. We find contacts others simply can't.

## What you can do with it

| Goal                        | How author data helps                                                 |
| --------------------------- | --------------------------------------------------------------------- |
| **Pitch journalists**       | Reach the writers who already cover your topic, with a verified email |
| **Land guest posts**        | Contact the authors of the blogs you want to appear on                |
| **Run influencer outreach** | Build lists of content creators and thought leaders in your niche     |
| **Earn backlinks**          | Find the person behind every article that mentions your competitors   |
| **Research and interviews** | Reach experts and researchers for quotes, interviews or collaboration |

## Quick start

1. Click **Try for free**
2. Paste your article or blog post URLs into **URLs to Process**
3. Click **Start**, then download your results as CSV, Excel or JSON

That's it. No Tomba account or API key is needed.

## Input

| Field            | Required | Default | Description                                                    |
| ---------------- | -------- | ------- | -------------------------------------------------------------- |
| `urls`           | Yes      |         | Article, blog post or author page URLs to analyze              |
| `maxResults`     | No       | `50`    | Maximum number of URLs to process (one result per URL)         |
| `webhookUrl`     | No       |         | Your own `http(s)://` URL that Tomba also sends each result to |
| `maxConcurrency` | No       | `10`    | How many URLs to process at the same time (1–50)               |
| `maxRetries`     | No       | `3`     | How many times to retry a temporary failure (0–10)             |
| `useCache`       | No       | `true`  | Reuse results from your previous runs for free                 |
| `cacheTtlHours`  | No       | `24`    | How long cached results stay valid (`0` turns the cache off)   |

```json
{
    "urls": [
        "https://www.shopify.com/blog/self-publish-a-book",
        "https://blog.hubspot.com/marketing/content-marketing"
    ],
    "maxResults": 100
}
```

Duplicate URLs and blank lines are removed automatically.

## Output

You get one row per URL:

```json
{
    "email": "jane.doe@shopify.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "full_name": "Jane Doe",
    "website_url": "shopify.com",
    "company": "Shopify",
    "position": "Content Writer",
    "country": "CA",
    "gender": "female",
    "twitter": "https://twitter.com/janedoe",
    "linkedin": "https://www.linkedin.com/in/janedoe",
    "score": 96,
    "accept_all": false,
    "phone_number": false,
    "verification": {
        "date": "2025-10-17T00:00:00+02:00",
        "status": "valid"
    },
    "sources": [
        {
            "uri": "https://www.shopify.com/blog/self-publish-a-book",
            "website_url": "shopify.com",
            "extracted_on": "2024-09-17T11:26:56+02:00",
            "last_seen_on": "2025-09-06T04:51:06+02:00",
            "still_on_page": true
        }
    ],
    "input_url": "https://www.shopify.com/blog/self-publish-a-book",
    "source": "tomba_author_finder",
    "chargedCredits": 1,
    "charged": true,
    "cached": false
}
```

| Field                                  | Description                                                  |
| -------------------------------------- | ------------------------------------------------------------ |
| `input_url`                            | The URL you submitted                                        |
| `email`                                | Author's email address (`null` if none was found)            |
| `first_name`, `last_name`, `full_name` | Author's name                                                |
| `position`, `company`                  | Author's job title and company                               |
| `website_url`                          | Website associated with the author                           |
| `country`, `gender`                    | Author's country and gender, when known                      |
| `twitter`, `linkedin`                  | Author's social profiles, when known                         |
| `score`                                | Confidence score from 0 to 100                               |
| `verification`                         | Email verification date and status (e.g. `valid`)            |
| `accept_all`                           | `true` if the email domain accepts all addresses (catch-all) |
| `phone_number`                         | Whether a phone number is available for the author           |
| `sources`                              | Public pages where the email was found, with dates           |
| `source`                               | Always `tomba_author_finder`                                 |
| `chargedCredits`                       | Credits billed for this URL ($0.00312 each)                  |
| `charged`                              | `true` if this lookup was billed                             |
| `cached`                               | `true` if this result came from the cache (free)             |
| `error`                                | Why no author was returned, if applicable                    |

Fields Tomba has no data for are left empty. The dataset has three ready-made views: **Overview**, **Detailed View** and **Source Analysis**.

## Pricing

**$0.00312 per URL ($3.12 per 1,000).** No subscription and no Tomba account needed.

Tomba charges **1 credit per URL with an answer**, and one credit costs $0.00312:

| Lookup                          | Credits | Cost     |
| ------------------------------- | ------- | -------- |
| Author found for the URL        | 1       | $0.00312 |
| Same lookup with a `webhookUrl` | 1       | $0.00312 |
| 1,000 URLs with an author       | 1,000   | $3.12    |

You are only charged when Tomba returns a usable answer:

| What happens                                    | Charged |
| ----------------------------------------------- | ------- |
| Author found for the URL                        | Yes     |
| Author identified, but no email address found   | Yes     |
| No author found for the URL                     | No      |
| Invalid URL or any other error                  | No      |
| Temporary failure (it is retried automatically) | No      |
| Result served from the cache                    | No      |

Every row shows `chargedCredits`, `charged` and `cached`, so you always know what you paid for. To cap your spend, set **Maximum cost per run** in the run options: the Actor stops cleanly when the limit is reached.

## Built for big lists

- **No rate limit**: up to 50 URLs are processed at the same time
- **Automatic retries**: temporary failures are retried for you, and never billed
- **Resumable**: if a run is interrupted, it continues where it stopped without charging you again
- **Cache**: repeat lookups within 24 hours are free

## Real-time API

Need results instantly inside your own app? This Actor also runs as a **real-time API** (Apify Standby mode): no run to start, no dataset to fetch, just an HTTP request that returns JSON in seconds. Pricing is the same.

Look up one or more articles with a `GET` request (URL-encode each `url`, and repeat the parameter for several URLs):

```bash
curl "https://<your-standby-url>/?url=https%3A%2F%2Fwww.shopify.com%2Fblog%2Fself-publish-a-book" \
  -H "Authorization: Bearer <YOUR_APIFY_TOKEN>"
```

You can also `POST` the same JSON input as a normal run (best for long lists or URLs that contain commas):

```bash
curl -X POST "https://<your-standby-url>/" \
  -H "Authorization: Bearer <YOUR_APIFY_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://www.shopify.com/blog/self-publish-a-book", "https://stripe.com/blog/payment-api-design"], "maxResults": 20}'
```

The response is `{ "items": [...] }`, with the same rows as the dataset. Find your Standby URL and the full OpenAPI description in the **API** tab of this Actor.

## Integrations

Run it on a schedule, call it from the Apify API, or connect it to Zapier, Make, Google Sheets, HubSpot, Slack and hundreds of other apps with [Apify integrations](https://docs.apify.com/platform/integrations). Webhooks let you trigger your own workflow as soon as a run finishes.

## FAQ

**Do I need a Tomba account or API key?**
No. Everything is built in. You only pay the per-URL price on Apify.

**How much does it cost?**
$0.00312 per URL with results ($3.12 per 1,000). URLs with no author, errors and cached lookups are free.

**Can I send the results to my own system?**
Yes. Besides Apify integrations, you can set **Webhook URL** and Tomba also sends each result to your endpoint. It costs nothing extra.

**Does it find phone numbers?**
Each result tells you in `phone_number` whether Tomba has a phone number for the author. To get the number itself, run the author's email or LinkedIn profile through Tomba Phone Finder.

**Which pages work best?**
Blog posts, news articles and author bio pages with a clear byline. Pages without an author usually return nothing, and those are free.

**How many URLs can I process in one run?**
Up to 1,000 per run, processed in parallel. There is no rate limit.

**Are the emails verified?**
Yes. Each email comes with its verification status and a confidence score, so you can filter before you send.

**What if my run is interrupted?**
It picks up where it stopped. URLs already processed are not charged again.

**How do I limit what I spend?**
Set **Maximum cost per run** before you start. The Actor stops as soon as the limit is reached.

## Support

Questions or feedback? We're happy to help:

- **Email**: support@tomba.io
- **Live chat**: on [tomba.io](https://tomba.io) during business hours
- **Issues**: use the **Issues** tab on this Actor's page

## About Tomba

Founded in 2020, [Tomba](https://tomba.io) is a B2B data platform for finding, verifying and enriching business contacts. Our Email Finder, Domain Search and Email Verifier help sales and marketing teams reach the right people.

![Tomba Logo](https://tomba.io/logo.png)
