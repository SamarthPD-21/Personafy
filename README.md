<div align="center">
  <h1>✨ Personafy ✨</h1>
  <p><strong>An immersive, persona-driven AI chat experience built for fluid conversations.</strong></p>
  <p>Distinct voices. Smooth animations. Local persistence. Pick a persona and dive in.</p>
</div>

---

## 🌟 Overview

**Personafy** is a polished, full-stack chatbot application that allows users to seamlessly switch between distinct AI personas. Each persona has its own unique system prompt, philosophy, communication style, and visual theme.

The application features a beautifully crafted, premium dark-mode interface powered by **Tailwind CSS v4** and **Framer Motion**, delivering an incredibly fluid user experience with spring-based animations, typing indicators, and a dynamic character-by-character output stream.

## ✨ Key Features

- 🎭 **Distinct AI Personas**: Interact with curated personas (e.g., direct & disciplined, calm & structured, friendly & intuitive).
- 🎨 **Premium Aesthetic**: Sleek glass-morphism panels, subtle radial glow gradients tied to persona accents, and a deep dark mode.
- 🌊 **Fluid Animations**: High-quality entrance animations, spring-physics interactions, and seamless transitions using Framer Motion.
- 💾 **Local Persistence & Threading**: Each persona maintains its own independent history of chat threads. All data is saved automatically to your local storage.
- ✏️ **Manage Conversations**: Start multiple threads per persona and easily **double-click to rename** any thread.
- ⌨️ **Typewriter Streaming**: Natural, character-by-character controlled streaming output from the Gemini API.

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Language**: TypeScript

### Backend (`/backend`)
- **Server**: [Express.js](https://expressjs.com/) (Node.js)
- **AI Integration**: [Google Generative AI SDK](https://ai.google.dev/) (Gemini 2.5 Flash Lite)
- **Communication**: Server-Sent Events (SSE) for real-time text streaming.

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/SamarthPD-21/Personafy.git
cd Personafy
```

### 2. Environment Setup
Create a `.env` file in the **root directory** of the project and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```
*(The backend server will automatically look for the `.env` file in the root directory).*

### 3. Start the Backend Server
Open a terminal instance and run:
```bash
cd backend
npm install
npm run dev
```
*The server will start on `http://localhost:5000`.*

### 4. Start the Frontend Client
Open a second terminal instance and run:
```bash
cd client
npm install
npm run dev
```
*The application will be available at `http://localhost:3000`.*

---

## 💡 How It Works

1. **System Instructions**: The backend dynamically injects highly specific persona instructions (found in `backend/personas.js`) into the Gemini model based on your selection.
2. **Streaming**: When the model generates a response, the Express server streams it down using Server-Sent Events (SSE), artificially delaying characters slightly to simulate a human-like typing speed.
3. **State Management**: The React frontend captures the stream, updates the UI in real-time with Framer Motion animations, and persists the data to `localStorage`.

---

<div align="center">
  <p>Built with ❤️ and Gemini</p>
</div>
