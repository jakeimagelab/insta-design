"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── 타입 ──────────────────────────────────────────────
type Ratio    = "1:1" | "4:5" | "9:16";
type Template = "bottom" | "overlay" | "top" | "minimal";
type FontKey  = "Noto Sans KR" | "Nanum Myeongjo" | "Nanum Gothic" | "Do Hyeon";

interface CaptionItem { type: string; text: string; }
interface HistItem {
  id: string; hospital_name: string; ratio: string;
  template: string; caption: string; thumbnail: string; created_at: string;
}

// ── 상수 ─────────────────────────────────────────────
const RATIOS = [
  { key: "1:1"  as Ratio, label: "1:1 피드",    w: 540, h: 540 },
  { key: "4:5"  as Ratio, label: "4:5 세로",    w: 432, h: 540 },
  { key: "9:16" as Ratio, label: "9:16 스토리", w: 304, h: 540 },
];
const TEMPLATES = [
  { key: "bottom"  as Template, name: "하단 텍스트",   desc: "사진 아래 영역" },
  { key: "overlay" as Template, name: "오버레이 박스", desc: "반투명 틸 박스" },
  { key: "top"     as Template, name: "상단 텍스트",   desc: "사진 위 영역" },
  { key: "minimal" as Template, name: "미니멀",        desc: "로고만 표시" },
];
const FONTS: { key: FontKey; label: string }[] = [
  { key: "Noto Sans KR",   label: "Noto Sans (기본)" },
  { key: "Nanum Myeongjo", label: "나눔명조" },
  { key: "Nanum Gothic",   label: "나눔고딕" },
  { key: "Do Hyeon",       label: "도현" },
];
const TEXT_COLORS = [
  "#FFFFFF","#1C2B28","#E85D2C","#155855","#EB8F22","#F5F0EB",
];
const DEPTS = ["피부과","성형외과","치과","안과","정형외과","한의원","산부인과","내과","정신건강의학과"];

// ── 컴포넌트 ──────────────────────────────────────────
export default function InstaDesignerPage() {
  // 설정
  const [ratio,     setRatio]     = useState<Ratio>("1:1");
  const [template,  setTemplate]  = useState<Template>("bottom");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [font,      setFont]      = useState<FontKey>("Noto Sans KR");
  const [fontSize,  setFontSize]  = useState(32);
  const [showLogo,  setShowLogo]  = useState(true);
  const [hospName,  setHospName]  = useState("");

  // AI
  const [dept,       setDept]      = useState("");
  const [topic,      setTopic]     = useState("");
  const [tone,       setTone]      = useState("신뢰감·전문적");
  const [generating, setGenerating]= useState(false);
  const [captions,   setCaptions]  = useState<CaptionItem[]>([]);
  const [hashtags,   setHashtags]  = useState("");
  const [selIdx,     setSelIdx]    = useState(0);
  const [isMock,     setIsMock]    = useState(false);

  // 직접 입력
  const [mainText, setMainText] = useState("");
  const [subText,  setSubText]  = useState("");
  const [activeTab,setActiveTab]= useState<"ai"|"manual">("ai");

  // 히스토리
  const [history,   setHistory]  = useState<HistItem[]>([]);
  const [showHist,  setShowHist] = useState(false);
  const [saving,    setSaving]   = useState(false);

  // 기타
  const [toast,       setToast]      = useState("");
  const [imageLoaded, setImageLoaded]= useState(false);
  const [fabricReady, setFabricReady]= useState(false); // Fabric.js 로드 상태

  // Refs
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const fabricRef  = useRef<any>(null);
  const imgRef     = useRef<any>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  // ── Fabric.js 클라이언트 사이드에서만 로드 ──────────
  // typeof window !== 'undefined' 체크로 SSR 에러 방지
  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
    script.onload = () => {
      setFabricReady(true);
    };
    script.onerror = () => showToast("Fabric.js 로드 실패 — 새로고침 해주세요");
    document.head.appendChild(script);

    return () => {
      if (fabricRef.current) {
        try { fabricRef.current.dispose(); } catch {}
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fabric.js 로드 완료 후 캔버스 초기화
  useEffect(() => {
    if (!fabricReady || !canvasRef.current) return;
    initFabric(ratio);
  }, [fabricReady]); // eslint-disable-line react-hooks/exhaustive-deps

  function getFab() {
    return typeof window !== "undefined" ? (window as any).fabric : null;
  }

  function getDims(r: Ratio = ratio) {
    return RATIOS.find(x => x.key === r) || RATIOS[0];
  }

  function initFabric(r: Ratio = ratio) {
    const Fab = getFab();
    if (!Fab || !canvasRef.current) return;
    try {
      if (fabricRef.current) fabricRef.current.dispose();
    } catch {}
    const { w, h } = getDims(r);
    fabricRef.current = new Fab.Canvas(canvasRef.current, {
      width: w, height: h, backgroundColor: "#1C2B28",
    });
    fabricRef.current.on("mouse:dblclick", (opt: any) => {
      if (opt.target?.type === "i-text") opt.target.enterEditing();
    });
  }

  // ── 비율 변경 ──
  const handleRatio = (r: Ratio) => {
    setRatio(r);
    if (!fabricRef.current) return;
    const { w, h } = getDims(r);
    fabricRef.current.setWidth(w);
    fabricRef.current.setHeight(h);
    if (imgRef.current) scaleImg(imgRef.current, w, h);
    fabricRef.current.renderAll();
  };

  function scaleImg(img: any, cw: number, ch: number) {
    const scale = Math.max(cw / img.width, ch / img.height);
    img.set({ scaleX: scale, scaleY: scale, left: (cw - img.width * scale) / 2, top: (ch - img.height * scale) / 2 });
  }

  // ── 이미지 업로드 ──
  const loadImage = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) { showToast("10MB 이하 파일만 가능합니다"); return; }
    if (!fabricReady) { showToast("에디터 초기화 중입니다. 잠시 후 다시 시도해주세요."); return; }
    const Fab = getFab();
    if (!Fab || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      Fab.Image.fromURL(e.target!.result as string, (img: any) => {
        const { w, h } = getDims();
        scaleImg(img, w, h);
        img.set({ selectable: true });
        fabricRef.current.clear();
        fabricRef.current.setBackgroundColor("#000", () => {});
        fabricRef.current.add(img);
        img.sendToBack();
        imgRef.current = img;
        setImageLoaded(true);
        applyOverlay(template, w, h);
        if (showLogo) addLogo(w, h);
        fabricRef.current.renderAll();
        showToast("이미지 업로드 완료");
      });
    };
    reader.readAsDataURL(file);
  }, [fabricReady, template, showLogo, ratio]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 오버레이 ──
  function applyOverlay(tmpl: Template, cw: number, ch: number) {
    const Fab = getFab();
    if (!Fab || !fabricRef.current) return;
    removeByName("overlay");
    if (tmpl === "bottom") {
      fabricRef.current.add(new Fab.Rect({ left:0, top:ch*0.58, width:cw, height:ch*0.42, fill:"rgba(0,0,0,0.52)", selectable:false, evented:false, name:"overlay" }));
    } else if (tmpl === "overlay") {
      fabricRef.current.add(new Fab.Rect({ left:cw*0.07, top:ch*0.28, width:cw*0.86, height:ch*0.44, fill:"rgba(21,88,85,0.84)", rx:14, ry:14, selectable:false, evented:false, name:"overlay" }));
    } else if (tmpl === "top") {
      fabricRef.current.add(new Fab.Rect({ left:0, top:0, width:cw, height:ch*0.36, fill:"rgba(0,0,0,0.48)", selectable:false, evented:false, name:"overlay" }));
    }
  }

  function removeByName(name: string) {
    if (!fabricRef.current) return;
    fabricRef.current.getObjects().filter((o: any) => o.name === name).forEach((o: any) => fabricRef.current.remove(o));
  }

  function removeTexts() {
    if (!fabricRef.current) return;
    fabricRef.current.getObjects().filter((o: any) => (o.type === "i-text" || o.type === "text") && o.name !== "logo").forEach((o: any) => fabricRef.current.remove(o));
  }

  // ── 로고 ──
  function addLogo(cw: number, ch: number) {
    const Fab = getFab();
    if (!Fab || !fabricRef.current) return;
    removeByName("logo");
    fabricRef.current.add(new Fab.Text("PHOTO CLINIC", {
      left:cw-12, top:ch-14, fontSize:10, fill:"rgba(255,255,255,0.6)",
      fontFamily:"Noto Sans KR, sans-serif", fontWeight:"700",
      textAlign:"right", originX:"right", originY:"bottom",
      letterSpacing:2, selectable:true, name:"logo",
    }));
  }

  const handleToggleLogo = () => {
    const next = !showLogo;
    setShowLogo(next);
    if (next) { const { w, h } = getDims(); addLogo(w, h); }
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

  // ── 텍스트 삽입 ──
  function placeText(main: string, sub?: string) {
    const Fab = getFab();
    if (!Fab || !fabricRef.current) { showToast("에디터가 준비되지 않았습니다"); return; }
    const { w: cw, h: ch } = getDims();
    removeTexts();
    const shadow = template !== "overlay" ? "rgba(0,0,0,0.45) 0 2px 6px" : undefined;
    let topMain = ch * 0.65, topSub = ch * 0.82;
    if (template === "overlay") { topMain = ch * 0.36; topSub = ch * 0.56; }
    else if (template === "top") { topMain = ch * 0.07; topSub = ch * 0.24; }
    else if (template === "minimal") { topMain = ch * 0.72; topSub = ch * 0.85; }

    if (main) fabricRef.current.add(new Fab.IText(main, {
      left:cw/2, top:topMain, originX:"center", fontSize, fill:textColor,
      fontFamily:`${font}, sans-serif`, fontWeight:"600",
      textAlign:"center", width:cw*0.86, lineHeight:1.45, shadow, name:"main-text",
    }));
    if (sub) fabricRef.current.add(new Fab.IText(sub, {
      left:cw/2, top:topSub, originX:"center",
      fontSize:Math.max(12, Math.round(fontSize*0.58)), fill:textColor,
      fontFamily:`${font}, sans-serif`, fontWeight:"400",
      textAlign:"center", width:cw*0.86, opacity:0.85, shadow, name:"sub-text",
    }));
    fabricRef.current.renderAll();
    showToast("적용 완료 · 더블클릭으로 편집");
  }

  // ── 템플릿 변경 ──
  const handleTemplate = (tmpl: Template) => {
    setTemplate(tmpl);
    const { w, h } = getDims();
    applyOverlay(tmpl, w, h);
    fabricRef.current?.renderAll();
  };

  // ── AI 캡션 ──
  const generateCaption = async () => {
    if (!topic.trim()) { showToast("콘텐츠 주제를 입력해주세요"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/caption", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ dept, topic, tone, hospitalName: hospName }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "생성 실패");
      setCaptions(data.captions || []);
      setHashtags(data.hashtags || "");
      setSelIdx(0);
      setIsMock(!!data.mock);
      showToast(data.mock ? "샘플 데이터 (API 키 미설정)" : "캡션 생성 완료!");
    } catch (err: any) {
      showToast("생성 실패: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // ── 편집 도구 ──
  const addFreeText = () => {
    const Fab = getFab();
    if (!Fab || !fabricRef.current) return;
    const { w: cw, h: ch } = getDims();
    const obj = new Fab.IText("텍스트 입력", {
      left:cw/2, top:ch/2, originX:"center", originY:"center",
      fontSize, fill:textColor, fontFamily:`${font}, sans-serif`, fontWeight:"600",
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
    if (!fabricRef.current) { showToast("에디터가 준비되지 않았습니다"); return; }
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();
    const url = fabricRef.current.toDataURL({ format: fmt, quality: 0.95, multiplier: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `photoclinic_${ratio.replace(":","x")}_${Date.now()}.${fmt === "jpeg" ? "jpg" : "png"}`;
    a.click();
    showToast(`${fmt === "png" ? "PNG" : "JPG"} 다운로드 완료`);
  };

  // ── 히스토리 저장 ──
  const saveToHistory = async () => {
    if (!fabricRef.current) return;
    setSaving(true);
    try {
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
      const thumb = fabricRef.current.toDataURL({ format:"jpeg", quality:0.5, multiplier:0.4 });
      const res = await fetch("/api/history", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          hospitalName: hospName, ratio, template,
          caption: captions[selIdx]?.text || mainText,
          hashtags, thumbnail: thumb,
        }),
      });
      const data = await res.json();
      if (data.ok) { showToast("히스토리 저장 완료"); loadHistory(); }
      else showToast(data.error || "저장 실패 (Supabase 미설정)");
    } catch { showToast("저장 실패"); }
    finally { setSaving(false); }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
    } catch {}
  };

  useEffect(() => { loadHistory(); }, []);

  const { w: cw, h: ch } = getDims();

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"calc(100vh - 60px)", background:"#F4F7F6" }}>

      {/* 툴바 */}
      <div style={{ background:"#fff", borderBottom:"1px solid #DCE8E5", padding:"10px 20px", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        {!fabricReady && (
          <span style={{ fontSize:12, color:"#C8860A", background:"#FDF5E0", padding:"4px 10px", borderRadius:7 }}>
            에디터 초기화 중...
          </span>
        )}
        {[
          { label:"+ 텍스트", fn: addFreeText },
          { label:"삭제",     fn: removeSelected },
          { label: showLogo ? "로고 ✓" : "로고", fn: handleToggleLogo, active: showLogo },
          { label: saving ? "저장 중..." : "히스토리 저장", fn: saveToHistory },
          { label: showHist ? "히스토리 ✕" : "히스토리", fn: () => { setShowHist(v=>!v); if(!showHist) loadHistory(); } },
        ].map(btn => (
          <button key={btn.label} onClick={btn.fn} disabled={!fabricReady && btn.label !== "히스토리"}
            style={{ height:32, padding:"0 12px", border:`1.5px solid ${btn.active?"#155855":"#DCE8E5"}`, borderRadius:8, background:btn.active?"#E5F0EE":"#fff", color:btn.active?"#155855":"#1C2B28", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", opacity: !fabricReady && btn.label!=="히스토리" ? 0.5 : 1 }}>
            {btn.label}
          </button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button onClick={() => download("png")} disabled={!fabricReady}
            style={{ height:32, padding:"0 16px", background:"#155855", color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", opacity: fabricReady?1:0.5 }}>PNG</button>
          <button onClick={() => download("jpeg")} disabled={!fabricReady}
            style={{ height:32, padding:"0 16px", background:"#F4F7F6", color:"#1C2B28", border:"1.5px solid #DCE8E5", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", opacity: fabricReady?1:0.5 }}>JPG</button>
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── 왼쪽 패널 ── */}
        <aside style={{ width:300, background:"#fff", borderRight:"1px solid #DCE8E5", overflowY:"auto", padding:"16px 14px", flexShrink:0 }}>

          <PanelSection label="병원 정보">
            <input value={hospName} onChange={e=>setHospName(e.target.value)} placeholder="병원명" style={iStyle} />
          </PanelSection>

          <PanelSection label="사진 업로드">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) loadImage(f); }}
              style={{ border:`2px dashed ${imageLoaded?"#155855":"#DCE8E5"}`, borderRadius:10, padding:"16px 10px", textAlign:"center", cursor:"pointer", background:"#F4F7F6" }}>
              <div style={{ fontSize:13, color:imageLoaded?"#155855":"#5A7470", fontWeight:600 }}>
                {imageLoaded ? "✓ 이미지 로드됨 · 클릭해서 교체" : "클릭 또는 드래그"}
              </div>
              <div style={{ fontSize:11, color:"#9BB5B0", marginTop:3 }}>JPG · PNG · WEBP · 최대 10MB</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files?.[0]) { loadImage(e.target.files[0]); e.target.value=""; } }} />
          </PanelSection>

          <PanelSection label="비율">
            <div style={{ display:"flex", gap:6 }}>
              {RATIOS.map(r => (
                <button key={r.key} onClick={() => handleRatio(r.key)}
                  style={{ flex:1, padding:"8px 4px", border:`1.5px solid ${ratio===r.key?"#155855":"#DCE8E5"}`, borderRadius:9, background:ratio===r.key?"#E5F0EE":"#F4F7F6", cursor:"pointer", fontFamily:"inherit" }}>
                  <div style={{ width: r.key==="1:1"?20:r.key==="4:5"?16:12, height:20, border:`2px solid ${ratio===r.key?"#155855":"#9BB5B0"}`, borderRadius:2, margin:"0 auto 5px" }} />
                  <div style={{ fontSize:10, fontWeight:700, color:ratio===r.key?"#155855":"#5A7470" }}>{r.label}</div>
                </button>
              ))}
            </div>
          </PanelSection>

          <PanelSection label="레이아웃">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {TEMPLATES.map(t => (
                <button key={t.key} onClick={() => handleTemplate(t.key)}
                  style={{ padding:"9px 8px", border:`1.5px solid ${template===t.key?"#E85D2C":"#DCE8E5"}`, borderRadius:9, background:template===t.key?"#FFF8F5":"#F4F7F6", cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:template===t.key?"#E85D2C":"#1C2B28" }}>{t.name}</div>
                  <div style={{ fontSize:10, color:"#5A7470", marginTop:1 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </PanelSection>

          <PanelSection label="폰트 & 크기">
            <select value={font} onChange={e=>setFont(e.target.value as FontKey)} style={iStyle}>
              {FONTS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
              <span style={{ fontSize:11, color:"#5A7470", fontWeight:600, minWidth:55 }}>{fontSize}px</span>
              <input type="range" min={14} max={72} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{ flex:1 }} />
            </div>
          </PanelSection>

          <PanelSection label="텍스트 색상">
            <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
              {TEXT_COLORS.map(hex => (
                <div key={hex} onClick={() => handleTextColor(hex)}
                  style={{ width:26, height:26, borderRadius:"50%", background:hex, border:`2px solid ${textColor===hex?"#1C2B28":"rgba(0,0,0,.1)"}`, cursor:"pointer", transform:textColor===hex?"scale(1.2)":"scale(1)", transition:"all .15s", boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #DCE8E5":"none" }} />
              ))}
            </div>
          </PanelSection>

          {/* AI / 직접 입력 탭 */}
          <PanelSection label="텍스트">
            <div style={{ display:"flex", gap:0, marginBottom:12, background:"#F4F7F6", borderRadius:8, padding:3 }}>
              {(["ai","manual"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ flex:1, height:28, border:"none", borderRadius:6, background:activeTab===tab?"#fff":"transparent", color:activeTab===tab?"#1C2B28":"#5A7470", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  {tab==="ai" ? "AI 캡션" : "직접 입력"}
                </button>
              ))}
            </div>

            {activeTab === "ai" ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <select value={dept} onChange={e=>setDept(e.target.value)} style={iStyle}>
                  <option value="">진료과목 선택</option>
                  {DEPTS.map(d=><option key={d}>{d}</option>)}
                </select>
                <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="주제 (예: 원장 프로필)" style={iStyle} onKeyDown={e=>{ if(e.key==="Enter") generateCaption(); }} />
                <select value={tone} onChange={e=>setTone(e.target.value)} style={iStyle}>
                  {["신뢰감·전문적","따뜻함·친근함","모던·세련됨","트렌디·감각적"].map(t=><option key={t}>{t}</option>)}
                </select>
                <button onClick={generateCaption} disabled={generating}
                  style={{ height:40, background:generating?"#9BB5B0":"#E85D2C", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:generating?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  {generating ? <><Spinner /><span>생성 중...</span></> : "캡션 + 해시태그 생성"}
                </button>
                {isMock && <div style={{ fontSize:11, color:"#C8860A", background:"#FDF5E0", borderRadius:7, padding:"6px 9px" }}>샘플 데이터 · ANTHROPIC_API_KEY 설정 시 실제 생성</div>}
                {captions.length > 0 && (
                  <>
                    {captions.map((cap, i) => (
                      <div key={i} onClick={() => setSelIdx(i)}
                        style={{ border:`1.5px solid ${selIdx===i?"#155855":"#DCE8E5"}`, borderRadius:9, padding:"9px 11px", cursor:"pointer", background:selIdx===i?"#E5F0EE":"#F4F7F6" }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"#E85D2C", marginBottom:3 }}>{cap.type}</div>
                        <div style={{ fontSize:12, lineHeight:1.55, color:"#1C2B28", whiteSpace:"pre-line" }}>{cap.text}</div>
                      </div>
                    ))}
                    <div style={{ fontSize:11, color:"#569082", lineHeight:1.7, wordBreak:"break-all" }}>{hashtags}</div>
                    <button onClick={() => placeText(captions[selIdx].text, hospName || "PHOTO CLINIC")}
                      style={{ height:36, background:"#155855", color:"#fff", border:"none", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                      선택한 캡션 적용
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <textarea value={mainText} onChange={e=>setMainText(e.target.value)} placeholder="메인 텍스트" style={{ ...iStyle, minHeight:64, resize:"vertical" }} />
                <input value={subText} onChange={e=>setSubText(e.target.value)} placeholder="서브 텍스트 (선택)" style={iStyle} />
                <button onClick={() => placeText(mainText, subText || undefined)}
                  style={{ height:36, background:"#155855", color:"#fff", border:"none", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  캔버스에 적용
                </button>
              </div>
            )}
          </PanelSection>
        </aside>

        {/* ── 캔버스 ── */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"24px", overflowY:"auto" }}>
          <div style={{ boxShadow:"0 8px 40px rgba(0,0,0,.15)", borderRadius:4, overflow:"hidden", position:"relative" }}>
            <canvas ref={canvasRef} />
            {!fabricReady && (
              <div style={{ position:"absolute", inset:0, background:"rgba(244,247,246,.9)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
                <Spinner color="#155855" size={32} />
                <div style={{ fontSize:13, color:"#5A7470" }}>에디터 초기화 중...</div>
              </div>
            )}
          </div>
          <div style={{ fontSize:11, color:"#9BB5B0", marginTop:10 }}>
            {cw} × {ch}px · 비율 {ratio} · 다운로드 시 2배 해상도
          </div>
        </main>

        {/* ── 히스토리 ── */}
        {showHist && (
          <aside style={{ width:220, background:"#fff", borderLeft:"1px solid #DCE8E5", overflowY:"auto", padding:"14px 12px", flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#5A7470", textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>히스토리</div>
            {history.length === 0 && <div style={{ fontSize:12, color:"#9BB5B0", textAlign:"center", paddingTop:20 }}>저장된 내역이 없습니다<br/><span style={{fontSize:10}}>Supabase 설정 필요</span></div>}
            {history.map(item => (
              <div key={item.id} style={{ marginBottom:10, border:"1px solid #DCE8E5", borderRadius:9, overflow:"hidden" }}>
                {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width:"100%", display:"block" }} />}
                <div style={{ padding:"7px 9px" }}>
                  <div style={{ fontSize:11, fontWeight:700 }}>{item.hospital_name || "—"}</div>
                  <div style={{ fontSize:10, color:"#9BB5B0", marginTop:2 }}>{item.ratio} · {item.template}</div>
                  <div style={{ fontSize:10, color:"#5A7470", marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.caption}</div>
                </div>
              </div>
            ))}
          </aside>
        )}
      </div>

      {/* 토스트 */}
      <div style={{ position:"fixed", bottom:20, left:"50%", transform:`translateX(-50%) translateY(${toast?"0":"70px"})`, background:"#155855", color:"#fff", fontSize:13, padding:"9px 20px", borderRadius:22, transition:"transform .3s", pointerEvents:"none", zIndex:999, fontWeight:600, whiteSpace:"nowrap" }}>
        {toast}
      </div>
    </div>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────
function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:16, paddingBottom:16, borderBottom:"1px solid #DCE8E5" }}>
      <div style={{ fontSize:10, fontWeight:700, color:"#5A7470", textTransform:"uppercase", letterSpacing:".07em", marginBottom:9, display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ width:5, height:5, borderRadius:"50%", background:"#E85D2C", display:"inline-block" }} />
        {label}
      </div>
      {children}
    </div>
  );
}

function Spinner({ color="#fff", size=14 }: { color?: string; size?: number }) {
  return (
    <div style={{ width:size, height:size, border:`${Math.max(2,size/7)}px solid rgba(0,0,0,.1)`, borderTopColor:color, borderRadius:"50%", animation:"spin .6s linear infinite", flexShrink:0 }} />
  );
}

const iStyle: React.CSSProperties = {
  width:"100%", border:"1.5px solid #DCE8E5", borderRadius:9,
  padding:"8px 11px", fontSize:13, fontFamily:"'Noto Sans KR', sans-serif",
  background:"#F4F7F6", color:"#1C2B28", outline:"none",
};
