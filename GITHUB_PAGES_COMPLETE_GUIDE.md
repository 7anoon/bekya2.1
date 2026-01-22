# Complete Guide: Deploy to GitHub Pages 🚀

## What are VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY?

These are **secret keys** that connect your app to Supabase database. They're currently in your `.env` file (which is NOT uploaded to GitHub for security).

When deploying to GitHub Pages, we need to add them as **Secrets** so GitHub can use them during build.

---

## Step-by-Step Guide

### STEP 1: Find Your Supabase Keys 🔑

#### Option A: From your `.env` file

1. Open the file `.env` in your project
2. You'll see something like:

```env
VITE_SUPABASE_URL=https://kxuvoovqvtwhtxjnnboo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dXZvb3ZxdnR3aHR4am5uYm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjI3NzcsImV4cCI6MjA1MjUzODc3N30.abc123...
```

3. **Copy these two values** - you'll need them!

#### Option B: From Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/kxuvoovqvtwhtxjnnboo/settings/api
2. You'll see:
   - **Project URL** → This is your `VITE_SUPABASE_URL`
   - **anon public** key → This is your `VITE_SUPABASE_ANON_KEY`

---

### STEP 2: Add Secrets to GitHub 🔐

Now we'll add these keys to GitHub so it can use them when building your app.

#### 2.1 Go to Secrets Page

Click this link (or follow manually):
👉 **https://github.com/7anoon/bekya/settings/secrets/actions**

**Manual way:**
1. Go to your repository: https://github.com/7anoon/bekya
2. Click **"Settings"** (top menu)
3. In left sidebar, click **"Secrets and variables"** → **"Actions"**

#### 2.2 Add First Secret (VITE_SUPABASE_URL)

1. Click the green button **"New repository secret"**
2. Fill in:
   - **Name:** `VITE_SUPABASE_URL`
   - **Secret:** Paste your Supabase URL (example: `https://kxuvoovqvtwhtxjnnboo.supabase.co`)
3. Click **"Add secret"**

#### 2.3 Add Second Secret (VITE_SUPABASE_ANON_KEY)

1. Click **"New repository secret"** again
2. Fill in:
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Secret:** Paste your long anon key (starts with `eyJhbGciOi...`)
3. Click **"Add secret"**

✅ **Done!** You should now see 2 secrets listed.

---

### STEP 3: Enable GitHub Pages 📄

Now we tell GitHub to publish your app.

#### 3.1 Go to Pages Settings

Click this link:
👉 **https://github.com/7anoon/bekya/settings/pages**

**Manual way:**
1. Go to your repository: https://github.com/7anoon/bekya
2. Click **"Settings"** (top menu)
3. In left sidebar, scroll down and click **"Pages"**

#### 3.2 Configure Source

1. Under **"Build and deployment"**
2. Find **"Source"** dropdown
3. Select: **"GitHub Actions"** (NOT "Deploy from a branch")
4. That's it! No need to click save - it auto-saves.

---

### STEP 4: Trigger Deployment 🚀

The deployment will start automatically! But if it doesn't:

#### 4.1 Check Actions

Go to: https://github.com/7anoon/bekya/actions

You should see a workflow running (yellow circle 🟡)

#### 4.2 If No Workflow is Running

Make a small change to trigger it:

```bash
# In your project terminal, run:
git commit --allow-empty -m "Trigger deployment"
git push
```

---

### STEP 5: Wait for Deployment ⏳

1. Go to: https://github.com/7anoon/bekya/actions
2. Click on the running workflow
3. Wait for all steps to complete (2-3 minutes)
4. When you see green checkmarks ✅, it's done!

---

### STEP 6: Visit Your App! 🎉

Your app will be live at:

```
https://7anoon.github.io/bekya/
```

---

## Troubleshooting 🔧

### Problem: "Secrets not found"

**Solution:** Make sure you added BOTH secrets with EXACT names:
- `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` (not `SUPABASE_KEY`)

### Problem: "404 Page Not Found"

**Solution:** 
1. Check that GitHub Pages source is set to "GitHub Actions"
2. Wait 5 minutes after deployment completes
3. Try: https://7anoon.github.io/bekya/ (with trailing slash)

### Problem: "Build Failed"

**Solution:**
1. Go to Actions tab
2. Click on the failed workflow
3. Check the error message
4. Usually it's missing secrets or wrong secret names

---

## Visual Summary 📊

```
┌─────────────────────────────────────────────────────────┐
│ 1. Get Keys from .env or Supabase Dashboard            │
│    ↓                                                     │
│ 2. Add to GitHub Secrets                                │
│    - VITE_SUPABASE_URL                                  │
│    - VITE_SUPABASE_ANON_KEY                             │
│    ↓                                                     │
│ 3. Enable GitHub Pages (Source: GitHub Actions)        │
│    ↓                                                     │
│ 4. Push code or trigger workflow                        │
│    ↓                                                     │
│ 5. Wait for build (2-3 minutes)                         │
│    ↓                                                     │
│ 6. Visit: https://7anoon.github.io/bekya/              │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Checklist ✅

Before you start:
- [ ] I have my `.env` file with Supabase keys
- [ ] I'm logged into GitHub

Steps:
- [ ] Added `VITE_SUPABASE_URL` secret
- [ ] Added `VITE_SUPABASE_ANON_KEY` secret
- [ ] Set Pages source to "GitHub Actions"
- [ ] Workflow is running in Actions tab
- [ ] Waited for green checkmarks
- [ ] Visited https://7anoon.github.io/bekya/

---

## Need Help? 🆘

If you get stuck:
1. Check the Actions tab for error messages
2. Verify secret names are EXACTLY correct
3. Make sure both secrets are added
4. Wait at least 5 minutes after deployment

---

## Alternative: Deploy to Netlify (Easier!) 🌟

If GitHub Pages is too complicated, Netlify is much easier:

1. Go to: https://app.netlify.com
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose your `bekya` repository
5. Add environment variables (same keys)
6. Click "Deploy"
7. Done! You get a URL like: `https://bekya.netlify.app`

**Netlify is recommended because:**
- ✅ Easier setup
- ✅ Better routing support
- ✅ Automatic HTTPS
- ✅ Faster builds
- ✅ Better error messages

---

Good luck! 🚀
