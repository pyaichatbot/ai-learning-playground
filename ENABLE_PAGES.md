# Enable GitHub Pages - Step by Step

## The Error You're Seeing

```
Get Pages site failed. Please verify that the repository has Pages enabled
```

This means GitHub Pages needs to be enabled **before** the workflow can deploy.

## Solution: Enable GitHub Pages First

### Step 1: Go to Repository Settings
1. Open: https://github.com/pyaichatbot/ai-learning-playground
2. Click **Settings** (top right of repository page)
3. Scroll down to **Pages** in the left sidebar

### Step 2: Configure GitHub Pages
1. Under **"Source"**, you'll see options:
   - ❌ Deploy from a branch
   - ✅ **GitHub Actions** ← Select this one!

2. Click **"GitHub Actions"** radio button

3. Click **Save**

### Step 3: Re-run the Workflow
1. Go to **Actions** tab: https://github.com/pyaichatbot/ai-learning-playground/actions
2. Find the failed workflow run
3. Click **"Re-run all jobs"** or **"Re-run failed jobs"**

### Step 4: Wait for Deployment
- The workflow will now build and deploy successfully
- Your site will be live at: **https://pyaichatbot.github.io/ai-learning-playground/**

## Visual Guide

```
Repository → Settings → Pages → Source: GitHub Actions → Save
```

## Alternative: Manual First Deployment

If you want to deploy manually first:

1. **Build locally**:
   ```bash
   npm run build
   ```

2. **Create gh-pages branch** (one-time setup):
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   cp -r dist/* .
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```

3. **Then switch back to main**:
   ```bash
   git checkout main
   ```

4. **Enable Pages from gh-pages branch** (temporary)
5. **Then switch to GitHub Actions** (recommended)

## Troubleshooting

- **Still getting errors?** Make sure you selected "GitHub Actions" not "Deploy from a branch"
- **Workflow not running?** Check if it's enabled in Actions tab
- **404 errors?** Wait a few minutes for DNS propagation

---

**Quick Link**: https://github.com/pyaichatbot/ai-learning-playground/settings/pages

