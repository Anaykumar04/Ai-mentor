# AI-Powered Coding Practice Assistant

A full-stack project providing a collaborative, AI-mentored coding environment.

## Folder Structure

\`\`\`
d:/coding practice
├── backend/
│   ├── .env
│   ├── package.json
│   ├── server.js
│   ├── controllers/
│   │   └── codeController.js
│   ├── models/
│   │   └── UserProgress.js
│   └── routes/
│       └── api.js
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   ├── components/
    │   │   ├── AIHints.jsx
    │   │   ├── CodeOutput.jsx
    │   │   └── Navbar.jsx
    │   └── pages/
    │       ├── CodeEditor.jsx
    │       └── Dashboard.jsx
\`\`\`

## Getting Started

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   \`cd "d:/coding practice/backend"\`
2. Update the API keys in \`.env\`:
   - \`GEMINI_API_KEY\`: For AI hints (using Gemini 2.5 Pro).
   - \`JUDGE0_API_KEY\`: For code execution (required for real execution, otherwise falls back to mocked response).
3. Ensure MongoDB is running on your machine (default \`mongodb://localhost:27017/coding-assistant\`).
4. Start the server:
   \`npx nodemon server.js\` or \`node server.js\` (Runs on http://localhost:5000)

### 2. Frontend Setup

1. Open another terminal and navigate to the frontend directory:
   \`cd "d:/coding practice/frontend"\`
2. Start the Vite development server:
   \`npm run dev\` (Usually runs on http://localhost:5173)

## Features Included

- **Monaco Editor**: Powerful web-based code editor used in VS Code.
- **Judge0 Integration Fallbacks**: Submits code for remote execution. Auto-mocks if API key is not present.
- **AI Mentoring System**: Uses Google Gen AI SDK (\`@google/genai\`) and parses structured JSON to simulate an AI mentor without providing full code solutions.
- **Progress Tracking**: Tracks success/error submissions via MongoDB and mongoose.
- **Premium UI**: Crafted using Tailwind CSS, including dark mode conventions, glassmorphism, subtle interaction states, and \`lucide-react\` icons.
