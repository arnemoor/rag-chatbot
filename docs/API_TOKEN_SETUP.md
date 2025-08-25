# Cloudflare API Token Setup Guide

## Required Permissions

To use the AutoRAG framework setup scripts, you need to create a Cloudflare API token with specific permissions.

## Creating the API Token

1. Go to [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Choose **"Custom token"** and click **"Get started"**

## Token Configuration

### Token Name
- Name: `AutoRAG Framework Token`

### Permissions Required

Configure the following permissions for your token:

| Resource | Permission Level | Required For |
|----------|-----------------|--------------|
| **Account - Cloudflare Workers Scripts:Edit** | Edit | Deploying Workers |
| **Account - Cloudflare Pages:Edit** | Edit | Deploying Widget to Pages |
| **Account - Workers R2 Storage:Edit** | Edit | Creating R2 buckets, uploading documents |
| **Account - AI Gateway:Edit** | Edit | Creating AI Gateway (optional) |
| **Account - Workers AI:Read** | Read | Accessing Workers AI models |
| **Zone - Zone:Read** | Read | Reading zone information (if using custom domain) |

### Account Resources
- Include: Your specific account (select from dropdown)

### IP Filtering (Optional)
- You can restrict the token to specific IP addresses for additional security

### TTL (Optional)
- Set an expiration date for the token if desired

## Step-by-Step Permission Setup

1. **Add Account Permissions:**
   - Click **"+ Add more"** under Account permissions
   - Select **"Account"** → **"Cloudflare Workers Scripts"** → **"Edit"**
   - Select **"Account"** → **"Cloudflare Pages"** → **"Edit"**
   - Select **"Account"** → **"Workers R2 Storage"** → **"Edit"**
   - Select **"Account"** → **"AI Gateway"** → **"Edit"** (optional)
   - Select **"Account"** → **"Workers AI"** → **"Read"**

2. **Select Account:**
   - Under "Account Resources", select "Include" → "Specific account"
   - Choose your account from the dropdown

3. **Review Summary:**
   - Verify all permissions are correctly set
   - Click **"Continue to summary"**

4. **Create Token:**
   - Review the final configuration
   - Click **"Create Token"**

5. **Save Token:**
   - **IMPORTANT**: Copy the token immediately - it won't be shown again!
   - Save it in your `.env` file as `CLOUDFLARE_API_TOKEN`

## Verifying Your Token

Test your token with this command:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json"
```

You should see a response like:
```json
{
  "result": {
    "id": "token-id",
    "status": "active"
  },
  "success": true
}
```

## R2 API Token (For Document Upload)

For uploading documents to R2, you'll also need R2 API credentials:

1. Go to [R2 → Manage R2 API Tokens](https://dash.cloudflare.com/r2/api-tokens)
2. Click **"Create API token"**
3. Configure:
   - **Token name**: `AutoRAG R2 Token`
   - **Permissions**: `Object Read & Write`
   - **Specify bucket**: Select your bucket or leave as "Apply to all buckets"
   - **TTL**: Set as needed
4. Click **"Create API Token"**
5. Save the credentials:
   - **Access Key ID** → Save as `R2_ACCESS_KEY_ID` in `.env`
   - **Secret Access Key** → Save as `R2_SECRET_ACCESS_KEY` in `.env`

## Example .env File

After creating your tokens, your `.env` file should look like this:

```env
# Cloudflare Credentials
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_API_TOKEN=your-api-token-here

# R2 Credentials (for document upload)
R2_ACCESS_KEY_ID=your-r2-access-key-here
R2_SECRET_ACCESS_KEY=your-r2-secret-key-here

# AutoRAG Configuration
AUTORAG_INSTANCE_ID=your-autorag-instance-name
R2_BUCKET_NAME=library-docs-01

# Optional
GATEWAY_NAME=your-gateway-name
DEBUG_MODE=true
ENVIRONMENT=development
```

## Security Best Practices

1. **Never commit tokens to Git** - Keep `.env` in `.gitignore`
2. **Use minimal permissions** - Only grant what's needed
3. **Rotate tokens regularly** - Create new tokens periodically
4. **Use IP restrictions** - Limit token usage to your IP if possible
5. **Set expiration dates** - Use TTL for temporary tokens
6. **Store securely** - Use a password manager or secrets management system

## Troubleshooting

### "Unauthorized" Error
- Verify token has all required permissions
- Check token hasn't expired
- Ensure you're using the correct account ID

### "Permission Denied" Error
- Check specific permission for the operation
- Verify account resource selection

### "Not Found" Error
- Ensure resources (AutoRAG instance, R2 bucket) exist
- Check you're using correct names/IDs

## Need Help?

If you encounter issues:
1. Double-check all permissions are set correctly
2. Verify your account ID is correct
3. Try creating a new token with full permissions temporarily
4. Check [Cloudflare API documentation](https://developers.cloudflare.com/api/)