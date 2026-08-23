# Intelligent Helpdesk (AI-SUMMIT)

This project is an Intelligent Helpdesk platform featuring a FastAPI backend powered by AI (Groq & Ollama) and a React/Vite frontend. It utilizes Retrieval-Augmented Generation (RAG) to provide automated, context-aware assistance based on a local knowledge base.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Git**
- **Python 3.11** (Required version for compatibility)
- **Node.js** (v16 or higher) & **npm**
- **Ollama**: Download and install from [ollama.com](https://ollama.com/)

## Getting Started

Follow these step-by-step instructions to clone and run the project on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/6SHIHAB9/AI-SUMMIT.git
cd AI-SUMMIT
```

### 2. Set up the AI Embedding Model (Ollama)

The backend uses the `nomic-embed-text` model via Ollama to generate vector embeddings for the knowledge base. 
Ensure the Ollama application is running on your machine, then execute the following command to download the model:

```bash
ollama pull nomic-embed-text
```

### 3. Backend Setup (FastAPI)

Open a new terminal window and navigate to the backend directory:

```bash
cd backend
```

**Create and activate a virtual environment:**
- **Windows:**
  ```bash
  python3.11 -m venv venv
  venv\Scripts\activate
  ```
- **Mac/Linux:**
  ```bash
  python3.11 -m venv venv
  source venv/bin/activate
  ```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Environment Variables:**
Ensure there is a `.env` file in the `backend` directory. It must contain the necessary configuration and API keys. Example:
```env
GROQ_API_KEY="your_groq_api_key_here"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_EMBED_MODEL="nomic-embed-text"
RAG_TOP_K=4
RAG_RELEVANCE_THRESHOLD=330.0
```

**Start the Backend Server:**
```bash
uvicorn main:app --reload
```
The backend API will now be running at `http://127.0.0.1:8000`. The server will automatically ingest the knowledge base in the background when it starts up.

### 4. Frontend Setup (React + Vite)

Open a separate terminal window and navigate to the frontend directory:

```bash
cd frontend
```

**Install Node.js dependencies:**
```bash
npm install
```

**Start the Development Server:**
```bash
npm run dev
```

Vite will start the server and print a local URL (typically `http://localhost:5173`). Open this URL in your web browser to interact with the application.

## Project Structure

- `/backend` - FastAPI application, database models, AI service integrations, and vector store scripts.
- `/frontend` - React application using Vite.
- `/knowledge_base` - Markdown files used as context for the RAG AI system.
