# Troubleshooting GitHub Pages Deployment

## Issue: Blank White Page

If you see a blank white page after deployment, follow these steps:

### 1. Check Browser Console

Open Developer Tools (F12) and check the **Console** tab for errors:

- **404 errors**: Assets not loading (check paths)
- **JavaScript errors**: Runtime errors preventing React from mounting
- **CORS errors**: Cross-origin issues

### 2. Check Network Tab

In Developer Tools → **Network** tab:

- Verify all assets are loading (status 200)
- Check if JavaScript files are being fetched from correct paths
- Look for failed requests (red entries)

### 3. Verify BASE_URL

The app should log `BASE_URL` in the console. It should be:
- Production: `/ai-learning-playground/`
- Development: `/`

If it's wrong, check `vite.config.ts`:

```typescript
base: '/ai-learning-playground/',
```

### 4. Common Issues & Fixes

#### Issue: JavaScript files return 404
**Cause**: Base path mismatch  
**Fix**: Verify `vite.config.ts` has `base: '/ai-learning-playground/'`

#### Issue: React not mounting
**Cause**: Root element not found or JavaScript error  
**Fix**: Check browser console for errors, verify `index.html` has `<div id="root"></div>`

#### Issue: Styles not loading
**Cause**: CSS file path incorrect  
**Fix**: Check Network tab, verify CSS is loading from `/ai-learning-playground/assets/...`

#### Issue: Routes not working
**Cause**: 404.html redirect or basename mismatch  
**Fix**: Verify `App.tsx` uses `import.meta.env.BASE_URL` and `404.html` redirects correctly

### 5. Test Locally

Build and serve locally to test:

```bash
npm run build
npx serve -s dist -l 3000
```

Then visit: `http://localhost:3000/ai-learning-playground/`

### 6. Verify GitHub Pages Settings

1. Go to: https://github.com/pyaichatbot/ai-learning-playground/settings/pages
2. Verify **Source** is set to **GitHub Actions**
3. Check that workflow is running successfully

### 7. Check Workflow Logs

1. Go to: https://github.com/pyaichatbot/ai-learning-playground/actions
2. Click on the latest workflow run
3. Check for build errors or warnings

### 8. Clear Browser Cache

Sometimes cached files cause issues:
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

## Recent Fixes Applied

✅ Fixed `App.tsx` to use `import.meta.env.BASE_URL` correctly  
✅ Fixed `404.html` redirect for SPA routing  
✅ Fixed icon path in `index.html`  
✅ Added TypeScript definitions for Vite env  
✅ Added error checking in `main.tsx`

## Still Not Working?

If the issue persists:

1. **Check the browser console** - Share any error messages
2. **Check Network tab** - Share which files are failing to load
3. **Verify the deployed files** - Check if `dist/index.html` has correct asset paths
4. **Test locally** - See if the issue reproduces locally

## Expected Behavior

When working correctly:
- ✅ Page loads with content (not blank)
- ✅ Navigation works between routes
- ✅ Assets load correctly (no 404s in console)
- ✅ Console shows: `BASE_URL: /ai-learning-playground/`
- ✅ No JavaScript errors in console

