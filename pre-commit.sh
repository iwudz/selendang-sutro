#!/usr/bin/env sh

# Pre-commit hook for ssutro project
# This script runs type-check and lint before commits

set -e

echo "Running pre-commit checks..."

# Type check
echo "Running TypeScript type check..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "Type check failed!"
    exit 1
fi

# Lint
echo "Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "Lint check failed! Run 'npm run lint' to see errors."
    echo "To auto-fix: npm run lint -- --fix"
    exit 1
fi

echo "Pre-commit checks passed!"
exit 0
