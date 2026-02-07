import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hooksDir = path.join(__dirname, '..', '.git', 'hooks');

if (!fs.existsSync(hooksDir)) {
    console.log('Git hooks not supported (no .git/hooks directory)');
    process.exit(0);
}

const preCommitPath = path.join(hooksDir, 'pre-commit');

const preCommitContent = `#!/bin/sh
# Pre-commit hook for ssutro
# This script runs type-check and lint before commits

set -e

echo "Running pre-commit checks..."

# Change to project directory
cd "$(dirname "$0")/.."

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
    echo "Lint check failed! Run 'npm run lint -- --fix' to fix issues."
    exit 1
fi

echo "Pre-commit checks passed!"
exit 0
`;

try {
    fs.writeFileSync(preCommitPath, preCommitContent);
    fs.chmodSync(preCommitPath, '755');
    console.log('Git pre-commit hook installed successfully!');
    console.log('The hook will run type-check and lint before each commit.');
} catch (err) {
    console.error('Failed to install git hook:', err.message);
    process.exit(1);
}
