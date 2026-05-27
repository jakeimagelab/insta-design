import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return NextResponse.json({
      ok: false,
      step: "env",
      error: "ANTHROPIC_API_KEY 환경변수가 없음 — Vercel에서 설정 필요",
    });
  }

  const keyPreview = key.slice(0, 20) + "..." + key.slice(-4);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    const body = await res.json();

    if (res.ok) {
      return NextResponse.json({
        ok: true,
        keyPreview,
        status: res.status,
        model: body.model,
        message: "API 키 정상 작동!",
      });
    } else {
      return NextResponse.json({
        ok: false,
        step: "api_call",
        keyPreview,
        status: res.status,
        error: body?.error?.message || JSON.stringify(body),
        type: body?.error?.type,
      });
    }
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      step: "network",
      keyPreview,
      error: err.message,
    });
  }
}
