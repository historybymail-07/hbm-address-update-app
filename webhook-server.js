import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Store webhook data in memory keyed by customer email
// Format: { "email@example.com": { id, timestamp, data } }
let webhookData = {};

// Auto-cleanup old entries (older than 24 hours) - runs every hour
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  let cleanedCount = 0;
  
  for (const email in webhookData) {
    const entryTime = new Date(webhookData[email].timestamp).getTime();
    if (now - entryTime > maxAge) {
      delete webhookData[email];
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired webhook entries`);
  }
}, 60 * 60 * 1000); // Run every hour

// Main webhook endpoint for n8n customer data
app.post('/webhook/customer-data', (req, res) => {
  const data = req.body;
  
  // Validate the expected n8n data structure
  if (!data.customer_name || !data.email || !data.subscriptions) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format. Expected customer_name, email, and subscriptions.'
    });
  }
  
  // Create webhook entry keyed by email
  const webhookEntry = {
    id: `webhook-${Date.now()}`,
    webhookId: 'customer-data',
    timestamp: new Date().toISOString(),
    method: 'POST',
    data,
    headers: req.headers,
    ip: req.ip || req.connection.remoteAddress
  };
  
  // Store the webhook data by email (allows multiple users)
  webhookData[data.email] = webhookEntry;
  
  console.log(`Customer data received from n8n for: ${data.email}`, {
    customer_name: data.customer_name,
    subscriptions_count: data.subscriptions.length
  });
  
  // Send response
  res.status(200).json({
    success: true,
    message: 'Customer data received successfully',
    customer_name: data.customer_name,
    shopify_id: data.shopify_id,
    recharge_id: data.recharge_id,
    email: data.email,
    subscriptions_count: data.subscriptions.length,
    timestamp: webhookEntry.timestamp
  });
});

// Generic webhook endpoint for testing (backward compatibility)
app.all('/webhook/:webhookId', (req, res) => {
  const { webhookId } = req.params;
  const method = req.method;
  
  // Extract data based on method
  let data;
  if (method === 'GET') {
    data = req.query;
  } else if (method === 'POST') {
    data = req.body;
  }
  
  // Create webhook entry
  const webhookEntry = {
    id: `webhook-${Date.now()}`,
    webhookId,
    timestamp: new Date().toISOString(),
    method,
    data,
    headers: req.headers,
    ip: req.ip || req.connection.remoteAddress
  };
  
  // For generic webhooks, store by webhookId
  webhookData[`generic-${webhookId}-${Date.now()}`] = webhookEntry;
  
  console.log(`Webhook received: ${method} /webhook/${webhookId}`, data);
  
  // Send response
  res.status(200).json({
    success: true,
    message: 'Webhook data received successfully',
    webhookId,
    timestamp: webhookEntry.timestamp,
    method,
    dataReceived: data
  });
});

// Endpoint to get webhook data - now requires email parameter
app.get('/api/webhook-data', (req, res) => {
  const email = req.query.email;
  
  if (!email) {
    return res.json({
      success: false,
      message: 'Email parameter is required. Use ?email=customer@example.com',
      data: [],
      count: 0
    });
  }
  
  const customerData = webhookData[email];
  
  if (customerData) {
    res.json({
      success: true,
      data: [customerData],
      count: 1
    });
  } else {
    res.json({
      success: false,
      message: 'No data found for this email. Your session may have expired. Please send another address update email.',
      data: [],
      count: 0
    });
  }
});

// Endpoint to clear webhook data for a specific email or all
app.delete('/api/webhook-data', (req, res) => {
  const email = req.query.email;
  
  if (email) {
    delete webhookData[email];
    res.json({
      success: true,
      message: `Webhook data cleared for ${email}`
    });
  } else {
    webhookData = {};
    res.json({
      success: true,
      message: 'All webhook data cleared'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/{webhookId}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/webhook-data`);
});

export default app;
