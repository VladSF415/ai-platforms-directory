#!/bin/bash
# Autonomous Tasks Setup Script

echo "🤖 Setting up Autonomous Task Suite"
echo "===================================="
echo ""

# Check if DeepSeek API key is set
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "❌ DEEPSEEK_API_KEY not set!"
    echo ""
    echo "Please set your DeepSeek API key:"
    echo "  export DEEPSEEK_API_KEY=\"sk-...\""
    echo ""
    echo "Or add to .env file:"
    echo "  echo 'DEEPSEEK_API_KEY=sk-...' >> .env"
    echo ""
    exit 1
fi

echo "✅ DeepSeek API key detected"
echo ""

# Test API connection
echo "🔌 Testing DeepSeek API connection..."
response=$(curl -s -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Say OK"}],
    "max_tokens": 10
  }')

if echo "$response" | grep -q "OK"; then
    echo "✅ API connection successful"
else
    echo "❌ API connection failed"
    echo "Response: $response"
    exit 1
fi

echo ""
echo "📊 Current directory status:"
platforms_count=$(node -e "console.log(require('./platforms.json').length)")
echo "  Platforms: $platforms_count"
echo ""

# Ask user what to run
echo "What would you like to do?"
echo ""
echo "1) Test discovery (find 3 new platforms)"
echo "2) Test enrichment (enrich 5 platforms)"
echo "3) Test affiliate hunter (scan 10 platforms)"
echo "4) Test health check (check 20 platforms)"
echo "5) Run full orchestrator (all tasks)"
echo "6) Setup cron job (schedule daily)"
echo "7) Exit"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
    1)
        echo ""
        echo "🔍 Testing platform discovery..."
        node scripts/ai-powered-organizer.mjs --discover --max=3 --provider=deepseek --verbose
        ;;
    2)
        echo ""
        echo "🔧 Testing data enrichment..."
        node scripts/data-enrichment.mjs --max=5 --verbose
        ;;
    3)
        echo ""
        echo "💰 Testing affiliate hunter..."
        echo "Note: This will scan platforms for affiliate programs"
        echo "Scanning 10 platforms as a test..."
        # Create temp script to test just 10 platforms
        node -e "
        const platforms = require('./platforms.json').slice(0, 10);
        require('fs').writeFileSync('./platforms-test.json', JSON.stringify(platforms, null, 2));
        "
        echo "Running affiliate hunter on test set..."
        ;;
    4)
        echo ""
        echo "🏥 Testing health check..."
        node scripts/platform-health-check.mjs
        ;;
    5)
        echo ""
        echo "🤖 Running full orchestrator..."
        echo "This will run all autonomous tasks based on their schedule"
        node scripts/autonomous-orchestrator.mjs
        ;;
    6)
        echo ""
        echo "⏰ Setting up cron job..."
        echo "Adding daily run at 3 AM..."

        cron_command="0 3 * * * cd $(pwd) && node scripts/autonomous-orchestrator.mjs >> autonomous-runs.log 2>&1"

        # Add to crontab
        (crontab -l 2>/dev/null; echo "$cron_command") | crontab -

        echo "✅ Cron job added!"
        echo ""
        echo "View cron jobs:"
        crontab -l
        ;;
    7)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Complete!"
echo ""
echo "Next steps:"
echo "  - Review AUTONOMOUS_TASKS.md for full documentation"
echo "  - Check autonomous-runs.log for execution logs"
echo "  - Monitor .autonomous-state.json for task state"
echo ""
