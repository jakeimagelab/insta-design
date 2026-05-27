import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 반환 타입 정의
export type DesignConfig = {
  template:    "photo-bottom"|"photo-top"|"photo-overlay"|"text-only"|"split-v"|"frame";
  ratio:       "1:1"|"4:5"|"9:16";
  photoFit:    "contain"|"cover";
  photoPct:    number;      // 10~90
  photoZoom:   number;      // 70~130
  canvasBg:    string;      // hex
  contentBg:   string;      // hex
  textColor:   string;      // hex
  subColor:    string;      // hex
  accentColor: string;      // hex
  fontPairIdx: number;      // 0~5
  fontSize:    number;      // 20~60
  subFontSize: number;      // 10~24
  lineH:       number;      // 1.2~2.0
  letterSp:    number;      // -1~3
  textAlign:   "left"|"center"|"right";
  mainText:    string;
  subText:     string;
  microText:   string;
  rationale:   string;      // 한국어 설명
};

const FONT_LABELS = [
  "0: Noto Serif KR (세리프·클래식)",
  "1: Noto Sans KR (고딕·모던)",
  "2: Nanum Myeongjo (명조·서정적)",
  "3: Do Hyeon (도현·감각적)",
  "4: Black Han Sans (블랙한산스·임팩트)",
  "5: Gaegu (개구·친근함)",
];

export async function POST(req: NextRequest) {
  try {
    const { prompt, haPhoto } = await req.json();
    // haPhoto: 사진 업로드 여부 (text-only 방지용)

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ ok: true, mock: true, ...getMock(prompt) });

    const systemPrompt = `당신은 포토클리닉(@photoclinic_kr) 인스타그램 디자인 AI입니다.
포토클리닉은 병원 브랜딩 전문 사진·영상 스튜디오입니다.
사용자의 설명을 보고 최적의 인스타그램 디자인 설정을 JSON으로 반환합니다.

【선택 가능한 값】
template: ${haPhoto ? '"photo-bottom"|"photo-top"|"photo-overlay"|"split-v"|"frame"' : '"text-only"'}
ratio: "1:1"(정방형 피드) | "4:5"(세로 피드, 기본) | "9:16"(스토리)
photoFit: "contain"(사진 전체 보이기) | "cover"(영역 꽉 채우기)
photoPct: 40~80 (사진 영역 비율%)
photoZoom: 80~120 (사진 줌%)
fontPairIdx: ${FONT_LABELS.join(" | ")}
textAlign: "left" | "center" | "right"
fontSize: 20~56
subFontSize: 11~22
lineH: 1.2~2.0
letterSp: -1~4

【포토클리닉 컬러 팔레트 참고】
브랜드: 오렌지 #E85D2C / 딥틸 #155855 / 세이지 #569082 / 크림 #F5F0EB / 에스프레소 #3D2B1F
프리미엄: #1A1A18 #E8E4DC #9E9C9A (럭셔리 모노크롬)
포레스트: #2E3B2C #6B8F5E #EAE7DC (유기적·자연)
클리니컬: #F8F7F5 #155855 #1A3A4A (쿨·클린)

【캡션 스타일】
- mainText: 2~4줄, 감성적·스토리텔링, 줄바꿈은 \\n 사용
- subText: 1줄, 진료과/촬영유형 설명
- microText: 1줄, @태그 or 짧은 문구

아래 JSON만 반환 (마크다운 없이, 다른 텍스트 없이):`;

    const userMsg = `디자인 요청: "${prompt}"
사진 업로드됨: ${haPhoto ? "예" : "아니오"}

위 정보를 바탕으로 최적의 디자인 설정을 JSON으로 만들어주세요.
JSON 형식:
{
  "template": "...",
  "ratio": "...",
  "photoFit": "...",
  "photoPct": 60,
  "photoZoom": 100,
  "canvasBg": "#...",
  "contentBg": "#...",
  "textColor": "#...",
  "subColor": "#...",
  "accentColor": "#...",
  "fontPairIdx": 0,
  "fontSize": 32,
  "subFontSize": 15,
  "lineH": 1.4,
  "letterSp": 0,
  "textAlign": "left",
  "mainText": "...",
  "subText": "...",
  "microText": "...",
  "rationale": "선택 이유를 한국어로 2~3문장"
}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API ${res.status}`);
    const data = await res.json();
    const txt  = (data.content || []).map((b: any) => b.text || "").join("");
    const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
    if (s < 0 || e < 0) throw new Error("JSON 파싱 실패");
    const parsed: DesignConfig = JSON.parse(txt.slice(s, e + 1));

    // 값 범위 클램핑 (안전장치)
    parsed.photoPct   = Math.min(90, Math.max(10, parsed.photoPct  ?? 60));
    parsed.photoZoom  = Math.min(150,Math.max(70, parsed.photoZoom ?? 100));
    parsed.fontPairIdx= Math.min(5,  Math.max(0,  parsed.fontPairIdx ?? 0));
    parsed.fontSize   = Math.min(72, Math.max(16, parsed.fontSize  ?? 32));
    parsed.subFontSize= Math.min(28, Math.max(10, parsed.subFontSize ?? 15));
    parsed.lineH      = Math.min(2.5,Math.max(1.0,parsed.lineH    ?? 1.4));
    parsed.letterSp   = Math.min(5,  Math.max(-2, parsed.letterSp ?? 0));

    return NextResponse.json({ ok: true, ...parsed });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// API 키 없을 때 대표 목 데이터
function getMock(prompt: string): DesignConfig {
  const isLuxury = /고급|럭셔|프리미엄|luxury|dark|다크/.test(prompt);
  const isCool   = /클린|쿨|심플|모던|clean|cool|modern/.test(prompt);
  const isWarm   = /따뜻|감성|포근|warm|soft/.test(prompt);

  if (isLuxury) return {
    template:"photo-bottom", ratio:"4:5", photoFit:"cover", photoPct:65, photoZoom:105,
    canvasBg:"#1A1A18", contentBg:"#1A1A18", textColor:"#E8E4DC", subColor:"#9E9C9A",
    accentColor:"#E85D2C", fontPairIdx:4, fontSize:38, subFontSize:13, lineH:1.35,
    letterSp:1.5, textAlign:"left",
    mainText:"빛이 닿는 곳에서\n진심이 드러납니다", subText:"Premium Hospital Branding",
    microText:"@photoclinic_kr", rationale:"다크 럭셔리 톤으로 고급스러움을 강조했습니다.",
  };
  if (isCool) return {
    template:"photo-top", ratio:"4:5", photoFit:"contain", photoPct:58, photoZoom:100,
    canvasBg:"#F8F7F5", contentBg:"#F8F7F5", textColor:"#155855", subColor:"#5A7470",
    accentColor:"#155855", fontPairIdx:1, fontSize:30, subFontSize:14, lineH:1.5,
    letterSp:0.5, textAlign:"center",
    mainText:"신뢰는 공간에서\n시작됩니다", subText:"Clinical Space Photography",
    microText:"@photoclinic_kr", rationale:"쿨하고 클린한 의료 브랜딩을 위해 딥틸+화이트 조합을 선택했습니다.",
  };
  return {
    template:"photo-bottom", ratio:"4:5", photoFit:"contain", photoPct:62, photoZoom:100,
    canvasBg:"#F5F0EB", contentBg:"#F5F0EB", textColor:"#E85D2C", subColor:"#5A7470",
    accentColor:"#E85D2C", fontPairIdx:0, fontSize:34, subFontSize:15, lineH:1.45,
    letterSp:0, textAlign:"left",
    mainText:"따뜻한 공간에서\n진심이 담긴 순간을", subText:"병원 포트폴리오 촬영",
    microText:"@photoclinic_kr", rationale:"따뜻하고 감성적인 포토클리닉 시그니처 톤으로 구성했습니다.",
  };
}
