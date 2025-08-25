#!/bin/bash

echo "🔍 Finding your Cloudflare accounts..."
echo ""

# Method 1: Check wrangler config
if [ -f ~/.wrangler/config/default.toml ]; then
    echo "📋 Accounts in wrangler config:"
    cat ~/.wrangler/config/default.toml | grep -A 2 "\[account\]"
    echo ""
fi

# Method 2: Use wrangler whoami
echo "📋 Currently logged in account:"
npx wrangler whoami

echo ""
echo "💡 To switch accounts, use one of these methods:"
echo ""
echo "1. Set account_id in wrangler.toml:"
echo "   account_id = \"your-account-id\""
echo ""
echo "2. Use environment variable:"
echo "   export CLOUDFLARE_ACCOUNT_ID=\"your-account-id\""
echo ""
echo "3. Login to specific account:"
echo "   npx wrangler logout"
echo "   CLOUDFLARE_ACCOUNT_ID=\"your-account-id\" npx wrangler login"
echo ""
echo "4. Use API token instead of OAuth:"
echo "   export CLOUDFLARE_API_TOKEN=\"your-api-token\""
echo "   (Create token at: https://dash.cloudflare.com/profile/api-tokens)"
echo ""
echo "📝 Required permissions for API token:"
echo "   • Account: Cloudflare Workers Scripts:Edit"
echo "   • Account: Cloudflare Pages:Edit"
echo "   • Account: Account Settings:Read"
echo "   • Zone: Zone Settings:Read (if using custom domain)"
echo ""