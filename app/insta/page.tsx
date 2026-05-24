"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── 타입 ──────────────────────────────────────────────────
type Ratio    = "1:1" | "4:5" | "9:16";
type Template = "bottom" | "overlay" | "top" | "minimal";
type FontKey  = "Noto Sans KR" | "Nanum Myeongjo" | "Nanum Gothic" | "Do Hyeon";

interface Caption  { type: string; text: string; }
interface HistItem { id: string; hospital_name: string; ratio: string; template: string; caption: string; thumbnail: string; created_at: string; }

// ── 상수 ─────────────────────────────────────────────────
const RATIOS: { key: Ratio; label: string; w: number; h: number }[] = [
  { key: "1:1",  label: "1:1 피드",    w: 540, h: 540 },
  { key: "4:5",  label: "4:5 세로",    w: 432, h: 540 },
  { key: "9:16", label: "9:16 스토리", w: 304, h: 540 },
];

const TEMPLATES: { key: Template; name: string; desc: string }[] = [
  { key: "bottom",  name: "하단 텍스트",     desc: "사진 아래 영역에 글자" },
  { key: "overlay", name: "오버레이 박스",    desc: "반투명 틸 박스" },
  { key: "top",     name: "상단 텍스트",     desc: "사진 위 영역에 글자" },
  { key: "minimal", name: "미니멀",         desc: "로고만 표시" },
];

const FONTS: { key: FontKey; label: string }[] = [
  { key: "Noto Sans KR",    label: "Noto Sans (기본)" },
  { key: "Nanum Myeongjo",  label: "나눔명조" },
  { key: "Nanum Gothic",    label: "나눔고딕" },
  { key: "Do Hyeon",        label: "도현" },
];

const TEXT_COLORS = [
  { hex: "#FFFFFF", label: "흰색" },
  { hex: "#1C2B28", label: "다크" },
  { hex: "#E85D2C", label: "오렌지" },
  { hex: "#155855", label: "틸" },
  { hex: "#EB8F22", label: "옐로" },
  { hex: "#F5F0EB", label: "크림" },
];

const LOGO_SVG = `<svg width="80" height="22" viewBox="0 0 180 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="18" fill="#E85D2C"/>
  <circle cx="20" cy="20" r="18" fill="#155855" clip-path="url(#lrc)"/>
  <defs><clipPath id="lrc"><rect x="20" y="0" width="20" height="40"/></clipPath></defs>
  <circle cx="20" cy="20" r="12" fill="#EB8F22"/>
  <circle cx="20" cy="20" r="12" fill="#569082" clip-path="url(#lrc)"/>
  <circle cx="20" cy="20" r="6"  fill="white"/>
  <text x="46" y="27" font-family="sans-serif" font-size="18" font-weight="700" fill="#E85D2C">PHOTO</text>
  <text x="108" y="27" font-family="sans-serif" font-size="18" font-weight="700" fill="#155855">CLINIC</text>
</svg>`;

// ── 컴포넌트 ──────────────────────────────────────────────
export default function InstaDesignerPage() {
  // 설정 상태
  const [ratio,      setRatio]      = useState<Ratio>("1:1");
  const [template,   setTemplate]   = useState<Template>("bottom");
  const [textColor,  setTextColor]  = useState("#FFFFFF");
  const [font,       setFont]       = useState<FontKey>("Noto Sans KR");
  const [fontSize,   setFontSize]   = useState(32);
  const [showLogo,   setShowLogo]   = useState(true);
  const [hospName,   setHospName]   = useState("");

  // AI 생성 상태
  const [dept,        setDept]       = useState("");
  const [topic,       setTopic]      = useState("");
  const [tone,        setTone]       = useState("신뢰감·전문적");
  const [generating,  setGenerating] = useState(false);
  const [captions,    setCaptions]   = useState<Caption[]>([]);
  const [hashtags,    setHashtags]   = useState("");
  const [selCapIdx,   setSelCapIdx]  = useState(0);
  const [isMock,      setIsMock]     = useState(false);

  // 직접 입력
  const [mainText,   setMainText]   = useState("");
  const [subText,    setSubText]    = useState("");

  // 히스토리
  const [history,    setHistory]    = useState<HistItem[]>([]);
  const [showHist,   setShowHist]   = useState(false);
  const [saving,     setSaving]     = useState(false);

  // 기타
  const [toast,      setToast]      = useState("");
  const [imageLoaded,setImageLoaded]= useState(false);
  const [activeTab,  setActiveTab]  = useState<"ai"|"manual">("ai");

  // Refs
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const fabricRef   = useRef<any>(null);
  const imgObjRef   = useRef<any>(null);
  const fileRef     = useRef<HTMLInputElement>(null);

  // ── 토스트 ──
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  // ── Fabric.js 동적 로드 ──
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Gothic:wght@400;700&family=Do+Hyeon&display=swap";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
    script.onload = () => initFabric();
    document.head.appendChild(script);
    return () => { script.remove(); link.remove(); };
  }, []);

  const getDims = (r: Ratio = ratio) => RATIOS.find(x => x.key === r) || RATIOS[0];

  function initFabric(r?: Ratio) {
    const w = (window as any);
    if (!w.fabric || !canvasRef.current) return;
    if (fabricRef.current) fabricRef.current.dispose();
    const { w: cw, h: ch } = getDims(r);
    fabricRef.current = new w.fabric.Canvas(canvasRef.current, {
      width: cw, height: ch, backgroundColor: "#1C2B28",
    });
    fabricRef.current.on("mouse:dblclick", (opt: any) => {
      if (opt.target?.type === "i-text") opt.target.enterEditing();
    });
  }

  // ── 비율 변경 ──
  const handleRatio = (r: Ratio) => {
    setRatio(r);
    const { w, h } = getDims(r);
    if (fabricRef.current) {
      fabricRef.current.setWidth(w);
      fabricRef.current.setHeight(h);
      if (imgObjRef.current) scaleImageToCanvas(imgObjRef.current, w, h);
      fabricRef.current.renderAll();
    }
  };

  function scaleImageToCanvas(img: any, cw: number, ch: number) {
    const scale = Math.max(cw / img.width, ch / img.height);
    img.set({
      scaleX: scale, scaleY: scale,
      left: (cw - img.width * scale) / 2,
      top:  (ch - img.height * scale) / 2,
    });
  }

  // ── 이미지 업로드 ──
  const loadImage = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { showToast("10MB 이하 파일만 업로드 가능합니다"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const w = (window as any);
      if (!w.fabric || !fabricRef.current) return;
      w.fabric.Image.fromURL(e.target!.result as string, (img: any) => {
        const { w: cw, h: ch } = getDims();
        scaleImageToCanvas(img, cw, ch);
        img.set({ selectable: true });
        fabricRef.current.clear();
        fabricRef.current.setBackgroundColor("#000", () => {});
        fabricRef.current.add(img);
        img.sendToBack();
        imgObjRef.current = img;
        setImageLoaded(true);
        applyOverlay(template, cw, ch);
        if (showLogo) addLogo(cw, ch);
        fabricRef.current.renderAll();
        showToast("이미지 업로드 완료");
      });
    };
    reader.readAsDataURL(file);
  };

  // ── 오버레이 ──
  function applyOverlay(tmpl: Template, cw: number, ch: number) {
    if (!fabricRef.current) return;
    removeByName("overlay");
    const w = (window as any).fabric;
    if (!w) return;

    if (tmpl === "bottom") {
      const rect = new w.Rect({
        left:0, top: ch * 0.58, width: cw, height: ch * 0.42,
        fill: "rgba(0,0,0,0.52)", selectable: false, evented: false, name: "overlay",
      });
      fabricRef.current.add(rect);
    } else if (tmpl === "overlay") {
      const rect = new w.Rect({
        left: cw*0.07, top: ch*0.28, width: cw*0.86, height: ch*0.44,
        fill: "rgba(21,88,85,0.84)", rx:14, ry:14,
        selectable: false, evented: false, name: "overlay",
      });
      fabricRef.current.add(rect);
    } else if (tmpl === "top") {
      const rect = new w.Rect({
        left:0, top:0, width:cw, height:ch*0.36,
        fill:"rgba(0,0,0,0.48)", selectable:false, evented:false, name:"overlay",
      });
      fabricRef.current.add(rect);
    }
  }

  function removeByName(name: string) {
    if (!fabricRef.current) return;
    fabricRef.current.getObjects().filter((o: any) => o.name === name).forEach((o: any) => fabricRef.current.remove(o));
  }

  function removeTexts() {
    if (!fabricRef.current) return;
    fabricRef.current.getObjects()
      .filter((o: any) => (o.type === "i-text" || o.type === "text") && o.name !== "logo")
      .forEach((o: any) => fabricRef.current.remove(o));
  }

  // ── 로고 ──
  function addLogo(cw: number, ch: number) {
    removeByName("logo");
    const w = (window as any).fabric;
    if (!w) return;
    const logo = new w.Text("PHOTO CLINIC", {
      left: cw - 12, top: ch - 14,
      fontSize: 10, fill: "rgba(255,255,255,0.6)",
      fontFamily: "Noto Sans KR, sans-serif", fontWeight: "700",
      textAlign: "right", originX: "right", originY: "bottom",
      letterSpacing: 2, selectable: true, name: "logo",
    });
    fabricRef.current.add(logo);
  }

  const handleToggleLogo = () => {
    const next = !showLogo;
    setShowLogo(next);
    if (next) { const { w: cw, h: ch } = getDims(); addLogo(cw, ch); }
    else removeByName("logo");
    fabricRef.current?.renderAll();
  };

  // ── 텍스트 색상 ──
  const handleTextColor = (hex: string) => {
    setTextColor(hex);
    fabricRef.current?.getObjects().forEach((o: any) => {
      if (o.type === "i-text" || o.type === "text") o.set("fill", hex);
    });
    fabricRef.current?.renderAll();
  };

  // ── 텍스트 삽입 공통 ──
  function placeText(main: string, sub?: string, tmpl: Template = template) {
    if (!fabricRef.current) return;
    const { w: cw, h: ch } = getDims();
    const Fab = (window as any).fabric;
    if (!Fab) return;

    removeTexts();

    let topMain: number, topSub: number;
    if (tmpl === "bottom")  { topMain = ch * 0.65; topSub = ch * 0.82; }
    else if (tmpl === "overlay") { topMain = ch * 0.36; topSub = ch * 0.56; }
    else if (tmpl === "top")  { topMain = ch * 0.07; topSub = ch * 0.24; }
    else                       { topMain = ch * 0.72; topSub = ch * 0.85; }

    const shadow = tmpl !== "overlay" ? "rgba(0,0,0,0.45) 0 2px 6px" : undefined;

    if (main) {
      const obj = new Fab.IText(main, {
        left: cw/2, top: topMain, originX: "center",
        fontSize: fontSize, fill: textColor,
        fontFamily: `${font}, sans-serif`, fontWeight: "600",
        textAlign: "center", width: cw * 0.86,
        lineHeight: 1.45, shadow, name: "main-text",
      });
      fabricRef.current.add(obj);
    }
    if (sub) {
      const obj = new Fab.IText(sub, {
        left: cw/2, top: topSub, originX: "center",
        fontSize: Math.max(12, Math.round(fontSize * 0.58)), fill: textColor,
        fontFamily: `${font}, sans-serif`, fontWeight: "400",
        textAlign: "center", width: cw * 0.86,
        opacity: 0.85, shadow, name: "sub-text",
      });
      fabricRef.current.add(obj);
    }
    fabricRef.current.renderAll();
    showToast("텍스트 적용 완료 · 더블클릭으로 편집");
  }

  // ── 템플릿 변경 ──
  const handleTemplate = (tmpl: Template) => {
    setTemplate(tmpl);
    if (!fabricRef.current) return;
    const { w: cw, h: ch } = getDims();
    applyOverlay(tmpl, cw, ch);
    fabricRef.current.renderAll();
  };

  // ── AI 캡션 생성 ──
  const generateCaption = async () => {
    if (!topic.trim()) { showToast("콘텐츠 주제를 입력해주세요"); return; }
    setGenerating(true);
    try {
      const res  = await fetch("/api/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dept, topic, tone, hospitalName: hospName }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setCaptions(data.captions);
      setHashtags(data.hashtags);
      setSelCapIdx(0);
      setIsMock(!!data.mock);
      showToast(data.mock ? "샘플 데이터 (API 키 미설정)" : "캡션 생성 완료!");
    } catch (err: any) {
      showToast("생성 실패: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const applyAiCaption = () => {
    if (!captions.length) { showToast("먼저 캡션을 생성해주세요"); return; }
    placeText(captions[selCapIdx].text, hospName ? `${hospName}` : "PHOTO CLINIC");
  };

  const applyManual = () => {
    if (!mainText.trim()) { showToast("메인 텍스트를 입력해주세요"); return; }
    placeText(mainText, subText || undefined);
  };

  // ── 편집 도구 ──
  const addFreeText = () => {
    if (!fabricRef.current) return;
    const { w: cw, h: ch } = getDims();
    const Fab = (window as any).fabric;
    if (!Fab) return;
    const obj = new Fab.IText("텍스트 입력", {
      left: cw/2, top: ch/2, originX: "center", originY: "center",
      fontSize: fontSize, fill: textColor,
      fontFamily: `${font}, sans-serif`, fontWeight: "600",
    });
    fabricRef.current.add(obj);
    fabricRef.current.setActiveObject(obj);
    fabricRef.current.renderAll();
    obj.enterEditing();
  };

  const removeSelected = () => {
    if (!fabricRef.current) return;
    const active = fabricRef.current.getActiveObjects();
    if (!active.length) { showToast("삭제할 객체를 선택하세요"); return; }
    active.forEach((o: any) => fabricRef.current.remove(o));
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();
  };

  // ── 다운로드 ──
  const download = (fmt: "png"|"jpeg") => {
    if (!fabricRef.current) return;
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();
    const url = fabricRef.current.toDataURL({ format: fmt, quality: 0.95, multiplier: 2 });
    const a = document.createElement("a"); a.href = url;
    a.download = `photoclinic_${ratio.replace(":","x")}_${Date.now()}.${fmt === "jpeg" ? "jpg" : "png"}`;
    a.click();
    showToast(`${fmt.toUpperCase()} 다운로드 완료`);
  };

  // ── 히스토리 저장 ──
  const saveToHistory = async () => {
    if (!fabricRef.current) return;
    setSaving(true);
    try {
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
      const thumb = fabricRef.current.toDataURL({ format: "jpeg", quality: 0.5, multiplier: 0.4 });
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName: hospName,
          ratio, template,
          caption: captions[selCapIdx]?.text || mainText,
          hashtags,
          thumbnail: thumb,
        }),
      });
      showToast("히스토리에 저장됐습니다");
      loadHistory();
    } catch { showToast("저장 실패"); }
    finally { setSaving(false); }
  };

  const loadHistory = async () => {
    const res = await fetch("/api/history");
    const data = await res.json();
    setHistory(data);
  };

  useEffect(() => { loadHistory(); }, []);

  // ── JSX ───────────────────────────────────────────────
  const { w: cw, h: ch } = getDims();

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"calc(100vh - 60px)", background:"#F4F7F6", fontFamily:"Noto Sans KR, sans-serif" }}>

      {/* 툴바 */}
      <div style={{ background:"#fff", borderBottom:"1px solid #DCE8E5", padding:"10px 24px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <span style={{ fontSize:11, fontWeight:700, color:"#5A7470", textTransform:"uppercase", letterSpacing:".08em", marginRight:4 }}>편집</span>
        {[
          { label:"+ 텍스트", fn: addFreeText },
          { label:"선택 삭제", fn: removeSelected },
          { label: showLogo ? "로고 ✓" : "로고", fn: handleToggleLogo, active: showLogo },
          { label: saving ? "저장 중..." : "히스토리 저장", fn: saveToHistory },
          { label: showHist ? "히스토리 닫기" : "히스토리 보기", fn: () => { setShowHist(v=>!v); if(!showHist) loadHistory(); } },
        ].map(btn => (
          <button key={btn.label} onClick={btn.fn}
            style={{ height:32, padding:"0 14px", border:`1.5px solid ${btn.active ? "#155855":"#DCE8E5"}`, borderRadius:8, background: btn.active ? "#E5F0EE":"#fff", color: btn.active ? "#155855":"#1C2B28", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            {btn.label}
          </button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button onClick={() => download("png")} style={{ height:32, padding:"0 16px", background:"#155855", color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>PNG 다운로드</button>
          <button onClick={() => download("jpeg")} style={{ height:32, padding:"0 16px", background:"#F4F7F6", color:"#1C2B28", border:"1.5px solid #DCE8E5", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>JPG 다운로드</button>
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── 왼쪽 패널 ── */}
        <aside style={{ width:320, background:"#fff", borderRight:"1px solid #DCE8E5", overflowY:"auto", padding:"20px 18px", flexShrink:0 }}>

          {/* 병원명 */}
          <Section label="병원 정보">
            <input value={hospName} onChange={e=>setHospName(e.target.value)}
              placeholder="병원명 (예: 강남미소치과)"
              style={inputStyle} />
          </Section>

          {/* 사진 업로드 */}
          <Section label="사진 업로드">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) loadImage(f); }}
              style={{ border:"2px dashed #DCE8E5", borderRadius:10, padding:"20px 12px", textAlign:"center", cursor:"pointer", background:"#F4F7F6", transition:"all .2s" }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="#155855")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#DCE8E5")}>
              <div style={{ fontSize:13, color: imageLoaded ? "#155855":"#5A7470", fontWeight:600 }}>
                {imageLoaded ? "✓ 이미지 로드됨" : "클릭 또는 드래그해서 업로드"}
              </div>
              <div style={{ fontSize:11, color:"#9BB5B0", marginTop:4 }}>JPG · PNG · WEBP · 최대 10MB</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files?.[0]) loadImage(e.target.files[0]); }} />
          </Section>

          {/* 비율 */}
          <Section label="비율">
            <div style={{ display:"flex", gap:7 }}>
              {RATIOS.map(r => (
                <button key={r.key} onClick={() => handleRatio(r.key)}
                  style={{ flex:1, padding:"10px 4px", border:`1.5px solid ${ratio===r.key?"#155855":"#DCE8E5"}`, borderRadius:9, background: ratio===r.key ? "#E5F0EE":"#F4F7F6", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
                  <RatioBox r={r.key} active={ratio===r.key} />
                  <div style={{ fontSize:10, fontWeight:700, color: ratio===r.key ? "#155855":"#5A7470", marginTop:4 }}>{r.label}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* 레이아웃 */}
          <Section label="레이아웃">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
              {TEMPLATES.map(t => (
                <button key={t.key} onClick={() => handleTemplate(t.key)}
                  style={{ padding:"10px 8px", border:`1.5px solid ${template===t.key?"#E85D2C":"#DCE8E5"}`, borderRadius:9, background: template===t.key ? "#FFF8F5":"#F4F7F6", cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all .15s" }}>
                  <div style={{ fontSize:12, fontWeight:700, color: template===t.key?"#E85D2C":"#1C2B28" }}>{t.name}</div>
                  <div style={{ fontSize:10, color:"#5A7470", marginTop:2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* 폰트 + 크기 */}
          <Section label="폰트 설정">
            <select value={font} onChange={e=>setFont(e.target.value as FontKey)} style={inputStyle}>
              {FONTS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
              <span style={{ fontSize:11, color:"#5A7470", fontWeight:600, minWidth:60 }}>크기 {fontSize}px</span>
              <input type="range" min={14} max={72} value={fontSize}
                onChange={e=>{ setFontSize(Number(e.target.value)); }}
                style={{ flex:1 }} />
            </div>
          </Section>

          {/* 텍스트 색상 */}
          <Section label="텍스트 색상">
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {TEXT_COLORS.map(c => (
                <div key={c.hex} onClick={() => handleTextColor(c.hex)} title={c.label}
                  style={{ width:28, height:28, borderRadius:"50%", background:c.hex, border:`2px solid ${textColor===c.hex?"#1C2B28":"rgba(0,0,0,.12)"}`, cursor:"pointer", transform: textColor===c.hex?"scale(1.2)":"scale(1)", transition:"all .15s", boxShadow: c.hex==="#FFFFFF"?"inset 0 0 0 1px #DCE8E5":"none" }} />
              ))}
            </div>
          </Section>

          {/* AI / 직접 입력 탭 */}
          <Section label="텍스트">
            <div style={{ display:"flex", gap:0, marginBottom:14, background:"#F4F7F6", borderRadius:9, padding:3 }}>
              {(["ai","manual"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ flex:1, height:30, border:"none", borderRadius:7, background: activeTab===tab?"#fff":"transparent", color: activeTab===tab?"#1C2B28":"#5A7470", fontSize:12, fontWeight:700, cursor:"pointer", transition:"all .15s", fontFamily:"inherit" }}>
                  {tab === "ai" ? "AI 캡션 생성" : "직접 입력"}
                </button>
              ))}
            </div>

            {activeTab === "ai" ? (
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                <select value={dept} onChange={e=>setDept(e.target.value)} style={inputStyle}>
                  <option value="">진료과목 선택</option>
                  {["피부과","성형외과","치과","안과","정형외과","한의원","산부인과","내과","정신건강의학과"].map(d=><option key={d}>{d}</option>)}
                </select>
                <input value={topic} onChange={e=>setTopic(e.target.value)}
                  placeholder="주제 (예: 원장 프로필, 공간 소개)" style={inputStyle} />
                <select value={tone} onChange={e=>setTone(e.target.value)} style={inputStyle}>
                  {["신뢰감·전문적","따뜻함·친근함","모던·세련됨","트렌디·감각적"].map(t=><option key={t}>{t}</option>)}
                </select>
                <button onClick={generateCaption} disabled={generating}
                  style={{ height:42, background: generating?"#9BB5B0":"#E85D2C", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor: generating?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {generating ? <><Spinner /><span>생성 중...</span></> : "캡션 + 해시태그 생성"}
                </button>
                {isMock && <div style={{ fontSize:11, color:"#C8860A", background:"#FDF5E0", borderRadius:7, padding:"6px 10px" }}>샘플 데이터 · ANTHROPIC_API_KEY 설정 시 실제 생성</div>}

                {captions.length > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {captions.map((cap, i) => (
                      <div key={i} onClick={() => setSelCapIdx(i)}
                        style={{ border:`1.5px solid ${selCapIdx===i?"#155855":"#DCE8E5"}`, borderRadius:9, padding:"10px 12px", cursor:"pointer", background: selCapIdx===i?"#E5F0EE":"#F4F7F6", transition:"all .15s" }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"#E85D2C", textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>{cap.type}</div>
                        <div style={{ fontSize:12, lineHeight:1.6, color:"#1C2B28", whiteSpace:"pre-line" }}>{cap.text}</div>
                      </div>
                    ))}
                    <div style={{ fontSize:11, color:"#569082", lineHeight:1.7, padding:"8px 0", wordBreak:"break-all" }}>{hashtags}</div>
                    <button onClick={applyAiCaption}
                      style={{ height:38, background:"#155855", color:"#fff", border:"none", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                      선택한 캡션 캔버스에 적용
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                <textarea value={mainText} onChange={e=>setMainText(e.target.value)}
                  placeholder="메인 텍스트를 입력하세요"
                  style={{ ...inputStyle, minHeight:70, resize:"vertical" }} />
                <input value={subText} onChange={e=>setSubText(e.target.value)}
                  placeholder="서브 텍스트 (선택)" style={inputStyle} />
                <button onClick={applyManual}
                  style={{ height:38, background:"#155855", color:"#fff", border:"none", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  캔버스에 적용
                </button>
              </div>
            )}
          </Section>
        </aside>

        {/* ── 캔버스 영역 ── */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"28px 24px", overflowY:"auto" }}>
          <div style={{ boxShadow:"0 8px 40px rgba(0,0,0,.15)", borderRadius:4, overflow:"hidden", position:"relative" }}>
            <canvas ref={canvasRef} />
          </div>
          <div style={{ fontSize:12, color:"#9BB5B0", marginTop:12 }}>
            {cw} × {ch}px · {ratio} · {template} 템플릿 · 다운로드 시 2배 해상도
          </div>
        </main>

        {/* ── 히스토리 패널 ── */}
        {showHist && (
          <aside style={{ width:240, background:"#fff", borderLeft:"1px solid #DCE8E5", overflowY:"auto", padding:"16px 14px", flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#5A7470", textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>저장 히스토리</div>
            {history.length === 0 && <div style={{ fontSize:12, color:"#9BB5B0", textAlign:"center", padding:"20px 0" }}>저장된 내역이 없습니다</div>}
            {history.map(item => (
              <div key={item.id} style={{ marginBottom:12, border:"1px solid #DCE8E5", borderRadius:10, overflow:"hidden" }}>
                {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width:"100%", display:"block" }} />}
                <div style={{ padding:"8px 10px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#1C2B28" }}>{item.hospital_name || "병원명 없음"}</div>
                  <div style={{ fontSize:10, color:"#9BB5B0", marginTop:2 }}>{item.ratio} · {item.template}</div>
                  <div style={{ fontSize:10, color:"#5A7470", marginTop:4, lineHeight:1.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.caption}</div>
                  <div style={{ fontSize:10, color:"#9BB5B0", marginTop:4 }}>{new Date(item.created_at).toLocaleDateString("ko-KR")}</div>
                </div>
              </div>
            ))}
          </aside>
        )}
      </div>

      {/* 토스트 */}
      <div style={{ position:"fixed", bottom:24, left:"50%", transform:`translateX(-50%) translateY(${toast?"0":"70px"})`, background:"#155855", color:"#fff", fontSize:13, padding:"10px 22px", borderRadius:24, transition:"transform .3s", pointerEvents:"none", zIndex:999, fontWeight:600 }}>
        {toast}
      </div>
    </div>
  );
}

// ── 서브 컴포넌트 ────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:20, paddingBottom:18, borderBottom:"1px solid #DCE8E5" }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#5A7470", textTransform:"uppercase", letterSpacing:".08em", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:"#E85D2C", display:"inline-block" }} />
        {label}
      </div>
      {children}
    </div>
  );
}

function RatioBox({ r, active }: { r: Ratio; active: boolean }) {
  const dims: Record<Ratio, [number,number]> = { "1:1":[22,22], "4:5":[18,22], "9:16":[13,22] };
  const [w, h] = dims[r];
  return (
    <div style={{ width:w, height:h, border:`2px solid ${active?"#155855":"#9BB5B0"}`, borderRadius:3, margin:"0 auto" }} />
  );
}

function Spinner() {
  return <div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .6s linear infinite" }} />;
}

const inputStyle: React.CSSProperties = {
  width:"100%", border:"1.5px solid #DCE8E5", borderRadius:9,
  padding:"9px 12px", fontSize:13, fontFamily:"Noto Sans KR, sans-serif",
  background:"#F4F7F6", color:"#1C2B28", outline:"none",
};
