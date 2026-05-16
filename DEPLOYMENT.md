# Deployment Guide

## Setting Up Environment Variables in Vercel

Since your app now uses a serverless function to proxy API calls, you need to configure environment variables in Vercel instead of using `config.js`.

### Steps:

1. **Go to your Vercel project dashboard**
   - Navigate to https://vercel.com/dashboard
   - Select your project

2. **Open Settings**
   - Click on "Settings" tab
   - Click on "Environment Variables" in the left sidebar

3. **Add the following environment variables:**

   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `WATSONX_API_KEY` | Your IBM Cloud API key | Found in your IBM Cloud account |
   | `WATSONX_PROJECT_ID` | Your watsonx.ai project ID | From your watsonx.ai project |
   | `WATSONX_ENDPOINT` | `https://us-south.ml.cloud.ibm.com` | IBM Cloud endpoint |
   | `WATSONX_MODEL` | `ibm/granite-3-8b-instruct` | Model ID you're using |

4. **Set environment for each variable:**
   - Select "Production", "Preview", and "Development" for all variables
   - This ensures they work in all deployment environments

5. **Redeploy your application**
   - After adding all variables, trigger a new deployment
   - You can do this by pushing a new commit or using the "Redeploy" button in Vercel

### Important Notes:

- **config.js is now obsolete** - The app no longer uses it since all API calls go through the serverless function
- **config.js is gitignored** - Your sensitive credentials won't be committed to the repository
- **CORS errors are resolved** - The serverless function handles all external API calls server-side

### Testing Locally (Optional)

If you want to test the serverless function locally:

1. Install Vercel CLI: `npm i -g vercel`
2. Create a `.env` file in your project root with the same variables
3. Run: `vercel dev`
4. Your app will be available at `http://localhost:3000`

### Troubleshooting

If you encounter issues after deployment:

1. **Check environment variables** - Ensure all 4 variables are set correctly in Vercel
2. **Check function logs** - Go to your Vercel project → Deployments → Click on a deployment → Functions tab
3. **Verify API key** - Make sure your IBM Cloud API key has the necessary permissions
4. **Check project ID** - Ensure the watsonx.ai project ID is correct

### What Changed

- ✅ Created `/api/decode.js` - Serverless function that proxies API calls
- ✅ Updated `app.js` - Now calls `/api/decode` instead of direct API calls
- ✅ Removed direct browser calls to IBM Cloud APIs
- ✅ Added proper CORS headers in the serverless function
- ✅ Credentials now stored securely in Vercel environment variables