import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ContentIdea = {
  day:         string;
  type:        string;
  emoji:       string;
  title:       string;
  hook:        string;
  caption:     string;
  hashtags:    string;
  designHint:  string;
};

// ── 풍부한 Mock 아이디어 풀 ─────────────────────────────────
const IDEA_POOL: ContentIdea[] = [
  // PORTFOLIO
  { day:"월", type:"portfolio", emoji:"📸", title:"이번 주 촬영 결과",
    hook:"원장님의 진심이 담긴 순간",
    caption:"셔터를 누르는 순간,\n카메라 앞에서도 원장님의 따뜻함은\n숨길 수가 없었습니다.\n\n사진은 거짓말을 하지 않아요.",
    hashtags:"#포트폴리오 #병원사진 #원장프로필 #포토클리닉",
    designHint:"포트폴리오 중심, 사진 크게, 세련된 레이아웃, 크림 배경" },

  { day:"목", type:"portfolio", emoji:"🖼", title:"공간과 사람의 온도",
    hook:"로비에 들어서자마자 멈췄습니다",
    caption:"공간을 걷다 보면\n이 병원이 얼마나 많은 것을 생각하며\n만들어졌는지 느낄 수 있었습니다.\n\n그 생각들을 사진에 담는 것.\n그게 저희가 하는 일입니다.",
    hashtags:"#병원인테리어 #공간사진 #병원공간 #포토클리닉",
    designHint:"밝고 따뜻한 톤, 공간감 강조, 여백 충분히" },

  { day:"토", type:"portfolio", emoji:"✨", title:"최근 작업물 모음",
    hook:"다섯 곳의 병원, 다섯 개의 이야기",
    caption:"같은 진료과여도\n원장님마다 사진의 색깔이 다릅니다.\n\n그 차이를 만드는 건\n결국 사람입니다.",
    hashtags:"#포트폴리오 #병원브랜딩 #촬영결과물 #포토클리닉",
    designHint:"그리드 레이아웃, 다크 배경, 사진 여러 장 배치" },

  // BTS
  { day:"화", type:"bts", emoji:"🎬", title:"촬영 현장 비하인드",
    hook:"카메라를 들기 전 먼저 하는 일",
    caption:"촬영 시작 전,\n항상 병원을 한 바퀴 걷습니다.\n\n빛이 어느 공간에 드는지,\n어느 각도에서 사람이 자연스러운지.\n\n그 시간이 사진의 절반입니다.",
    hashtags:"#촬영현장 #비하인드 #병원사진촬영 #포토클리닉",
    designHint:"촬영 현장, 다크 오버레이, 감성적 분위기" },

  { day:"수", type:"bts", emoji:"🔦", title:"빛을 기다리는 시간",
    hook:"새벽 6시, 아무도 없는 병원에서",
    caption:"오늘도 새벽에 출발했습니다.\n병원이 열리기 전,\n빛이 어떻게 움직이는지 보고 싶었거든요.\n\n빈 공간은 정직합니다.",
    hashtags:"#비하인드 #촬영스튜디오 #BTS #포토클리닉",
    designHint:"새벽 빛, 시네마틱 분위기, 저채도 필름 톤" },

  { day:"금", type:"bts", emoji:"🎥", title:"장비 세팅 이야기",
    hook:"어떤 렌즈를 쓰냐고 물어보셨어요",
    caption:"렌즈가 아니라 시선이 중요합니다.\n\n같은 장비로도\n전혀 다른 사진이 나오는 건\n카메라를 들기 전\n무엇을 보았느냐의 차이입니다.",
    hashtags:"#촬영현장 #사진작가 #비하인드 #포토클리닉",
    designHint:"장비와 작업자, 다크톤, 전문적인 느낌" },

  // PHILOSOPHY
  { day:"월", type:"philosophy", emoji:"💭", title:"병원사진이란 무엇인가",
    hook:"예쁜 사진보다 중요한 것",
    caption:"환자가 처음 홈페이지를 열었을 때\n'여기라면 괜찮겠다'는 마음이 드는 것.\n그게 좋은 병원사진입니다.",
    hashtags:"#병원브랜딩 #의료브랜딩 #병원마케팅 #포토클리닉",
    designHint:"철학·생각, 따뜻한 크림 배경, 세리프 폰트, 짧은 텍스트 중심" },

  { day:"수", type:"philosophy", emoji:"🤍", title:"신뢰는 어디서 오는가",
    hook:"환자는 사진을 보고 병원을 고릅니다",
    caption:"첫인상은 바꿀 수 없습니다.\n하지만 만들 수는 있어요.\n\n좋은 사진은 광고가 아닙니다.\n그 병원의 태도를 보여주는 것입니다.",
    hashtags:"#의료브랜딩 #병원마케팅 #브랜딩철학 #포토클리닉",
    designHint:"텍스트 중심, 미니멀, 딥틸+화이트, 임팩트 폰트" },

  { day:"일", type:"philosophy", emoji:"🌿", title:"우리가 이 일을 하는 이유",
    hook:"10년 전 사진을 교체하러 온 원장님",
    caption:"오래된 병원 사진을 교체하고 싶다는\n원장님의 연락을 받았을 때,\n저희가 먼저 한 건\n기존 사진을 보는 일이었습니다.\n\n그 사진에도 원장님의 진심은 담겨 있었어요.",
    hashtags:"#병원브랜딩 #포토클리닉 #의료브랜딩 #브랜딩철학",
    designHint:"감성적, 따뜻한 에스프레소 톤, 스토리텔링 레이아웃" },

  // SPACE
  { day:"목", type:"space", emoji:"🏛", title:"공간이 말하는 것들",
    hook:"로비에 들어서자마자 멈췄습니다",
    caption:"천장에서 내려오는 자연광이\n대리석 바닥에 길게 드리워져 있었어요.\n이 공간을 설계한 사람의 생각이 느껴졌습니다.",
    hashtags:"#병원인테리어 #공간사진 #병원공간 #포토클리닉",
    designHint:"공간 감성, 밝고 따뜻한 톤, 여백 강조" },

  { day:"화", type:"space", emoji:"🪴", title:"디테일이 만드는 브랜드",
    hook:"원장님이 직접 고른 식물 한 화분",
    caption:"소품 하나, 식물 한 화분까지\n원장님이 직접 고르셨다고 했습니다.\n\n그 마음이 공간 곳곳에 배어 있었어요.",
    hashtags:"#병원인테리어 #인테리어사진 #의료공간 #포토클리닉",
    designHint:"공간 디테일 클로즈업, 따뜻한 자연광, 세련된 구도" },

  { day:"토", type:"space", emoji:"☀️", title:"빛이 있는 공간",
    hook:"오후 2시, 이 병원의 가장 아름다운 시간",
    caption:"어느 시간에 빛이 어떻게 드는지\n미리 알고 가는 것.\n\n그 준비가 사진에서 드러납니다.",
    hashtags:"#공간사진 #병원공간 #인테리어사진 #포토클리닉",
    designHint:"황금빛 자연광, 따뜻한 앰버 톤, 공간감 넓게" },

  // PROFILE
  { day:"토", type:"profile", emoji:"👤", title:"의료진 프로필",
    hook:"'이게 저예요?' — 원장님이 사진을 보며",
    caption:"항상 그게 당신이었는데\n카메라가 처음으로 보여준 것뿐입니다.",
    hashtags:"#의료진프로필 #원장프로필 #닥터 #포토클리닉",
    designHint:"의료진 프로필, 따뜻한 인물 사진, 감성적" },

  { day:"월", type:"profile", emoji:"🩺", title:"의사의 첫인상",
    hook:"사진 찍는 거 정말 어색한데",
    caption:"촬영 시작 전 원장님이 하신 말씀입니다.\n저희가 매번 듣는 말이에요.\n\n그래서 저희는 카메라를 바로 들지 않습니다.\n그냥 이야기를 나눕니다.\n\n그러다 보면 어느 순간\n원장님이 원장님이 됩니다.",
    hashtags:"#원장프로필 #의료진프로필 #프로필사진 #포토클리닉",
    designHint:"인물 중심, 따뜻한 배경, 자연스러운 표정 강조" },

  { day:"수", type:"profile", emoji:"💙", title:"프로필 이상의 것",
    hook:"얼굴이 아니라 태도를 찍습니다",
    caption:"프로필 사진은 얼굴을 찍는 게 아닙니다.\n\n그 사람이 어떤 의사가 되고 싶었는지,\n환자를 어떻게 대하는 사람인지.\n그걸 한 장에 담는 것입니다.",
    hashtags:"#의료진프로필 #원장프로필 #닥터 #포토클리닉",
    designHint:"미니멀 프로필, 딥틸 배경, 전문적이고 따뜻한 톤" },
];

const DAYS = ["월","화","수","목","금","토","일"];

function buildIdeas(dept: string, style: string, count: number): ContentIdea[] {
  // 진료과·스타일 키워드로 해시태그 커스터마이징
  const deptMap: Record<string, string> = {
    피부과:"#피부과 #피부과촬영 #dermatology",
    성형외과:"#성형외과 #성형외과사진 #plasticsurgery",
    치과:"#치과 #치과촬영 #dental",
    안과:"#안과 #안과촬영 #ophthalmology",
    정형외과:"#정형외과 #orthopedics",
    한의원:"#한의원 #한방 #한의원사진",
    산부인과:"#산부인과 #여성의원",
    내과:"#내과 #내과촬영",
  };
  const deptTag = dept && deptMap[dept] ? deptMap[dept] : (dept ? `#${dept}` : "");

  // 스타일별 designHint 접두어
  const styleHint =
    /럭셔|프리미엄|고급|dark/i.test(style) ? "다크 럭셔리, " :
    /클린|모던|심플/i.test(style) ? "쿨 클리니컬, " :
    "따뜻 감성, ";

  // 풀에서 count개 순환 선택 (타입 균형 유지)
  const types = ["portfolio","bts","philosophy","space","profile"];
  const byType: Record<string, ContentIdea[]> = {};
  types.forEach(t => { byType[t] = IDEA_POOL.filter(i => i.type === t); });

  const selected: ContentIdea[] = [];
  let typeIdx = 0;
  for (let i = 0; i < count; i++) {
    const type = types[typeIdx % types.length];
    const pool = byType[type];
    const idea = { ...pool[i % pool.length] };

    // 요일 재배정
    idea.day = DAYS[i % 7];

    // 진료과 해시태그 삽입
    if (deptTag) idea.hashtags = idea.hashtags + " " + deptTag;

    // designHint에 스타일 반영
    idea.designHint = styleHint + idea.designHint;

    selected.push(idea);
    typeIdx++;
  }
  return selected;
}

export async function POST(req: NextRequest) {
  try {
    const { dept, style, count = 7, week } = await req.json();

    const key = process.env.ANTHROPIC_API_KEY;

    // ── API 키 없으면 풍부한 mock 반환 ──────────────────────
    if (!key) {
      const ideas = buildIdeas(dept || "", style || "", Number(count));
      return NextResponse.json({ ok: true, mock: true, ideas });
    }

    // ── Claude API 호출 ──────────────────────────────────────
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

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || JSON.stringify(errBody);
      // API 실패시 mock으로 fallback
      console.error(`Claude API ${res.status}: ${errMsg}`);
      const ideas = buildIdeas(dept || "", style || "", Number(count));
      return NextResponse.json({ ok: true, mock: true, ideas });
    }

    const data = await res.json();
    const txt  = (data.content || []).map((b: any) => b.text || "").join("");
    const s = txt.indexOf("["), e = txt.lastIndexOf("]");
    if (s < 0 || e < 0) throw new Error("JSON 파싱 실패");
    const ideas: ContentIdea[] = JSON.parse(txt.slice(s, e + 1));
    return NextResponse.json({ ok: true, ideas });

  } catch (err: any) {
    // 에러시에도 mock으로 fallback
    const { dept, style, count = 7 } = await req.json().catch(() => ({}));
    const ideas = buildIdeas(dept || "", style || "", Number(count));
    return NextResponse.json({ ok: true, mock: true, ideas });
  }
}
