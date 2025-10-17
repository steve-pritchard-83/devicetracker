# G'day Test Device Tracker

A single-file web application for managing test device checkouts with real-time updates, deployed on Vercel with Postgres database.

## Features

- 📱 Track multiple test devices (phones and tablets)
- 👤 Check out devices with borrower names
- ✅ Check in devices when returned
- 🔄 Auto-refresh every 30 seconds
- 📊 Vercel Postgres database for persistent storage
- 🎨 Modern, responsive UI with G'day Group branding
- 🚀 Single file deployment on Vercel

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables (see env.example)
# Copy env.example to .env and add your Postgres credentials

# Start the server
npm start
```

The application will be available at `http://localhost:3000`

## Deploy to Vercel

### Prerequisites
- [Vercel CLI](https://vercel.com/docs/cli) installed
- Vercel account

### Deployment Steps

#### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

#### 2. Deploy to Vercel
```bash
# Navigate to project directory
cd gday-test-device-tracker

# Deploy (follow prompts)
vercel
```

#### 3. Add Postgres Database

After initial deployment:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to the "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Follow the prompts to create a Postgres database
7. Vercel will automatically set all required environment variables

#### 4. Redeploy

After adding the database, redeploy to initialize the schema and seed data:

```bash
vercel --prod
```

The database will automatically:
- Create the `devices` table
- Seed with 7 pre-configured test devices

### Environment Variables

When you add Postgres storage in Vercel, these are automatically configured:

- `POSTGRES_URL` - Full connection string
- `POSTGRES_PRISMA_URL` - Connection string with pooling
- `POSTGRES_URL_NON_POOLING` - Direct connection string
- `POSTGRES_USER` - Database user
- `POSTGRES_HOST` - Database host
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DATABASE` - Database name

No manual configuration needed!

## Pre-populated Devices

The application comes pre-seeded with the following test devices:
- Samsung Galaxy S5
- Samsung Galaxy S5 Ultra
- Samsung Galaxy Tab S11
- iPhone 15
- iPhone 16 Pro Max
- iPhone 13 Mini
- Google Pixel 8A

## API Endpoints

- `GET /` - Serve the web interface
- `GET /api/devices` - Get all devices as JSON
- `POST /api/checkout` - Check out a device (body: `{device, borrower}`)
- `POST /api/checkin` - Check in a device (body: `{device}`)

## Tech Stack

- **Backend**: Node.js with native `http` module
- **Database**: Vercel Postgres (PostgreSQL)
- **Frontend**: Vanilla JavaScript with inline HTML/CSS
- **Styling**: Custom CSS with Open Sans font and G'day Group branding (#f7d940)
- **Deployment**: Vercel Serverless Functions

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  borrower TEXT,
  checked_out_date TIMESTAMP,
  status TEXT DEFAULT 'Available'
)
```

## Project Structure

```
gday-test-device-tracker/
├── server.js           # Complete application (single file)
├── vercel.json         # Vercel deployment configuration
├── package.json        # Dependencies and scripts
├── env.example         # Environment variable template
└── README.md           # This file
```

## Troubleshooting

### Database Connection Issues
- Ensure Postgres database is created in Vercel dashboard
- Check that environment variables are set in Vercel project settings
- Redeploy after adding database

### Local Development
- For local testing, you'll need a Postgres database
- Set up environment variables in `.env` file (see `env.example`)
- Consider using a free Postgres provider like Supabase or Neon for local dev

## Production URL

After deployment, your app will be available at:
```
https://your-project-name.vercel.app
```

## License

MIT
