#!/bin/bash

echo "🚀 KarigarHai Backend Setup"
echo "================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20 LTS."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✓ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Start Docker containers
echo ""
echo "🐳 Starting Docker containers..."
echo "   Make sure Docker is running!"

if command -v docker &> /dev/null; then
    docker compose up -d
    echo "✓ Docker containers started"
    sleep 3
else
    echo "⚠️  Docker not found. Make sure PostgreSQL and Redis are running separately."
fi

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
npm run prisma:migrate:prod || {
    echo "⚠️  Migration failed. Run 'npm run prisma:migrate' manually."
}

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Available commands:"
echo "   npm run dev              - Start development server"
echo "   npm run build            - Build for production"
echo "   npm run lint             - Run ESLint"
echo "   npm run format           - Format code with Prettier"
echo "   npm run typecheck        - Type check with TypeScript"
echo "   npm run prisma:studio    - Open Prisma Studio"
echo "   npm test                 - Run tests"
echo ""
echo "🚀 To start development:"
echo "   npm run dev"
echo ""
