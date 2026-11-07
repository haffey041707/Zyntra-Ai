# Zyntra

Zyntra is a local AI cybersecurity research workspace. It can run on another Mac or desktop computer with Ollama, so each person can use their own local models.

## Links

- Source code: https://github.com/haffey041707/Zyntra-Ai
- Hosted interface: https://zyntraai-weld.vercel.app

## Live demo

Open Zyntra in your browser: **[zyntraai-weld.vercel.app](https://zyntraai-weld.vercel.app)**

> The hosted interface cannot use Ollama installed on your personal computer. For free local AI, run this project on the same computer as Ollama.

## Run Zyntra on another computer

### 1. Install required software

- Install [Node.js](https://nodejs.org/).
- Install [Ollama](https://ollama.com/).
- Install [Git](https://git-scm.com/) or download this repository as a ZIP file.

### 2. Download the Zyntra Ollama models

Open the normal Terminal app (macOS) or PowerShell/Terminal (Windows), then run:

```bash
ollama pull qwen2.5:3b
ollama pull qwen2.5vl:3b
```

`qwen2.5:3b` answers normal text questions. `qwen2.5vl:3b` recognizes submitted images.

### 3. Start Ollama

In that same Terminal window, run:

```bash
ollama serve
```

Keep this Terminal window open while using Zyntra. If it says the address is already in use, Ollama is already running and you can continue.

### 4. Download and start the project

In a second Terminal window:

```bash
git clone https://github.com/haffey041707/Zyntra-Ai.git
cd Zyntra-Ai
npm install
npm run dev
```

If you downloaded a ZIP instead, unzip it, open its `Zyntra-Ai` folder in VS Code, choose **Terminal → New Terminal**, and run:

```bash
npm install
npm run dev
```

### 5. Open Zyntra

Open the local address shown in the terminal, usually:

```text
http://127.0.0.1:5173
```

## Optional local configuration

The defaults already connect to Ollama at `http://127.0.0.1:11434`. To use different model names, copy `.env.example` to `.env.local` and update only these values:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_VISION_MODEL=qwen2.5vl:3b
```

Never share `.env.local`; it may contain private API keys or login secrets.

## Safety

Zyntra is for authorized security research, learning, and defensive engineering. Do not use it for unauthorized access, credential theft, destructive malware, data exfiltration, or evading monitoring.
