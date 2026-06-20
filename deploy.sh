#!/bin/bash
# deploy.sh
# A quick one-command deploy script for Nail By Mamta

echo "🚀 Preparing to deploy to Vercel..."

echo "📦 Adding changes to Git..."
git add .

echo "💾 Committing changes..."
git commit -m "deploy: update from quick deploy script" || echo "No new changes to commit, continuing with deployment..."

echo "🌐 Deploying to Vercel (Production)..."
vercel --prod

echo "✅ Deployment complete!"
