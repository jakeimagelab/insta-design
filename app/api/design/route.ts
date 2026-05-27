import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type DesignConfig = {
  template:    "photo-bottom"|"photo-top"|"photo-overlay"|"text-only"|"split-v"|"frame";
  ratio:       "1:1"|"4:5"|"9:16";
  photoFit:    "contain"|"cover";
  photoPct:    number;
  photoZoom:   number;
  canvasBg:    string;
  contentBg:   string;
  textColor:   string;
  subColor:    string;
  accentColor: string;
  fontPairIdx: number;
  fontSize:    number;
  subFontSize: number;
  lineH:       number;
  letterSp:    number;
  textAlign:   "left"|"center"|"right";
  mainText:    string;
  subText:     string;
  microText:   string;
  rationale:   string;
};

const FONT_LABELS = [
  "0: Noto Serif KR (세리프·클래식)",
  "1: Noto Sans KR (고딕·모던)",
  "2: Nanum Myeongjo (명조·서정적)",
  "3: Do Hyeon (도현·감각적)",
  "4: Black Han Sans (블랙한산스·임팩트)",
  "5: Gaegu (개구·친근함)",
];

// ── 풍부한 Mock 디자인 프리셋 ─────────────────────────────────
const MOCK_PRESETS: Array<{ keywords: RegExp; config: DesignConfig }> = [
  {
    keywords: /고급|럭셔|프리미엄|luxury|dark|다크|블랙|black/i,
    config: {
      template:"photo-bottom", ratio:"4:5", photoFit:"cover", photoPct:65, photoZoom:105,
      canvasBg:"#1A1A18", contentBg:"#1A1A18", textColor:"#E8E4DC", subColor:"#9E9C9A",
      accentColor:"#E85D2C", fontPairIdx:4, fontSize:38, subFontSize:13, lineH:1.35,
      letterSp:1.5, textAlign:"left",
      mainText:"빛이 닿는 곳에서\n진심이 드러납니다", subText:"Premium Hospital Branding",
      microText:"@photoclinic_kr", rationale:"다크 럭셔리 톤으로 고급스러움을 강조했습니다. 블랙+골드 계열로 프리미엄 의료 브랜드 이미지를 표현했습니다.",
    },
  },
  {
    keywords: /클린|쿨|심플|모던|clean|cool|modern|미니멀|minimal/i,
    config: {
      template:"photo-top", ratio:"4:5", photoFit:"contain", photoPct:58, photoZoom:100,
      canvasBg:"#F8F7F5", contentBg:"#F8F7F5", textColor:"#155855", subColor:"#5A7470",
      accentColor:"#155855", fontPairIdx:1, fontSize:30, subFontSize:14, lineH:1.5,
      letterSp:0.5, textAlign:"center",
      mainText:"신뢰는 공간에서\n시작됩니다", subText:"Clinical Space Photography",
      microText:"@photoclinic_kr", rationale:"쿨하고 클린한 의료 브랜딩을 위해 딥틸+화이트 조합을 선택했습니다. 미니멀한 구성으로 전문성을 강조했습니다.",
    },
  },
  {
    keywords: /따뜻|감성|포근|warm|soft|필름|film|빈티지|vintage/i,
    config: {
      template:"photo-bottom", ratio:"4:5", photoFit:"contain", photoPct:62, photoZoom:100,
      canvasBg:"#F5F0EB", contentBg:"#F5F0EB", textColor:"#3D2B1F", subColor:"#5A7470",
      accentColor:"#E85D2C", fontPairIdx:0, fontSize:34, subFontSize:15, lineH:1.45,
      letterSp:0, textAlign:"left",
      mainText:"따뜻한 공간에서\n진심이 담긴 순간을", subText:"병원 포트폴리오 촬영",
      microText:"@photoclinic_kr", rationale:"따뜻하고 감성적인 포토클리닉 시그니처 톤으로 구성했습니다. 크림+에스프레소 조합으로 필름 감성을 살렸습니다.",
    },
  },
  {
    keywords: /포트폴리오|portfolio|결과물|작업/i,
    config: {
      template:"photo-overlay", ratio:"4:5", photoFit:"cover", photoPct:80, photoZoom:105,
      canvasBg:"#1C2B28", contentBg:"rgba(28,43,40,0.7)", textColor:"#F5F0EB", subColor:"#A8C4BE",
      accentColor:"#E85D2C", fontPairIdx:2, fontSize:36, subFontSize:14, lineH:1.4,
      letterSp:0.5, textAlign:"left",
      mainText:"사진으로 전하는\n병원의 이야기", subText:"Hospital Portfolio",
      microText:"@photoclinic_kr", rationale:"포트폴리오는 사진이 주인공이어야 합니다. 오버레이 레이아웃으로 사진을 최대한 살리면서 텍스트를 자연스럽게 얹었습니다.",
    },
  },
  {
    keywords: /프로필|profile|원장|의사|닥터|doctor/i,
    config: {
      template:"split-v", ratio:"4:5", photoFit:"cover", photoPct:55, photoZoom:110,
      canvasBg:"#EDE0CC", contentBg:"#EDE0CC", textColor:"#3D2B1F", subColor:"#9C6644",
      accentColor:"#9C6644", fontPairIdx:0, fontSize:32, subFontSize:15, lineH:1.5,
      letterSp:0.3, textAlign:"left",
      mainText:"진심을 담아\n촬영합니다", subText:"의료진 프로필 전문",
      microText:"@photoclinic_kr", rationale:"의료진 프로필은 사람의 온기가 느껴져야 합니다. 웜 뉴트럴 톤으로 친근하면서도 전문적인 이미지를 연출했습니다.",
    },
  },
  {
    keywords: /공간|인테리어|interior|space|로비|대기실/i,
    config: {
      template:"photo-top", ratio:"4:5", photoFit:"cover", photoPct:68, photoZoom:100,
      canvasBg:"#2E3B2C", contentBg:"#2E3B2C", textColor:"#EAE7DC", subColor:"#6B8F5E",
      accentColor:"#D4C88A", fontPairIdx:2, fontSize:30, subFontSize:14, lineH:1.6,
      letterSp:1, textAlign:"center",
      mainText:"공간이 말하는\n것들이 있습니다", subText:"Hospital Interior Photography",
      microText:"@photoclinic_kr", rationale:"공간 사진은 자연의 색감과 어울립니다. 포레스트 그린 계열로 병원 공간의 유기적이고 편안한 분위기를 표현했습니다.",
    },
  },
  {
    keywords: /비하인드|bts|현장|촬영과정|작업과정/i,
    config: {
      template:"photo-overlay", ratio:"9:16", photoFit:"cover", photoPct:85, photoZoom:100,
      canvasBg:"#1A3A4A", contentBg:"rgba(26,58,74,0.65)", textColor:"#F8F7F5", subColor:"#A8BFC0",
      accentColor:"#E85D2C", fontPairIdx:3, fontSize:34, subFontSize:13, lineH:1.4,
      letterSp:1.5, textAlign:"left",
      mainText:"카메라를 들기 전\n먼저 하는 일", subText:"Behind The Scenes",
      microText:"@photoclinic_kr", rationale:"스토리 포맷(9:16)으로 현장감을 극대화했습니다. 다크 네이비 오버레이로 시네마틱한 비하인드 무드를 연출했습니다.",
    },
  },
  {
    keywords: /철학|생각|브랜딩|텍스트|글귀|명언|quote/i,
    config: {
      template:"text-only", ratio:"1:1", photoFit:"contain", photoPct:50, photoZoom:100,
      canvasBg:"#F5F0EB", contentBg:"#F5F0EB", textColor:"#3D2B1F", subColor:"#9C6644",
      accentColor:"#E85D2C", fontPairIdx:2, fontSize:28, subFontSize:14, lineH:1.8,
      letterSp:0.5, textAlign:"center",
      mainText:"예쁜 사진보다\n중요한 것이 있습니다\n\n신뢰입니다", subText:"포토클리닉의 철학",
      microText:"@photoclinic_kr", rationale:"브랜드 철학은 텍스트만으로도 충분히 강합니다. 정사각 포맷에 명조체로 절제된 감성을 표현했습니다.",
    },
  },
  {
    keywords: /스토리|story|세로|vertical|9:16/i,
    config: {
      template:"photo-overlay", ratio:"9:16", photoFit:"cover", photoPct:90, photoZoom:102,
      canvasBg:"#1A1A18", contentBg:"rgba(26,26,24,0.5)", textColor:"#FFFFFF", subColor:"#E8E4DC",
      accentColor:"#E85D2C", fontPairIdx:1, fontSize:36, subFontSize:15, lineH:1.4,
      letterSp:0, textAlign:"left",
      mainText:"그 순간을\n기억합니다", subText:"@photoclinic_kr",
      microText:"#병원사진 #포토클리닉", rationale:"스토리 세로 포맷으로 제작했습니다. 사진이 가득 차도록 구성하고 하단에 텍스트를 배치해 자연스러운 스와이프 유도가 가능합니다.",
    },
  },
];

function getMock(prompt: string): DesignConfig {
  for (const preset of MOCK_PRESETS) {
    if (preset.keywords.test(prompt)) return preset.config;
  }
  // 기본: 따뜻 감성
  return MOCK_PRESETS[2].config;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, haPhoto } = await req.json();

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

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || JSON.stringify(errBody);
      console.error(`Claude API ${res.status}: ${errMsg}`);
      // API 실패시 mock으로 fallback
      return NextResponse.json({ ok: true, mock: true, ...getMock(prompt) });
    }

    const data = await res.json();
    const txt  = (data.content || []).map((b: any) => b.text || "").join("");
    const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
    if (s < 0 || e < 0) throw new Error("JSON 파싱 실패");
    const parsed: DesignConfig = JSON.parse(txt.slice(s, e + 1));

    parsed.photoPct   = Math.min(90, Math.max(10, parsed.photoPct  ?? 60));
    parsed.photoZoom  = Math.min(150,Math.max(70, parsed.photoZoom ?? 100));
    parsed.fontPairIdx= Math.min(5,  Math.max(0,  parsed.fontPairIdx ?? 0));
    parsed.fontSize   = Math.min(72, Math.max(16, parsed.fontSize  ?? 32));
    parsed.subFontSize= Math.min(28, Math.max(10, parsed.subFontSize ?? 15));
    parsed.lineH      = Math.min(2.5,Math.max(1.0,parsed.lineH    ?? 1.4));
    parsed.letterSp   = Math.min(5,  Math.max(-2, parsed.letterSp ?? 0));

    return NextResponse.json({ ok: true, ...parsed });

  } catch (err: any) {
    // 에러시 mock fallback
    const body = await req.json().catch(() => ({ prompt: "" }));
    return NextResponse.json({ ok: true, mock: true, ...getMock(body.prompt || "") });
  }
}
