# Railway Deployment Guide

## Quick Deploy to Railway

### 1. Prepare Your Repository
```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Click "Start a New Project"
3. Connect your GitHub repository
4. Select this repository
5. Railway will automatically detect and deploy your app

### 3. Configure Environment (if needed)

Railway will automatically:
- Install dependencies (`npm install`)
- Build the React app (`npm run build`) - Creates `/dist` folder
- Start the webhook server (`npm start`) - Serves both API and React app

### 4. Get Your Webhook URL

After deployment, your webhook URL will be:
```
https://your-app-name.railway.app/webhook/customer-data
```

## n8n Configuration

### Step 1: Send Customer Data to Your App

Create an HTTP Request node in n8n:
- **Method**: POST
- **URL**: `https://your-app-name.railway.app/webhook/customer-data`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "customer_name": "{{ $json.customer_name }}",
  "subscriptions": [
    {
      "id": "{{ $json.subscription_id }}",
      "recipient_name": "{{ $json.recipient_name }}",
      "current_address": {
        "address1": "{{ $json.current_address.address1 }}",
        "city": "{{ $json.current_address.city }}",
        "province": "{{ $json.current_address.province }}",
        "zip": "{{ $json.current_address.zip }}",
        "country_code": "{{ $json.current_address.country_code }}"
      }
    }
  ]
}
```

### Step 2: Receive Updated Data from Your App

Create a Webhook node in n8n to receive updated address data:
- The app will send updated data back to your n8n webhook URL
- Update the webhook URL in `src/App.tsx` line ~450 to your n8n webhook URL

## Testing

### Local Testing
```bash
npm run test:webhook
```

### Production Testing
```bash
curl -X POST https://your-app-name.railway.app/webhook/customer-data \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "subscriptions": [{
      "id": "123",
      "recipient_name": "Test User",
      "current_address": {
        "address1": "123 Test St",
        "city": "Test City",
        "province": "CA",
        "zip": "12345",
        "country_code": "US"
      }
    }]
  }'
```

## Troubleshooting

### Build Issues
- Make sure all dependencies are in `package.json`
- Check Railway build logs for errors

### Webhook Not Working
- Verify the webhook URL is correct
- Check Railway application logs
- Test with curl command above

### Frontend Not Loading
- Ensure `npm run build` works locally
- Check that `dist` folder is created
- Verify static file serving in `webhook-server.js`