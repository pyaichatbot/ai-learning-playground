# Quick Deployment Guide

## GitHub Pages Deployment (Automatic)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### Step 2: Enable GitHub Pages
1. Go to: https://github.com/pyaichatbot/ai-learning-playground/settings/pages
2. Under "Source", select **"GitHub Actions"**
3. Click Save

### Step 3: Wait for Deployment
- Go to the "Actions" tab
- Watch the workflow complete
- Your site will be live at: **https://pyaichatbot.github.io/ai-learning-playground/**

## That's it! 🎉

Every push to `main` will automatically deploy your site.

## Alternative: Deploy to Root Domain

If you want the site at `https://pyaichatbot.github.io/` (without `/ai-learning-playground/`):

1. Change `vite.config.ts`:
   ```ts
   base: '/',
   ```

2. Update repository name in GitHub Pages settings
3. Redeploy

## Troubleshooting

- **404 on refresh**: The `404.html` file handles this automatically
- **Build fails**: Check Actions tab for error messages
- **Assets not loading**: Verify `base` path in `vite.config.ts` matches your repo name

For more details, see `DEPLOYMENT.md`
