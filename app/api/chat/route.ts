import { NextResponse } from "next/server";

const system = `You are ZYNTRA AI, a cybersecurity research assistant. Support authorized, defensive security education. Explain concepts, detection, mitigation, and safe lab alternatives. Do not provide instructions enabling unauthorized compromise, credential theft, destructive malware, exfiltration, or monitoring evasion.`;

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  const { input, images = [], research = false } = await request.json();
  if (typeof input !== "string" || !input.trim()) return NextResponse.json({ error: "A message is required." }, { status: 400 });
  const content = [
    { type: "input_text", text: input.slice(0, 20_000) },
    ...images.slice(0, 4).map((image_url: string) => ({ type: "input_image", image_url })),
  ];
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-6.1-terra",
      reasoning: { effort: research ? "high" : "medium" },
      instructions: system,
      input: [{ role: "user", content }],
      max_output_tokens: research ? 5000 : 1800,
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const body = await response.json();
  if (!response.ok) return NextResponse.json({ error: body.error?.message ?? "OpenAI request failed." }, { status: response.status });
  return NextResponse.json({ text: body.output_text ?? "No response text returned." });
}
