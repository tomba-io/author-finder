# Tomba Author Finder Actor

[![Actor](https://img.shields.io/badge/Apify-Actor-blue)](https://apify.com/actors)
[![Tomba API](https://img.shields.io/badge/Tomba-API-green)](https://tomba.io)
[![Rate Limit](https://img.shields.io/badge/Rate%20Limit-150%2Fmin-orange)](https://tomba.io/api)

A powerful Apify Actor that discovers and extracts author information from web pages using the **Tomba Author Finder API**. Perfect for content creators, researchers, and marketers who need to identify and verify author details from articles, blog posts, and web content.

## Key Features

- **Author Discovery**: Extract author information directly from web page URLs
- **Email Verification**: Get verified email addresses with confidence scores
- **Professional Details**: Company, position, and contact information
- **Social Profiles**: Twitter, LinkedIn, and other social media links
- **Bulk Processing**: Process multiple URLs efficiently with rate limiting
- **Rate Limited**: Respects Tomba's 150 requests per minute limit
- **Rich Data Output**: Comprehensive author profiles with metadata
- **Built-in Verification**: Email validation and confidence scoring

## How it works

The Actor leverages Tomba's powerful Author Finder API to extract comprehensive author information:

### Process Flow

1. **Authentication**: Connects to Tomba API using your credentials
2. **Input Processing**: Accepts array of URLs to analyze
3. **Author Discovery**: Uses Tomba's `authorFinder` method for each URL
4. **Data Validation**: Processes and validates author information
5. **Rate Limiting**: Automatically handles 150 requests/minute limit
6. **Data Storage**: Saves results to Apify dataset

### What You Get

For each discovered author, you'll receive:

- **Personal Info**: First name, last name, full name
- **Email Details**: Verified email address with confidence score
- **Professional**: Company, position, website URL
- **Location**: Country information (when available)
- **Social Media**: Twitter, LinkedIn profiles
- **Source Tracking**: Multiple sources where author was found
- **Verification**: Email validation status and metadata

## Quick Start

### Prerequisites

1. **Tomba Account**: Sign up at [Tomba.io](https://app.tomba.io/api) to get your API credentials

### Getting Your API Keys

1. Visit [Tomba API Dashboard](https://app.tomba.io/api)
2. Copy your **API Key** (starts with `ta_`)
3. Copy your **Secret Key** (starts with `ts_`)

## Input Configuration

### Required Parameters

| Parameter        | Type     | Description                            |
| ---------------- | -------- | -------------------------------------- |
| `tombaApiKey`    | `string` | Your Tomba API key (ta_xxxx)           |
| `tombaApiSecret` | `string` | Your Tomba secret key (ts_xxxx)        |
| `urls`           | `array`  | ` Array of URLs to analyze for authors |

### Optional Parameters

| Parameter    | Type     | Default | Description                         |
| ------------ | -------- | ------- | ----------------------------------- |
| `maxResults` | `number` | `50`    | Maximum number of results to return |

### Example Input

```json
{
    "tombaApiKey": "ta_xxxxxxxxxxxxxxxxxxxx",
    "tombaApiSecret": "ts_xxxxxxxxxxxxxxxxxxxx",
    "urls": [
        "https://www.shopify.com/blog/self-publish-a-book",
        "https://blog.hubspot.com/marketing/content-marketing",
        "https://techcrunch.com/2023/01/15/startup-funding/"
    ],
    "maxResults": 100
}
```

### Best Practices

- **URL Selection**: Choose pages that likely contain author information (blog posts, articles, about pages)
- **Rate Limits**: The Actor automatically handles Tomba's 150 requests/minute limit
- **Batch Size**: Process 10-50 URLs at a time for optimal performance

## Output Data Structure

The Actor returns detailed author information for each discovered author:

```json
{
    "email": "author@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "website_url": "example.com",
    "company": "Example Corp",
    "position": "Content Writer",
    "country": "US",
    "twitter": "https://twitter.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "score": 95,
    "verification": {
        "date": "2025-10-17T00:00:00+02:00",
        "status": "valid"
    },
    "sources": [
        {
            "uri": "https://example.com/blog/article",
            "website_url": "example.com",
            "extracted_on": "2024-09-17T11:26:56+02:00",
            "last_seen_on": "2025-09-06T04:51:06+02:00",
            "still_on_page": true
        }
    ]
}
```

### Data Fields Explained

- **Email Verification**: `verification.status` shows email validity
- **Confidence Score**: `score` (0-100) indicates data reliability
- **Source Tracking**: `sources` array shows where author was found
- **Time Stamps**: Track when data was extracted and last verified
- **Multi-Source**: Authors may be found across multiple pages

## Use Cases

- **Content Attribution**: Identify authors of articles and blog posts
- **Email Outreach**: Find verified contact information for content creators
- **Research**: Academic and journalistic research on authorship
- **Marketing**: Build contact lists for influencer outreach
- **Verification**: Validate author information across sources

## Resources & Documentation

### API Documentation

- [Tomba API Docs](https://tomba.io/api) - Complete API reference
- [Authentication Guide](https://app.tomba.io/api) - Get your API keys
- [Pricing & Limits](https://tomba.io/pricing) - Understand rate limits and costs

### Rate Limiting

- Tomba limits to **150 requests per minute**
- Actor automatically handles rate limiting with delays
- Large batches may take time to complete

### Cost Considerations

- Each URL processed = 1 Tomba API request
- Monitor your Tomba usage dashboard
- Consider Tomba's pricing tiers for volume usage
