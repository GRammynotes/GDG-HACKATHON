# Vercel Deployment Guide - Smart Study Planner

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
2. **GitHub/GitLab/Bitbucket Account**: Your code should be in a Git repository
3. **Environment Variables**: Have your Firebase and Gemini API keys ready

## Quick Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository

3. **Configure Project**
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyAw_NAMKL2DFLWw_swXH378EhQMvlblaFw
   VITE_FIREBASE_AUTH_DOMAIN=ai-nstein-crew.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=ai-nstein-crew
   VITE_FIREBASE_STORAGE_BUCKET=ai-nstein-crew.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=808116588830
   VITE_FIREBASE_APP_ID=1:808116588830:web:072ba286a394c3fc25390f
   VITE_FIREBASE_MEASUREMENT_ID=G-PTV77V963D
   VITE_GEMINI_API_KEY=AIzaSyB9r7oNZQYPCgLoXgjdo5TWUrRARQKYdow
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 2-3 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No** (first time) or **Yes** (subsequent deployments)
   - Project name? Enter a name or press Enter for default
   - Directory? `./` (default)
   - Override settings? **No**

4. **Add Environment Variables**
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   vercel env add VITE_FIREBASE_PROJECT_ID
   vercel env add VITE_FIREBASE_STORAGE_BUCKET
   vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
   vercel env add VITE_FIREBASE_APP_ID
   vercel env add VITE_FIREBASE_MEASUREMENT_ID
   vercel env add VITE_GEMINI_API_KEY
   ```
   
   For each variable, enter the value when prompted.

5. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

## Environment Variables Configuration

### Required Variables

All environment variables must be prefixed with `VITE_` to be accessible in the browser.

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `ai-nstein-crew` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID | `G-XXXXXXXXXX` |
| `VITE_GEMINI_API_KEY` | Gemini AI API Key | `AIzaSy...` |

### Setting Environment Variables in Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `VITE_FIREBASE_API_KEY`)
   - **Value**: Your actual API key
   - **Environment**: Select **Production**, **Preview**, and **Development**
4. Click **Save**

### Setting Environment Variables via CLI

```bash
# Add for all environments
vercel env add VITE_FIREBASE_API_KEY production preview development

# Or add for specific environment
vercel env add VITE_FIREBASE_API_KEY production
```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test authentication (login/register)
- [ ] Test Firebase connection (check browser console)
- [ ] Test AI summary generation
- [ ] Test quiz generation
- [ ] Verify all routes work (SPA routing)
- [ ] Check Firebase Security Rules allow your Vercel domain
- [ ] Test on mobile devices

## Firebase Security Rules Update

After deployment, update your Firebase Security Rules to allow your Vercel domain:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow requests from your Vercel domain
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /progress/{progressId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /quizzes/{quizId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /quizResults/{resultId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /subjectSummaries/{summaryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Custom Domain Setup (Optional)

1. Go to **Settings** → **Domains** in Vercel Dashboard
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic, usually takes a few minutes)

## Troubleshooting

### Build Fails

**Error: Module not found**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: Environment variable not found**
- Check variable names start with `VITE_`
- Verify variables are set in Vercel Dashboard
- Redeploy after adding variables

### App Works Locally but Not on Vercel

**Check:**
1. Environment variables are set correctly
2. Firebase project allows your Vercel domain
3. CORS settings in Firebase
4. Browser console for errors

### SPA Routing Issues (404 on refresh)

The `vercel.json` file includes rewrites to handle this. If issues persist:
- Verify `vercel.json` is in root directory
- Check that rewrites are configured correctly

### API Errors

**Gemini API 404:**
- Verify `VITE_GEMINI_API_KEY` is set
- Check API key is valid
- Ensure API quota is not exceeded

**Firebase Errors:**
- Verify all Firebase environment variables
- Check Firebase project is active
- Verify Firebase Security Rules

## Continuous Deployment

Vercel automatically deploys on every push to your main branch:
- **Production**: Deploys from `main` branch
- **Preview**: Deploys from other branches/PRs

To disable auto-deployment:
1. Go to **Settings** → **Git**
2. Unlink repository or disable auto-deployment

## Performance Optimization

Vercel automatically:
- ✅ Optimizes images
- ✅ Minifies JavaScript/CSS
- ✅ Enables CDN caching
- ✅ Provides SSL certificates
- ✅ Optimizes for Core Web Vitals

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Vite Docs**: [vitejs.dev](https://vitejs.dev)

## Deployment URL

After successful deployment, your app will be available at:
- **Production**: `https://your-project-name.vercel.app`
- **Preview**: `https://your-project-name-git-branch.vercel.app`

Share this URL with your users! 🚀

