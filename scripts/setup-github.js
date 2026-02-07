#!/usr/bin/env node

/**
 * GitHub Setup Script for Selendang Sutro
 * 
 * Usage: node scripts/setup-github.js
 */

import { execSync } from 'child_process';
import readline from 'readline';
import https from 'https';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_NAME = 'selendang-sutro';
const REPO_DESC = 'Restaurant Order Management System - Built with React, Vite, and Capacitor';

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

function createGitHubRepo(token, name, description) {
    const data = JSON.stringify({
        name,
        description,
        private: false,
        auto_init: false
    });

    return new Promise((resolve, reject) => {
        const req = https.request('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Selendang-Sutro-Setup'
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) {
                    const repo = JSON.parse(body);
                    resolve(repo);
                } else if (res.statusCode === 422) {
                    reject(new Error('Repository already exists'));
                } else {
                    reject(new Error(`GitHub API error: ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function setup() {
    console.log('\n========================================');
    console.log('   GitHub Setup - Selendang Sutro');
    console.log('========================================\n');

    if (!GITHUB_TOKEN) {
        console.log('❌ GITHUB_TOKEN environment variable not set');
        console.log('\nPlease set your GitHub token:');
        console.log('  export GITHUB_TOKEN=your_github_token_here');
        console.log('\nOr create a new token at:');
        console.log('  https://github.com/settings/tokens\n');
        console.log('Required permissions:');
        console.log('  - repo (full control of private repositories)\n');
        process.exit(1);
    }

    console.log('✅ GitHub token found\n');

    let repoName = REPO_NAME;
    let useCustomName = await askQuestion('Use default repository name "selendang-sutro"? (y/n): ');
    
    if (useCustomName.toLowerCase() !== 'y' && useCustomName.toLowerCase() !== '') {
        repoName = await askQuestion('Enter repository name: ');
    }

    console.log(`\n📦 Creating GitHub repository: ${repoName}...`);

    try {
        const repo = await createGitHubRepo(GITHUB_TOKEN, repoName, REPO_DESC);
        console.log('✅ Repository created successfully!');
        console.log(`   URL: ${repo.html_url}\n`);

        console.log('📝 Committing files...');
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Initial commit: Selendang Sutro - Restaurant Order Management System"', { stdio: 'inherit' });

        console.log('🔗 Adding remote...');
        execSync(`git remote add origin ${repo.clone_url}`, { stdio: 'inherit' });

        console.log('🚀 Pushing to GitHub...');
        execSync('git push -u origin main', { stdio: 'inherit' });

        console.log('\n========================================');
        console.log('   ✅ Setup Complete!');
        console.log('========================================');
        console.log(`\nRepository: ${repo.html_url}`);
        console.log('\nNext steps:');
        console.log('  - Add collaborators in repository settings');
        console.log('  - Enable GitHub Actions for CI/CD');
        console.log('  - Set up branch protection rules\n');

    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('⚠️  Repository already exists on GitHub');
            console.log('\nTo push to existing repo:');
            console.log('  git remote add origin https://github.com/YOUR_USERNAME/' + repoName + '.git');
            console.log('  git push -u origin main\n');
        } else {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }

    rl.close();
}

setup().catch(console.error);
