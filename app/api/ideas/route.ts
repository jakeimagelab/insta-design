import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ContentIdea = {
  day:         string;   // 월~일
  type:        string;   // portfolio | bts | philosophy | space | profile
  emoji:       string;
  title:       string;   // 15자 이내 포스트 제목
  hook:        string;   // 첫 문장 (후킹 카피)
  caption:     string;   // 2~3줄 캡션 아이디어
  hashtags:    string;   // 주요 태그 4~5개
  designHint:  string;   // AI 디자인 프롬프트용 힌트
};

const MOCK_IDEAS: Record<string, ContentIdea[]> = {
  default: [
    { day:"월", type:"philosophy", emoji:"💭", title:"병원사진이란 무엇인가",
      hook:"예쁜 사진보다 중요한 것", caption:"환자가 처음 홈페이지를 열었을 때\n'여기라면 괜찮겠다'는 마음이 드는 것.\n그게 좋은 병원사진입니다.",
      hashtags:"#병원브랜딩 #의료브랜딩 #병원마케팅 #포토클리닉", designHint:"철학·생각, 따뜻한 크림 배경, 세리프 폰트" },
    { day:"화", type:"bts", emoji:"🎬", title:"촬영 현장 비하인드",
      hook:"카메라를 들기 전 먼저 하는 일", caption:"촬영 시작 전, 항상 병원을 한 바퀴 걷습니다.\n빛이 어느 공간에 드는지,\n그 시간이 사진의 절반입니다.",
      hashtags:"#촬영현장 #비하인드 #병원사진촬영 #포토클리닉", designHint:"촬영 현장, 다크 오버레이, 감성적" },
    { day:"목", type:"portfolio", emoji:"📸", title:"이번 주 포트폴리오",
      hook:"원장님의 진심이 담긴 순간", caption:"셔터를 누르는 순간,\n카메라 앞에서도 원장님의 따뜻함은\n숨길 수가 없었습니다.",
      hashtags:"#포트폴리오 #병원사진 #원장프로필 #포토클리닉", designHint:"포트폴리오, 사진 중심, 세련된 레이아웃" },
    { day:"금", type:"space", emoji:"🏛", title:"공간이 말하는 것들",
      hook:"로비에 들어서자마자 멈췄습니다", caption:"천장에서 내려오는 자연광이\n대리석 바닥에 길게 드리워져 있었어요.\n이 공간을 설계한 사람의 생각이 느껴졌습니다.",
      hashtags:"#병원인테리어 #공간사진 #병원공간 #포토클리닉", designHint:"공간 감성, 밝고 따뜻한 톤, 여백 강조" },
    { day:"토", type:"profile", emoji:"👤", title:"의료진 프로필",
      hook:"'이게 저예요?' — 원장님이 사진을 보며", caption:"항상 그게 당신이었는데\n카메라가 처음으로 보여준 것뿐입니다.",
      hashtags:"#의료진프로필 #원장프로필 #닥터 #포토클리닉", designHint:"의료진 프로필, 따뜻한 인물 사진, 감성적" },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const { dept, style, count=7, week } = await req.json();

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ ok: true, mock: true, ideas: MOCK_IDEAS.default });

    const prompt = `당신은 포토클리닉(@photoclinic_kr) 인스타그램 콘텐츠 전략가입니다.
포토클리닉은 병원 브랜딩 전문 사진·영상 스튜디오입니다.

병원 정보:
- 진료과: ${dept || "병원(일반)"}
- 분위기/스타일: ${style || "따뜻·감성"}
- 주차: ${week || "이번 주"}
- 포스트 수: ${count}개

아래 조건으로 주간 콘텐츠 플랜을 만들어주세요:
1. 유형 다양하게 (portfolio/bts/philosophy/space/profile 균형 있게)
2. 월~일 요일 배분 (주 ${count}회 업로드 기준)
3. 각 포스트는 구체적이고 실행 가능해야 함
4. 포토클리닉의 따뜻하고 스토리텔링적인 톤 유지
5. designHint는 AI 디자인 프롬프트로 바로 사용 가능한 1~2줄

아래 JSON 배열만 반환 (마크다운 없이):
[
  {
    "day": "월",
    "type": "portfolio",
    "emoji": "📸",
    "title": "15자 이내 제목",
    "hook": "첫 문장 — 스크롤 멈추게 하는 한 줄",
    "caption": "2~3줄 캡션 아이디어 (\\n으로 줄바꿈)",
    "hashtags": "#태그1 #태그2 #태그3 #포토클리닉",
    "designHint": "AI 디자인 생성에 쓸 1~2줄 설명"
  }
]`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API ${res.status}`);
    const data = await res.json();
    const txt  = (data.content || []).map((b: any) => b.text || "").join("");
    const s = txt.indexOf("["), e = txt.lastIndexOf("]");
    if (s < 0 || e < 0) throw new Error("JSON 파싱 실패");
    const ideas: ContentIdea[] = JSON.parse(txt.slice(s, e + 1));
    return NextResponse.json({ ok: true, ideas });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
