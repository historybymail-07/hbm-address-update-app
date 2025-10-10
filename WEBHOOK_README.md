# Webhook Integration for n8n

This application now includes webhook functionality that allows you to receive data from n8n or any other service that can send HTTP requests.

## Features

- **GET and POST Support**: The webhook accepts both GET and POST requests
- **Real-time Data Display**: Incoming webhook data is displayed in real-time
- **Data Persistence**: Webhook data is stored and displayed in the UI
- **Testing Tools**: Built-in testing buttons to simulate webhook calls
- **n8n Integration Ready**: Easy integration with n8n workflows

## Setup Instructions

### Local Development

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start the Application
```bash
# Option A: Start both frontend and webhook server
npm run dev:full

# Option B: Start separately
npm run dev      # React app on http://localhost:5173
npm run webhook  # Webhook server on http://localhost:3001
```

### Railway Deployment (Single Container)

#### 1. Railway Build Process
```bash
# Railway automatically runs:
npm install          # Install dependencies
npm run build        # Build React app to /dist folder
npm start           # Start webhook server (serves API + React app)
```

#### 2. What Happens in Production
- **One server** handles everything on one port
- **React app** served from `/dist` folder as static files
- **API endpoints** handled by Express server
- **Single URL** for both frontend and API

#### 3. Access Your Application
- **Frontend**: `https://your-app-name.railway.app`
- **Webhook Endpoint**: `https://your-app-name.railway.app/webhook/customer-data`
- **API**: `https://your-app-name.railway.app/api/*`

## n8n Integration Flow

### 1. Send Customer Data from n8n

Configure your n8n HTTP Request node:
- **Method**: POST
- **URL**: `https://your-app-name.railway.app/webhook/customer-data`
- **Body Type**: JSON
- **Body Content**:
```json
{
  "customer_name": "Manali Sharma",
  "subscriptions": [
    {
      "id": "698319426",
      "recipient_name": "Manali",
      "current_address": {
        "address1": "742 Evergreen Terrace, Suite 12A",
        "city": "Springfield",
        "province": "California",
        "zip": "90210",
        "country_code": "US"
      }
    }
  ]
}
```

### 2. User Updates Address

1. User opens the application URL
2. Data is automatically loaded from the webhook
3. User selects subscriptions and updates addresses
4. User clicks "UPDATE ADDRESS"
5. Updated data is sent back to your n8n webhook

### 3. Receive Updated Data in n8n

Set up another webhook in n8n to receive the updated address data:
- The app will POST updated subscription data back to your n8n webhook
- Data format includes customer name and updated subscription addresses

## API Endpoints

### Webhook Endpoint
```
POST/GET http://localhost:3001/webhook/{webhookId}
```

### Get Webhook Data
```
GET http://localhost:3001/api/webhook-data
```

### Clear Webhook Data
```
DELETE http://localhost:3001/api/webhook-data
```

### Health Check
```
GET http://localhost:3001/health
```

## Testing the Webhook

### Using the Built-in Test Buttons

1. Open the webhook panel
2. Click "Test GET Request" or "Test POST Request"
3. Observe the data appear in the webhook data section

### Using curl

```bash
# Test GET request
curl "http://localhost:3001/webhook/test-webhook-123?message=Hello&data=test"

# Test POST request
curl -X POST "http://localhost:3001/webhook/test-webhook-123" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from n8n", "data": {"user": "test", "action": "update"}}'
```

## Data Format

The webhook accepts any JSON data structure. Here are some examples:

### Simple Data
```json
{
  "message": "Hello from n8n",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### n8n Data Format (Expected)
```json
{
  "customer_name": "Manali Sharma",
  "subscriptions": [
    {
      "id": "698319426",
      "recipient_name": "Manali",
      "current_address": {
        "address1": "742 Evergreen Terrace, Suite 12A",
        "city": "Springfield",
        "province": "California",
        "zip": "90210",
        "country_code": "US"
      }
    }
  ]
}
```

## Production Considerations

For production deployment:

1. **Security**: Add authentication/authorization to webhook endpoints
2. **Database**: Replace in-memory storage with a proper database
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **HTTPS**: Use HTTPS for secure data transmission
5. **Logging**: Add proper logging and monitoring
6. **Environment Variables**: Use environment variables for configuration

## Troubleshooting

### Webhook Server Not Starting
- Check if port 3001 is available
- Install dependencies: `npm install`

### No Data Appearing
- Ensure both frontend and webhook server are running
- Check browser console for errors
- Verify the webhook URL is correct

### n8n Connection Issues
- Test the webhook URL with curl first
- Check n8n logs for connection errors
- Ensure the webhook server is accessible from n8n

## Support

For issues or questions:
- Check the browser console for errors
- Verify all services are running
- Test with the built-in test buttons first
