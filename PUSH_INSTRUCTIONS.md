# Push to GitHub - Instructions

Your code is committed and ready to push! You need to authenticate with GitHub first.

## Option 1: Use GitHub CLI (Easiest) ✅

If you have GitHub CLI installed:

```bash
gh auth login
git push -u origin main
```

## Option 2: Use Personal Access Token

1. **Create a Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: "AI Learning Playground"
   - Select scopes: `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Push using the token**:
   ```bash
   git push https://YOUR_TOKEN@github.com/pyaichatbot/ai-learning-playground.git main
   ```
   Replace `YOUR_TOKEN` with your actual token.

## Option 3: Use SSH (Recommended for regular use)

1. **Switch to SSH remote**:
   ```bash
   git remote set-url origin git@github.com:pyaichatbot/ai-learning-playground.git
   ```

2. **Set up SSH key** (if not already done):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   cat ~/.ssh/id_ed25519.pub
   ```
   Copy the output and add it to: https://github.com/settings/keys

3. **Push**:
   ```bash
   git push -u origin main
   ```

## Option 4: Configure Git Credentials

```bash
git config --global credential.helper store
git push -u origin main
# Enter your GitHub username and Personal Access Token when prompted
```

---

## After Pushing

Once pushed successfully:

1. **Enable GitHub Pages**:
   - Go to: https://github.com/pyaichatbot/ai-learning-playground/settings/pages
   - Source: Select **"GitHub Actions"**
   - Click Save

2. **Check Deployment**:
   - Go to: https://github.com/pyaichatbot/ai-learning-playground/actions
   - Watch the workflow run
   - Your site will be live at: **https://pyaichatbot.github.io/ai-learning-playground/**

---

## Quick Command Summary

```bash
# Check current status
git status

# If you need to add more files
git add .
git commit -m "Your message"

# Push (after authentication)
git push -u origin main
```

