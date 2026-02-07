# GitHub Setup Guide - Selendang Sutro

## Prerequisites

1. **Git installed** - Download from https://git-scm.com/
2. **GitHub Account** - https://github.com/

---

## Quick Setup (Manual)

### Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. **Repository name**: `selendang-sutro`
3. **Description**: `Restaurant Order Management System - Built with React, Vite, and Capacitor`
4. **Public**: ✅
5. **Initialize**: ❌ (Don't check any options)
6. Click **Create repository**

### Step 2: Initialize Git & Push

Open terminal in project folder:

```bash
cd C:\Users\iwudz\ssutro

# Initialize git (already done)
git init -b main

# Add files
git add .

# Create initial commit
git commit -m "Initial commit: Selendang Sutro

- Restaurant order management system
- Role-based authentication (Owner, Admin, Waiter)
- Real-time Supabase integration
- Android app via Capacitor
- Analytics dashboard
- Order tracking & management"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/selendang-sutro.git

# Push to GitHub
git push -u origin main
```

---

## Setup with GitHub CLI (gh)

### Install GitHub CLI
```bash
# Windows (winget)
winget install --id GitHub.cli

# Or download from: https://cli.github.com/
```

### Authenticate
```bash
gh auth login
```

### Create & Push Repo
```bash
cd C:\Users\iwudz\ssutro

# Create repository
gh repo create selendang-sutro --public --description "Restaurant Order Management System"

# Push existing repo
git push -u origin main
```

---

## Setup with SSH (Recommended)

### 1. Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 2. Add SSH Key to GitHub
```bash
# Copy SSH public key
cat ~/.ssh/id_ed25519.pub
# OR on Windows:
type %USERPROFILE%\.ssh\id_ed25519.pub
```

Go to: https://github.com/settings/keys > **New SSH key**

### 3. Update Remote to SSH
```bash
# Check current remote
git remote -v

# Change to SSH (replace YOUR_USERNAME)
git remote set-url origin git@github.com:YOUR_USERNAME/selendang-sutro.git

# Verify
git remote -v
```

---

## After Setup

### Enable GitHub Actions
1. Go to your repository on GitHub
2. **Settings** > **Actions** > **General**
3. Select **Allow all actions**

### Add Secrets (for CI/CD)
1. **Settings** > **Secrets and variables** > **Actions**
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## Useful Commands

```bash
# Check git status
git status

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Describe your changes"
git push

# View all branches
git branch -a

# Switch branch
git checkout branch-name
```

---

## Repository Structure After Push

```
selendang-sutro/
├── .github/workflows/ci.yml    # CI/CD pipeline
├── android/                    # Android app
├── src/                        # React source code
├── public/                     # Static assets
├── .env.example               # Environment template
├── package.json               # Dependencies
├── capacitor.config.ts        # Capacitor config
├── ANDROID.md                 # Android build guide
├── CICD.md                    # CI/CD documentation
└── ICON_GUIDE.md             # Icon setup guide
```

---

## Troubleshooting

### "Permission denied"
```bash
# Check SSH key
ssh -T git@github.com

# Or use HTTPS with token
git remote set-url origin https://github.com/YOUR_USERNAME/repo.git
```

### "Updates were rejected"
```bash
git pull --rebase origin main
git push
```

### "Nothing to commit"
```bash
# Check what's changed
git status

# If only untracked files:
git add .
git commit -m "message"
git push
```

---

## Next Steps

1. ✅ Create GitHub account
2. ✅ Create repository
3. ✅ Push code
4. ⬜ Enable GitHub Actions
5. ⬜ Add team members
6. ⬜ Set up branch protection

Good luck! 🚀
