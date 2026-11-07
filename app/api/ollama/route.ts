import { NextResponse } from "next/server";

const system = `You are ZYNTRA AI, a cybersecurity research assistant. Help with authorized security education, vulnerability analysis, defensive engineering, incident response, malware analysis, and secure development. Explain security concepts, detection, mitigation, and safe lab alternatives. Do not provide instructions for unauthorized access, credential theft, destructive malware, data exfiltration, ransomware, or evading monitoring.`;

export async function POST(request: Request) {
  const { messages, research = false, model } = await request.json();
  if (!Array.isArray(messages)) return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
  const hasImages = messages.some((message) => Array.isArray(message.images) && message.images.length > 0);
  const selectedModel = model ?? (hasImages ? process.env.OLLAMA_VISION_MODEL ?? "qwen2.5vl:3b" : process.env.OLLAMA_MODEL ?? "qwen2.5:3b");
  try {
    const response = await fetch(`${process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: selectedModel, stream: true, think: false, keep_alive: "30m", messages: [{ role: "system", content: system }, ...messages], options: { temperature: research ? 0.2 : 0.45, num_ctx: hasImages ? 8192 : 2048, num_predict: research ? 800 : 500 } }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      const body = await response.json();
      return NextResponse.json({ error: body.error ?? "Ollama request failed" }, { status: response.status });
    }
    return new Response(response.body, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache" } });
  } catch {
    return NextResponse.json({ error: "Ollama is unavailable. Start it with: ollama serve" }, { status: 503 });
  }
}
