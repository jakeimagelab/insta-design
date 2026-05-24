import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { dept, topic, tone, hospitalName } = await req.json();

    if (!topic?.trim()) {
      return NextResponse.json({ ok: false, error: "주제를 입력해주세요." }, { status: 400 });
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      // API 키 없을 때 샘플 반환
      return NextResponse.json({ ok: true, mock: true, ...getMock(dept, topic, hospitalName) });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `당신은 병원 SNS 마케팅 전문가입니다.
아래 조건으로 인스타그램 게시물 캡션 3가지와 해시태그를 만들어주세요.

병원명: ${hospitalName || "포토클리닉"}
진료과목: ${dept || "병원"}
주제: ${topic}
톤: ${tone || "신뢰감·전문적"}

규칙:
- 캡션은 2~4줄, 이모지 1~2개만 사용
- 각 캡션은 다른 각도(감성적 / 정보적 / 신뢰감)로 작성
- 해시태그 20개, 도달률 높은 것과 니치 태그 혼합
- 의료광고 심의 기준 준수 (효과 보장·과장 표현 금지)
- 병원명이 있으면 마지막에 자연스럽게 포함

JSON만 반환:
{
  "captions": [
    {"type":"감성적","text":"..."},
    {"type":"정보적","text":"..."},
    {"type":"신뢰감","text":"..."}
  ],
  "hashtags": "#태그1 #태그2 ..."
}`
        }]
      }),
    });

    if (!res.ok) throw new Error(`Claude API ${res.status}`);
    const data = await res.json();
    const txt  = data.content?.map((b: any) => b.text || "").join("") || "";
    const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
    const parsed = JSON.parse(txt.slice(s, e + 1));
    return NextResponse.json({ ok: true, ...parsed });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

function getMock(dept: string, topic: string, name: string) {
  const hn = name || "포토클리닉";
  return {
    captions: [
      { type: "감성적", text: `당신의 이야기를 가장 아름답게 기록합니다 ✨\n${topic}의 순간, ${hn}이 함께합니다.` },
      { type: "정보적", text: `${dept || "병원"} 전문 ${topic} 🏥\n신뢰할 수 있는 병원 이미지, ${hn}이 만들어드립니다.` },
      { type: "신뢰감", text: `100곳 이상의 병원이 선택한 ${hn} 💚\n${topic}을 통해 환자의 마음을 여는 이미지를 만듭니다.` },
    ],
    hashtags: `#${dept || "병원"}사진 #병원브랜딩 #의료진프로필 #병원홍보 #원장프로필 #${hn} #병원인테리어사진 #의사프로필 #병원마케팅 #병원sns #의료마케팅 #병원촬영 #브랜드사진 #병원이미지 #포토클리닉`,
  };
}
