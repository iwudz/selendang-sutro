# CI/CD Setup

This project includes automated checks before commits and GitHub Actions for continuous integration.

## Pre-commit Hooks

Before each commit, the following checks run automatically:

1. **TypeScript type check** (`npm run type-check`)
2. **ESLint** (`npm run lint`)

### Setup

Run the following command to install the pre-commit hook:

```bash
npm run prepare
```

Or manually:

```bash
# On Unix/Linux/Mac
chmod +x pre-commit.sh
./pre-commit.sh

# On Windows (Git Bash)
sh pre-commit.sh
```

### Manual Bypass

To bypass pre-commit checks temporarily:

```bash
git commit --no-verify -m "Your commit message"
```

## GitHub Actions

The CI workflow runs on every push and pull request to main/master:

- **Lint & TypeCheck job**: Runs TypeScript type checking and ESLint
- **Build job**: Builds the project (only runs if lint/typecheck pass)

### Environment Variables

For the build job to work in CI, add these secrets to your GitHub repository:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Available Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Auto-fix lint issues
npm run lint -- --fix

# Build project
npm run build

# Run all checks
npm run type-check && npm run lint
```
