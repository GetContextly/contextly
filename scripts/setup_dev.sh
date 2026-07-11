#!/bin/bash

# Contextly Developer Environment Setup
# "Go all out" production-grade local setup script

set -e

echo "🚀 Setting up Contextly local environment..."

# 1. Check dependencies
command -v node >/dev/null 2>&1 || { echo >&2 "❌ Node.js is required. Aborting."; exit 1; }
command -v supabase >/dev/null 2>&1 || { echo >&2 "❌ Supabase CLI is required. Aborting."; exit 1; }
command -v gh >/dev/null 2>&1 || { echo >&2 "❌ GitHub CLI is required. Aborting."; exit 1; }

# 2. Install dependencies
echo "📦 Installing root dependencies..."
npm install

# 3. Setup Supabase
echo "🗄️ Initializing Supabase..."
if [ ! -d "supabase" ]; then
  supabase init
fi

# 4. Create environment files
echo "📝 Configuring environment files..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✅ Created .env from .example"
fi

# 5. Build shared packages
echo "🏗️ Building @contextly/shared..."
npm run build -w @contextly/shared

# 6. Success
echo ""
echo "✨ Environment ready!"
echo "Next steps:"
echo "1. Run 'supabase start' to boot the local database."
echo "2. Run 'npm run dev' to start the dashboard and MCP server."
echo "3. Run 'cd packages/cli && npm link' to test the CLI locally."
