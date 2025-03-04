# Vercel Deployment Guide

## Current Issue

Your Vercel deployment is failing with the following error:

```
Error: Neither apiKey nor config.authenticator provided
```

This error is happening in the `/api/download-stl/route.js` file because the Stripe API key environment variables are missing in your Vercel deployment environment.

## How to Fix

1. **Log into your Vercel account** at https://vercel.com

2. **Go to your project dashboard**
   - Select the project you're trying to deploy

3. **Navigate to Project Settings**
   - Click on the "Settings" tab at the top of the project dashboard

4. **Add Environment Variables**
   - In the left sidebar, click on "Environment Variables"
   - Add the following environment variables from your `.env.local` file:
     - `STRIPE_SECRET_KEY` = `sk_test_placeholder` (replace with your actual Stripe secret key)
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_placeholder` (replace with your actual Stripe publishable key)
   - Click "Save" after adding each variable

5. **Redeploy Your Application**
   - Go to the "Deployments" tab
   - Find your latest deployment
   - Click the three dots menu (⋮) and select "Redeploy"

## Additional Environment Variables

If you see other API-related errors after fixing the Stripe issue, you may need to add these additional environment variables from your `.env.local` file:

- `CLAUDE_API_KEY` (if you're using Claude AI features)
- `NEXT_PUBLIC_APP_URL` (set to your Vercel deployment URL)
- `ADMIN_PASSWORD` = `nosurprises` (for your admin password functionality)

## Testing Your Deployment

After redeploying, verify that:
1. The site loads correctly
2. Admin features work with the password "nosurprises"
3. The STL download feature works properly

## Troubleshooting

If you continue to have issues:
- Check the Vercel build logs for specific error messages
- Make sure your Stripe API keys are valid
- Ensure that the Supabase client in `homegoods/lib/supabase.ts` is working correctly in the production environment
- Consider using environment variables for your Supabase credentials instead of hardcoding them 