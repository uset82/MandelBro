# MandelBro Deployment Guide

This document provides instructions for deploying the MandelBro game to a production environment.

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- A server with Node.js support for the backend
- A static file hosting service for the frontend (or the same server)

## Building the Client

1. Install dependencies:
   ```
   npm install
   ```

2. Build the production version:
   ```
   npm run build
   ```

   This will create a `dist` directory with optimized files ready for deployment.

## Setting Up the Server

1. Navigate to the server directory:
   ```
   cd src/server
   ```

2. Install server dependencies:
   ```
   npm install
   ```

3. Configure environment variables by creating a `.env` file:
   ```
   PORT=3000
   NODE_ENV=production
   ```

## Deployment Options

### Option 1: Single Server Deployment

1. Copy the built client files to the server's public directory:
   ```
   cp -r ../../dist/* ./public/
   ```

2. Start the server:
   ```
   npm start
   ```

   The game will be accessible at `http://your-server-address:3000`

### Option 2: Separate Frontend and Backend

1. Deploy the backend server:
   ```
   cd src/server
   npm start
   ```

2. Deploy the frontend to a static hosting service (like Netlify, Vercel, or GitHub Pages).

3. Update the Socket.io connection in the client code to point to your backend server.

### Option 3: Docker Deployment

1. Build the Docker image:
   ```
   docker build -t mandelbro .
   ```

2. Run the container:
   ```
   docker run -p 3000:3000 mandelbro
   ```

## Scaling Considerations

- For handling more concurrent users, consider using a load balancer with multiple server instances.
- Socket.io can be configured with Redis adapter for multi-server setups.
- Consider using a CDN for static assets to improve loading times.

## Monitoring

- Set up monitoring for server health and performance.
- Implement logging for tracking errors and user activity.
- Consider using services like New Relic, Datadog, or Prometheus for monitoring.

## Backup Strategy

- Regularly backup world data if persistence is implemented.
- Consider using a database for storing world information instead of in-memory storage for production.

## Security Considerations

- Implement rate limiting to prevent abuse.
- Add input validation on both client and server.
- Consider adding authentication for administrative functions.
- Keep dependencies updated to address security vulnerabilities.
