# MandelBro

## Project Overview
MandelBro is an interactive, multiplayer kids game creator that uses the Mandelbrot set for procedural world generation. It allows children to create unique, explorable worlds by simply describing them in natural language. The game converts these descriptions into parameters for the Mandelbrot set, generating visually interesting and mathematically-based worlds that can be shared with friends using unique codes.

The project includes both a standalone browser-based version that works without any server connections, and a more complex server-based implementation with full multiplayer functionality.

## Functionality

### Core Features
- **Natural Language World Creation**: Kids can create worlds by describing them in simple language
- **Voice Input Support**: Allows even young children to create worlds without typing
- **Procedural Generation**: Uses the Mandelbrot set to create infinite, unique worlds
- **Template Worlds**: Pre-built templates including Minecraft-style, airplane games, car racing, etc.
- **Multiplayer Functionality**: Children can share worlds with friends using unique codes
- **Child-Friendly Interface**: Intuitive, colorful design optimized for children
- **Accessibility Features**: High contrast mode, reduced motion, and adjustable text size

### How It Works
1. **World Description**: Users describe the world they want to create using text or voice
2. **Parameter Conversion**: The system converts the description into specific Mandelbrot set parameters
3. **World Generation**: The Mandelbrot equation is used to generate terrain, features, and landscapes
4. **Asset Placement**: Trees, rocks, buildings, and other objects are placed based on the terrain
5. **Exploration**: Users can explore their world, zooming in to discover infinite detail
6. **Sharing**: A unique 6-character code is generated for sharing with friends

## APIs Used

### Simplified Version (Browser-Only)
The simplified version runs entirely in the browser and doesn't require any external APIs. It uses:
- **HTML5 Canvas API**: For rendering the Mandelbrot set
- **Web Speech API**: For voice input functionality (optional)

### Full Version (Server-Based)
The full version with multiplayer functionality uses:
- **Google Gemini API**: 
  - `gemini-2.5-pro-preview-03-25` for backend logic, procedural generation interpretation, and gameplay mechanics
  - `gemini-2.0-flash-exp-image-generation` for rendering the game world and creating dynamic visuals
- **Socket.IO**: For real-time multiplayer communication
- **Express.js**: For the web server framework

## Installation

### Simplified Version (Browser-Only)
1. **Clone the repository**:
   ```
   git clone https://github.com/yourusername/MandelBro.git
   cd MandelBro
   ```

2. **Open the simplified version**:
   - Navigate to the `/simplified` directory
   - Open `index.html` in any modern web browser
   - No server or installation required

### Full Version (Server-Based)
1. **Clone the repository**:
   ```
   git clone https://github.com/yourusername/MandelBro.git
   cd MandelBro
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Configure API keys**:
   - Create a `.env` file in the root directory
   - Add your API keys (see API Requirements section)

4. **Start the server**:
   ```
   npm start
   ```

5. **Access the application**:
   - Open a web browser and navigate to `http://localhost:3000`

## API Requirements

### For the Full Version
To use the complete server-based version with all features, you'll need:

1. **Google Gemini API Key**:
   - Sign up at [Google AI Studio](https://ai.google.dev/)
   - Create an API key
   - Add to your `.env` file as `GEMINI_API_KEY=your_key_here`

2. **Server Hosting** (for multiplayer):
   - The server can be deployed to services like Render.com, Heroku, or Vercel
   - Follow the deployment instructions in `/docs/deployment.md`

## Security Note
⚠️ **IMPORTANT**: Never commit your API keys to version control or share them publicly. The `.env` file is included in `.gitignore` to prevent accidental commits. If you fork or clone this repository, you will need to obtain your own API keys.

## Project Structure
```
MandelBro/
├── docs/                  # Documentation
│   ├── user_guide.md      # User guide
│   ├── developer_guide.md # Developer documentation
│   └── deployment.md      # Deployment instructions
├── public/                # Public assets for server version
│   ├── css/               # Stylesheets
│   ├── js/                # Client-side JavaScript
│   └── assets/            # Images and other assets
├── server/                # Server-side code
│   ├── utils/             # Utility functions
│   └── WorldManager.js    # World management logic
├── simplified/            # Standalone browser version
│   └── index.html         # Complete game in a single file
├── src/                   # Source code
│   ├── client/            # Client-side code
│   ├── server/            # Server-side code
│   └── mandelbrot.py      # Mandelbrot generation logic
├── .env.example           # Example environment variables
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## Versions

### Simplified Version
The simplified version in the `/simplified` directory is a completely standalone implementation that:
- Works entirely in the browser without server connections
- Includes all template worlds
- Features real-time Mandelbrot set visualization
- Simulates multiplayer with a code-sharing system
- Has no external dependencies

### Full Version
The full version in the main project directories includes:
- Server-based multiplayer functionality
- AI-powered world generation using Google Gemini
- More advanced features and customization options
- Requires API keys and server hosting

## Live Demo
A live demo of the simplified version is available at:
https://eabsxuzi.manus.space

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- The Mandelbrot set was discovered by Benoit Mandelbrot
- Special thanks to all the children who tested and provided feedback on the game
