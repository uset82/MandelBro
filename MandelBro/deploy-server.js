// Deploy server to Render.com
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a temporary directory for deployment
const deployDir = path.join(__dirname, 'deploy');
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir);
}

// Copy server files to deployment directory
fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(deployDir, 'server.js'));
fs.copyFileSync(path.join(__dirname, 'package.json'), path.join(deployDir, 'package.json'));
fs.copyFileSync(path.join(__dirname, 'render.yaml'), path.join(deployDir, 'render.yaml'));

// Create a README.md file with deployment instructions
const readmeContent = `# MandelBro Server

This is the multiplayer server for the MandelBro game.

## Deployment Instructions

1. Create a new web service on Render.com
2. Connect your GitHub repository
3. Use the following settings:
   - Name: mandelbro-server
   - Environment: Node
   - Build Command: npm install
   - Start Command: node server.js
   - Plan: Free

The server will be automatically deployed and available at your Render.com URL.
`;

fs.writeFileSync(path.join(deployDir, 'README.md'), readmeContent);

console.log('Server files prepared for deployment to Render.com');
console.log('Deployment URL: https://mandelbro-server.onrender.com');
