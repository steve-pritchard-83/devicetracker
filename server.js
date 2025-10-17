// G'day Test Device Tracker - Single-file web application
// Compatible with Vercel Serverless + Postgres (Supabase, Vercel, etc.)

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const http = require('http');
const postgres = require('postgres');

// Initialize Postgres connection
const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL, {
  ssl: 'require',  // Supabase requires SSL
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Configuration
const PORT = process.env.PORT || 3000;

// Database initialization state
let dbInitialized = false;
let dbInitPromise = null;

// Database initialization function (lazy, runs once)
async function initializeDatabase() {
  // If already initialized, skip
  if (dbInitialized) {
    return;
  }
  
  // If initialization is in progress, wait for it
  if (dbInitPromise) {
    return dbInitPromise;
  }
  
  // Start initialization
  dbInitPromise = (async () => {
    try {
      console.log('Initializing database...');
      
      // Create devices table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS devices (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          borrower TEXT,
          checked_out_date TIMESTAMP,
          status TEXT DEFAULT 'Available'
        )
      `;
      
      // Check if we need to seed data
      const result = await sql`SELECT COUNT(*) as count FROM devices`;
      const count = parseInt(result[0].count);
      
      if (count === 0) {
        console.log('Seeding database with test devices...');
        // Seed initial devices
        const devices = [
          'Samsung Galaxy S5',
          'Samsung Galaxy S5 Ultra',
          'Samsung Galaxy Tab S11',
          'iPhone 15',
          'iPhone 16 Pro Max',
          'iPhone 13 Mini',
          'Google Pixel 8A'
        ];
        
        for (const device of devices) {
          await sql`INSERT INTO devices (name, status) VALUES (${device}, 'Available')`;
        }
        
        console.log('Database seeded with', devices.length, 'devices');
      } else {
        console.log('Database already contains', count, 'devices');
      }
      
      dbInitialized = true;
      console.log('Database initialization complete');
    } catch (error) {
      console.error('Database initialization error:', error);
      dbInitPromise = null; // Reset so we can retry
      throw error;
    }
  })();
  
  return dbInitPromise;
}

// Database query functions
async function getAllDevices() {
  try {
    // Ensure database is initialized
    await initializeDatabase();
    
    const result = await sql`SELECT * FROM devices ORDER BY name`;
    return result; // postgres package returns array directly
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
}

async function checkoutDevice(deviceName, borrower) {
  try {
    // Ensure database is initialized
    await initializeDatabase();
    
    const date = new Date().toISOString();
    const result = await sql`
      UPDATE devices 
      SET borrower = ${borrower}, checked_out_date = ${date}, status = 'Checked Out' 
      WHERE name = ${deviceName}
    `;
    return result.count; // postgres package uses .count instead of .rowCount
  } catch (error) {
    console.error('Error checking out device:', error);
    throw error;
  }
}

async function checkinDevice(deviceName) {
  try {
    // Ensure database is initialized
    await initializeDatabase();
    
    const result = await sql`
      UPDATE devices 
      SET borrower = NULL, checked_out_date = NULL, status = 'Available' 
      WHERE name = ${deviceName}
    `;
    return result.count; // postgres package uses .count instead of .rowCount
  } catch (error) {
    console.error('Error checking in device:', error);
    throw error;
  }
}

// HTML template with inline CSS and JavaScript
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>G'day Test Device Tracker</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Open Sans', sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background: white;
      padding: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
      margin-bottom: 30px;
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .logo {
      height: 60px;
      width: auto;
      order: 2;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 600;
      color: #2c2c2c;
      order: 1;
    }
    
    .table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      margin-bottom: 20px;
    }
    
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }
    
    thead {
      background: #2c2c2c;
      color: white;
    }
    
    th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    
    tbody tr {
      transition: background-color 0.2s ease;
      background: white;
    }
    
    tbody tr:hover {
      background-color: #f9f9f9;
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .status-available {
      background: #d4edda;
      color: #155724;
    }
    
    .status-checked-out {
      background: #fff3cd;
      color: #856404;
    }
    
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-family: 'Open Sans', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-checkout {
      background: #f7d940;
      color: #2c2c2c;
    }
    
    .btn-checkout:hover {
      background: #f5d320;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .btn-checkin {
      background: #6c757d;
      color: white;
    }
    
    .btn-checkin:hover {
      background: #5a6268;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    .empty-cell {
      color: #999;
      font-style: italic;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    /* Mobile responsive */
    @media (max-width: 768px) {
      .container {
        padding: 10px;
      }
      
      header {
        padding: 15px 0;
      }
      
      .header-content {
        padding: 0 15px;
        flex-direction: row;
      }
      
      .logo {
        height: 50px;
      }
      
      h1 {
        font-size: 22px;
      }
      
      table {
        font-size: 14px;
      }
      
      th, td {
        padding: 10px 8px;
      }
      
      th {
        font-size: 12px;
      }
      
      button {
        padding: 6px 12px;
        font-size: 12px;
      }
      
      .status-badge {
        font-size: 11px;
        padding: 4px 8px;
      }
      
      /* Stack table on very small screens */
      @media (max-width: 480px) {
        table, thead, tbody, th, td, tr {
          display: block;
        }
        
        thead tr {
          position: absolute;
          top: -9999px;
          left: -9999px;
        }
        
        tr {
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        td {
          border: none;
          position: relative;
          padding-left: 50%;
          text-align: right;
        }
        
        td:before {
          position: absolute;
          left: 10px;
          width: 45%;
          padding-right: 10px;
          white-space: nowrap;
          text-align: left;
          font-weight: 600;
          content: attr(data-label);
        }
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <h1>G'day Test Device Tracker</h1>
      <img src="https://careers.gdaygroup.com.au/files/images/_450x450_fit_center-center_none/logo_gday-group.webp" alt="G'day Group Logo" class="logo">
    </div>
  </header>
  
  <div class="container">
    <div id="error-container"></div>
    <div class="table-container">
      <table id="devices-table">
        <thead>
          <tr>
            <th>Device Name</th>
            <th>Borrower</th>
            <th>Date Checked Out</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="devices-tbody">
          <tr>
            <td colspan="5" class="loading">Loading devices...</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <script>
    // Fetch and display devices
    async function loadDevices() {
      try {
        const response = await fetch('/api/devices');
        
        if (!response.ok) {
          throw new Error('Failed to fetch devices');
        }
        
        const devices = await response.json();
        renderDevices(devices);
        clearError();
      } catch (error) {
        console.error('Error loading devices:', error);
        showError('Failed to load devices. Please refresh the page.');
      }
    }
    
    // Render devices in table
    function renderDevices(devices) {
      const tbody = document.getElementById('devices-tbody');
      
      if (devices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No devices found</td></tr>';
        return;
      }
      
      tbody.innerHTML = devices.map(device => {
        const isAvailable = device.status === 'Available';
        const borrower = device.borrower || '<span class="empty-cell">—</span>';
        const date = device.checked_out_date 
          ? new Date(device.checked_out_date).toLocaleDateString() 
          : '<span class="empty-cell">—</span>';
        
        const statusClass = isAvailable ? 'status-available' : 'status-checked-out';
        
        const actionButton = isAvailable
          ? \`<button class="btn-checkout" onclick="checkoutDevice('\${device.name}')">Check Out</button>\`
          : \`<button class="btn-checkin" onclick="checkinDevice('\${device.name}')">Check In</button>\`;
        
        return \`
          <tr>
            <td data-label="Device Name">\${device.name}</td>
            <td data-label="Borrower">\${borrower}</td>
            <td data-label="Date Checked Out">\${date}</td>
            <td data-label="Status"><span class="status-badge \${statusClass}">\${device.status}</span></td>
            <td data-label="Action">\${actionButton}</td>
          </tr>
        \`;
      }).join('');
    }
    
    // Check out device
    async function checkoutDevice(deviceName) {
      const borrower = prompt('Enter your name:');
      
      if (!borrower || borrower.trim() === '') {
        return;
      }
      
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            device: deviceName,
            borrower: borrower.trim()
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to check out device');
        }
        
        await loadDevices();
      } catch (error) {
        console.error('Error checking out device:', error);
        showError(error.message);
      }
    }
    
    // Check in device
    async function checkinDevice(deviceName) {
      if (!confirm(\`Are you sure you want to check in \${deviceName}?\`)) {
        return;
      }
      
      try {
        const response = await fetch('/api/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            device: deviceName
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to check in device');
        }
        
        await loadDevices();
      } catch (error) {
        console.error('Error checking in device:', error);
        showError(error.message);
      }
    }
    
    // Show error message
    function showError(message) {
      const errorContainer = document.getElementById('error-container');
      errorContainer.innerHTML = \`<div class="error">\${message}</div>\`;
    }
    
    // Clear error message
    function clearError() {
      const errorContainer = document.getElementById('error-container');
      errorContainer.innerHTML = '';
    }
    
    // Initial load
    loadDevices();
    
    // Auto-refresh every 30 seconds
    setInterval(loadDevices, 30000);
  </script>
</body>
</html>
`;

// API handler function (async)
async function handleRequest(req, res) {
  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;
  
  // Set CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Route: Serve HTML
  if (pathname === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML_TEMPLATE);
    return;
  }
  
  // Route: Get all devices
  if (pathname === '/api/devices' && method === 'GET') {
    try {
      const devices = await getAllDevices();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(devices));
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }
  
  // Route: Check out device
  if (pathname === '/api/checkout' && method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { device, borrower } = JSON.parse(body);
        
        // Validate input
        if (!device || !borrower) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Device and borrower are required' }));
          return;
        }
        
        // Update device
        const rowCount = await checkoutDevice(device, borrower);
        
        if (rowCount === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Device not found' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Device checked out successfully' }));
      } catch (error) {
        console.error('Error checking out device:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }
  
  // Route: Check in device
  if (pathname === '/api/checkin' && method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { device } = JSON.parse(body);
        
        // Validate input
        if (!device) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Device is required' }));
          return;
        }
        
        // Update device
        const rowCount = await checkinDevice(device);
        
        if (rowCount === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Device not found' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Device checked in successfully' }));
      } catch (error) {
        console.error('Error checking in device:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }
  
  // 404 Not Found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Create HTTP server
const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(error => {
    console.error('Request handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 G'day Test Device Tracker running on http://localhost:${PORT}`);
  console.log(`📊 Database: Vercel Postgres`);
  console.log(`Press Ctrl+C to stop`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
