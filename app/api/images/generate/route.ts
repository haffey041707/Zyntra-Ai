import { NextResponse } from "next/server";

const MAX_PROMPT_LENGTH = 2_000;

export async function POST(request: Request) {
  const { prompt } = await request.json();
  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Describe the image you want to generate." }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ error: "Image prompts must be 2,000 characters or fewer." }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Image generation needs OPENAI_API_KEY configured on the server. Image analysis is available locally through Ollama." }, { status: 503 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2.5-flare", prompt: prompt.trim(), n: 1, size: "1024x1024", quality: "medium", output_format: "png", moderation: "auto" }),
      signal: AbortSignal.timeout(120_000),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message ?? "Image provider rejected the request." }, { status: response.status });
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: "The image provider returned no image." }, { status: 502 });
    return NextResponse.json({ image: `data:image/png;base64,${b64}`, provider: "OpenAI GPT Image" });
  } catch {
    return NextResponse.json({ error: "Image generation timed out or is temporarily unavailable." }, { status: 503 });
  }
}
