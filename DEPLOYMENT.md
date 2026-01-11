# Deployment Guide - GitHub Pages

This guide explains how to deploy the AI Learning Playground to GitHub Pages.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
   - Repository URL: `https://github.com/pyaichatbot/ai-learning-playground`

2. **GitHub Pages Enabled**: 
   - Go to your repository Settings → Pages
   - Source: Select "GitHub Actions" (not "Deploy from a branch")

## Automatic Deployment (Recommended)

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys on every push to `main` or `master` branch.

### Steps:

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/pyaichatbot/ai-learning-playground.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to: `https://github.com/pyaichatbot/ai-learning-playground/settings/pages`
   - Under "Source", select **"GitHub Actions"**
   - Save

3. **Wait for deployment**:
   - Go to the "Actions" tab in your repository
   - Watch the workflow run
   - Once complete, your site will be available at:
     `https://pyaichatbot.github.io/ai-learning-playground/`

## Manual Deployment

If you prefer to deploy manually:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder**:
   - Use GitHub Pages with a branch (e.g., `gh-pages`)
   - Or use a tool like `gh-pages`:
     ```bash
     npm install --save-dev gh-pages
     ```
     Add to `package.json`:
     ```json
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
     ```
     Then run: `npm run deploy`

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file in the `public/` directory with your domain:
   ```
   yourdomain.com
   ```

2. Configure DNS:
   - Add a CNAME record pointing to `pyaichatbot.github.io`

3. Update GitHub Pages settings with your custom domain

## Troubleshooting

### 404 Errors on Refresh

If you get 404 errors when refreshing pages, this is normal for SPAs. GitHub Pages doesn't support client-side routing by default. The current setup should handle this, but if issues persist:

1. Ensure `base` path in `vite.config.ts` matches your repository name
2. Consider using a `404.html` redirect (GitHub Pages will serve this for missing files)

### Build Failures

- Check the Actions tab for error messages
- Ensure all dependencies are in `package.json`
- Verify Node.js version (requires >= 18)

### Base Path Issues

If your site is at a subdirectory (e.g., `/ai-learning-playground/`), the `base` in `vite.config.ts` is already configured. If deploying to root domain, change it to `/`.

## Alternative Deployment Options

### Vercel (Recommended for SPAs)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Cloudflare Pages
- Connect your GitHub repository
- Build command: `npm run build`
- Output directory: `dist`

## Environment Variables

If you need environment variables:
1. Create `.env.production` file
2. Add variables (don't commit secrets!)
3. Access via `import.meta.env.VITE_*`

---

**Your deployed site will be available at:**
`https://pyaichatbot.github.io/ai-learning-playground/`

