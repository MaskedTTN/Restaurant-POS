# Restaurant Point of Sale Frontend

A modern Next.js frontend for managing restaurant POS systems with organization, location, device, and analytics management.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory and add your FastAPI backend URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
```

Replace `http://localhost:8000` with your actual FastAPI backend URL.

### 3. Start Your FastAPI Backend

Make sure your FastAPI backend is running before starting the frontend. The backend should be accessible at the URL you configured in `NEXT_PUBLIC_API_URL`.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Authentication**: Sign up and login with JWT token-based authentication
- **Organizations**: Create and manage restaurant organizations
- **Locations**: Add locations and manage licenses for each restaurant
- **Device Registration**: Start device registration process for POS terminals
- **Analytics**: View business metrics and performance data

## API Endpoints

The frontend connects to these FastAPI endpoints:

- `POST /user/signup` - User registration
- `POST /user/login` - User authentication
- Organization, location, device, and analytics endpoints as defined in your Swagger documentation

## Troubleshooting

**Error: Cannot connect to API server**

- Ensure your FastAPI backend is running
- Verify the `NEXT_PUBLIC_API_URL` in `.env.local` matches your backend URL
- Check that your backend is accessible (try visiting it in a browser)

**Error: Connection refused (ECONNREFUSED)**

- Your FastAPI backend is not running on the configured port
- Start your backend server first, then restart the Next.js dev server
