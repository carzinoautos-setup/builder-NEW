# Vercel Deployment Guide

## Environment Variables Setup

Add these environment variables to your Vercel project:

### 1. Builder.io Configuration

```
VITE_BUILDER_API_KEY=your_builder_io_api_key_here
```

### 2. WooCommerce REST API Configuration

```
VITE_WC_API_URL=https://your-store.com
VITE_WC_CONSUMER_KEY=ck_your_consumer_key_here
VITE_WC_CONSUMER_SECRET=cs_your_consumer_secret_here
```

## How to Set Environment Variables in Vercel

### Option 1: Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. Add each variable:
   - Name: `VITE_BUILDER_API_KEY`
   - Value: Your Builder.io API key
   - Environment: All (Production, Preview, Development)

### Option 2: Vercel CLI

```bash
vercel env add VITE_BUILDER_API_KEY
vercel env add VITE_WC_API_URL
vercel env add VITE_WC_CONSUMER_KEY
vercel env add VITE_WC_CONSUMER_SECRET
```

### Option 3: Using Vercel Secrets (Recommended for sensitive data)

```bash
# Add secrets
vercel secrets add builder-api-key "your_builder_io_api_key"
vercel secrets add wc-api-url "https://your-store.com"
vercel secrets add wc-consumer-key "ck_your_consumer_key"
vercel secrets add wc-consumer-secret "cs_your_consumer_secret"

# Reference in vercel.json (already configured)
```

## Getting Your Keys

### Builder.io API Key

1. Go to [Builder.io](https://builder.io)
2. Login to your account
3. Go to your space settings
4. Copy your API key from the "API Keys" section

### WooCommerce REST API Keys

1. Login to your WordPress admin
2. Go to WooCommerce → Settings → Advanced → REST API
3. Click "Create an API key"
4. Set permissions to "Read"
5. Copy the Consumer Key and Consumer Secret

## Build Configuration

The project will automatically build for Vercel with:

- Vite build for the frontend (`pnpm build:client`)
- Node.js functions for API endpoints
- Static file serving for the React SPA

## Deployment Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Routes Configuration

- `/` - Main React app
- `/builder-inventory` - Builder.io powered inventory page
- `/api/*` - Backend API endpoints

## Troubleshooting

### Build Errors

- Check that all environment variables are set
- Verify WooCommerce API keys have correct permissions
- Ensure Builder.io API key is valid

### Runtime Errors

- Check browser console for API connection issues
- Verify WooCommerce store URL is accessible
- Test Builder.io content exists for your models

### Performance

- Enable caching for WooCommerce API responses
- Use Vercel Edge Functions for better performance
- Optimize Builder.io content delivery
