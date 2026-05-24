"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { PANTONE_PALETTES, FONT_PAIRS, PC_STYLE } from "@/lib/photoclinic-style";

// ── 타입 ──────────────────────────────────────────────
type Ratio    = "1:1"|"4:5"|"9:16";
type Template = "bottom"|"overlay-teal"|"top"|"minimal"|"split"|"frame";
type ContentType = "portfolio"|"bts"|"philosophy"|"space"|"profile";
type CaptionItem = { type:string; text:string };

// ── 상수 ─────────────────────────────────────────────
const RATIOS = [
  { key:"1:1"  as Ratio, label:"1:1 피드",    w:540, h:540 },
  { key:"4:5"  as Ratio, label:"4:5 세로",    w:432, h:540 },
  { key:"9:16" as Ratio, label:"9:16 스토리", w:304, h:540 },
];

const TEMPLATES = [
  { key:"bottom"       as Template, name:"하단 그라디언트", desc:"아래에서 위로 페이드" },
  { key:"overlay-teal" as Template, name:"틸 오버레이",    desc:"포토클리닉 시그니처" },
  { key:"top"          as Template, name:"상단",           desc:"위쪽 다크 영역" },
  { key:"split"        as Template, name:"좌우 분할",      desc:"왼쪽 컬러 바" },
  { key:"frame"        as Template, name:"프레임",         desc:"사진 테두리 프레임" },
  { key:"minimal"      as Template, name:"미니멀",         desc:"텍스트만" },
];

const CONTENT_TYPES: { key:ContentType; label:string; emoji:string }[] = [
  { key:"portfolio",  label:"포트폴리오",  emoji:"📸" },
  { key:"bts",        label:"촬영 현장",   emoji:"🎬" },
  { key:"philosophy", label:"철학·생각",   emoji:"💭" },
  { key:"space",      label:"공간 감성",   emoji:"🏛" },
  { key:"profile",    label:"의료진 프로필", emoji:"👤" },
];

const DEPTS = ["피부과","성형외과","치과","안과","정형외과","한의원","산부인과","내과","정신건강의학과"];
const TONES = ["다크·고급","모던·절제","따뜻·감성","클린·밝음"];

export default function InstaDesignerPage() {
  // 설정
  const [ratio,       setRatio]      = useState<Ratio>("1:1");
  const [template,    setTemplate]   = useState<Template>("bottom");
  const [textColor,   setTextColor]  = useState("#FFFFFF");
  const [bgColor,     setBgColor]    = useState("#1C2B28");
  const [fontPair,    setFontPair]   = useState(0);
  const [fontSize,    setFontSize]   = useState(28);
  const [lineH,       setLineH]      = useState(1.5);
  const [letterSp,    setLetterSp]   = useState(0);
  const [textAlign,   setTextAlign]  = useState<"left"|"center"|"right">("center");
  const [showLogo,    setShowLogo]   = useState(true);
  const [logoStyle,   setLogoStyle]  = useState<"text"|"icon">("text");
  const [overlayAlpha,setOverlayAlpha] = useState(55);
  const [accentColor, setAccentColor]= useState(PC_STYLE.brand.orange);

  // AI
  const [contentType, setContentType]= useState<ContentType>("portfolio");
  const [dept,        setDept]       = useState("");
  const [tone,        setTone]       = useState("다크·고급");
  const [customNote,  setCustomNote] = useState("");
  const [generating,  setGenerating] = useState(false);
  const [captions,    setCaptions]   = useState<CaptionItem[]>([]);
  const [hashtags,    setHashtags]   = useState("");
  const [selIdx,      setSelIdx]     = useState(0);
  const [isMock,      setIsMock]     = useState(false);

  // 직접 입력
  const [mainText,    setMainText]   = useState("");
  const [subText,     setSubText]    = useState("");
  const [activeTab,   setActiveTab]  = useState<"ai"|"manual">("ai");
  const [activeTool,  setActiveTool] = useState<"design"|"text"|"filter">("design");

  // 히스토리 (실행 취소/다시 실행)
  const [undoStack,   setUndoStack]  = useState<string[]>([]);
  const [redoStack,   setRedoStack]  = useState<string[]>([]);
  const [canUndo,     setCanUndo]    = useState(false);
  const [canRedo,     setCanRedo]    = useState(false);

  // 필터
  const [brightness,  setBrightness] = useState(93);
  const [contrast,    setContrast]   = useState(102);
  const [saturation,  setSaturation] = useState(82);
  const [warmth,      setWarmth]     = useState(20);

  // 기타
  const [toast,       setToast]      = useState("");
  const [imageLoaded, setImageLoaded]= useState(false);
  const [fabricReady, setFabricReady]= useState(false);
  const [showPantone, setShowPantone]= useState(false);
  const [activePalette,setActivePalette] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const imgRef    = useRef<any>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg:string) => { setToast(msg); setTimeout(()=>setToast(""),2500); }, []);

  // ── Fabric.js 로드 ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
    s.onload = () => setFabricReady(true);
    document.head.appendChild(s);
    return () => { try { fabricRef.current?.dispose(); } catch {} };
  }, []);

  useEffect(() => { if (fabricReady && canvasRef.current) initFabric(ratio); }, [fabricReady]);

  function getFab() { return typeof window!=="undefined" ? (window as any).fabric : null; }
  function getDims(r:Ratio=ratio) { return RATIOS.find(x=>x.key===r)||RATIOS[0]; }

  function initFabric(r:Ratio=ratio) {
    const Fab = getFab(); if (!Fab || !canvasRef.current) return;
    try { fabricRef.current?.dispose(); } catch {}
    const { w, h } = getDims(r);
    fabricRef.current = new Fab.Canvas(canvasRef.current, { width:w, height:h, backgroundColor:"#E5F0EE" });
    fabricRef.current.on("mouse:dblclick", (opt:any) => { if(opt.target?.type==="i-text") opt.target.enterEditing(); });
    fabricRef.current.on("object:modified", saveUndoState);
    fabricRef.current.on("object:added",    saveUndoState);
    fabricRef.current.on("object:removed",  saveUndoState);
  }

  // ── 실행 취소/다시 실행 ──
  function saveUndoState() {
    if (!fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON(["name"]));
    setUndoStack(prev => { const next = [...prev.slice(-19), json]; setCanUndo(next.length>0); return next; });
    setRedoStack([]); setCanRedo(false);
  }

  const undo = useCallback(() => {
    if (!fabricRef.current || undoStack.length===0) return;
    const current = JSON.stringify(fabricRef.current.toJSON(["name"]));
    const prev = undoStack[undoStack.length-1];
    setRedoStack(r => { const next=[...r,current]; setCanRedo(true); return next; });
    setUndoStack(u => { const next=u.slice(0,-1); setCanUndo(next.length>0); return next; });
    fabricRef.current.loadFromJSON(JSON.parse(prev), () => fabricRef.current.renderAll());
  }, [undoStack]);

  const redo = useCallback(() => {
    if (!fabricRef.current || redoStack.length===0) return;
    const current = JSON.stringify(fabricRef.current.toJSON(["name"]));
    const next = redoStack[redoStack.length-1];
    setUndoStack(u => { const n=[...u,current]; setCanUndo(true); return n; });
    setRedoStack(r => { const n=r.slice(0,-1); setCanRedo(n.length>0); return n; });
    fabricRef.current.loadFromJSON(JSON.parse(next), () => fabricRef.current.renderAll());
  }, [redoStack]);

  // 키보드 단축키
  useEffect(() => {
    const onKey = (e:KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey||e.ctrlKey) && e.key==="z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey||e.ctrlKey) && (e.key==="y"||(e.key==="z"&&e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key==="Backspace"||e.key==="Delete") removeSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // ── 비율 변경 ──
  const handleRatio = (r:Ratio) => {
    setRatio(r);
    if (!fabricRef.current) return;
    const {w,h} = getDims(r);
    fabricRef.current.setWidth(w); fabricRef.current.setHeight(h);
    if (imgRef.current) scaleImg(imgRef.current, w, h);
    fabricRef.current.renderAll();
  };

  function scaleImg(img:any, cw:number, ch:number) {
    // naturalWidth/height 가 없으면 width/height 사용
    const iw = img.width  || (img._element && img._element.naturalWidth)  || 1;
    const ih = img.height || (img._element && img._element.naturalHeight) || 1;
    const scale = Math.max(cw / iw, ch / ih);
    const scaledW = iw * scale;
    const scaledH = ih * scale;
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: (cw - scaledW) / 2,
      top:  (ch - scaledH) / 2,
    });
  }

  // ── 이미지 업로드 ──
  const loadImage = useCallback((file:File) => {
    if (file.size>10*1024*1024) { showToast("10MB 이하만 가능"); return; }
    if (!fabricReady) { showToast("에디터 초기화 중..."); return; }
    const Fab = getFab(); if (!Fab||!fabricRef.current) return;
    const reader = new FileReader();
    reader.onload = e => {
      Fab.Image.fromURL(e.target!.result as string, (img:any) => {
        if (!img) { showToast("이미지 로드 실패"); return; }
        const {w,h} = getDims();
        img.set({ scaleX:1, scaleY:1, left:0, top:0 });
        scaleImg(img, w, h);
        img.set({ selectable:true, evented:true });
        fabricRef.current.clear();
        fabricRef.current.setBackgroundColor("#E5F0EE", ()=>{});
        fabricRef.current.add(img);
        img.sendToBack();
        imgRef.current = img;
        setImageLoaded(true);
        applyFilter(img);
        applyTemplate(template, w, h);
        if (showLogo) addLogo(w, h);
        fabricRef.current.renderAll();
        showToast("이미지 업로드 완료");
        saveUndoState();
      }, { crossOrigin: "anonymous" });
        fabricRef.current.add(img); img.sendToBack();
        imgRef.current = img;
        setImageLoaded(true);
        applyFilter(img);
        applyTemplate(template, w, h);
        if (showLogo) addLogo(w, h);
        fabricRef.current.renderAll();
        showToast("이미지 업로드 완료");
        saveUndoState();
      }, { crossOrigin: "anonymous" });
    };
    reader.readAsDataURL(file);
  }, [fabricReady, template, showLogo, ratio, brightness, contrast, saturation, warmth]);

  // ── 필터 적용 ──
  function applyFilter(img?:any) {
    const Fab = getFab(); if (!Fab) return;
    const target = img || imgRef.current;
    if (!target) return;
    target.filters = [
      new Fab.Image.filters.Brightness({ brightness: (brightness-100)/100 }),
      new Fab.Image.filters.Contrast({ contrast: (contrast-100)/100 }),
      new Fab.Image.filters.Saturation({ saturation: (saturation-100)/100 }),
    ];
    if (warmth!==0) {
      target.filters.push(new Fab.Image.filters.ColorMatrix({
        matrix: warmth>0
          ? [1+warmth*0.003,0,0,0,warmth*0.8, 0,1,0,0,0, 0,0,1-warmth*0.002,0,0, 0,0,0,1,0]
          : [1,0,0,0,0, 0,1,0,0,warmth*0.3*-1, 0,0,1+warmth*0.003*-1,0,warmth*1*-1, 0,0,0,1,0]
      }));
    }
    target.applyFilters();
    fabricRef.current?.renderAll();
  }

  useEffect(() => { if (imageLoaded) applyFilter(); }, [brightness, contrast, saturation, warmth]);

  // ── 템플릿 오버레이 ──
  function applyTemplate(tmpl:Template, cw:number, ch:number) {
    const Fab = getFab(); if (!Fab||!fabricRef.current) return;
    removeByName("overlay"); removeByName("frame-rect"); removeByName("accent-bar");

    const alpha = overlayAlpha/100;
    const ac = hexToRgba(accentColor, alpha);
    const dark = `rgba(0,0,0,${alpha})`;
    const teal = `rgba(21,88,85,${alpha})`;

    if (tmpl==="bottom") {
      // 하단 그라디언트 (CSS gradient 모방)
      for (let i=0;i<8;i++) {
        const a = (i/8)*alpha;
        fabricRef.current.add(new Fab.Rect({
          left:0, top:ch*(0.55+i*0.056), width:cw, height:ch*0.06,
          fill:`rgba(0,0,0,${a.toFixed(2)})`, selectable:false, evented:false, name:"overlay",
        }));
      }
    } else if (tmpl==="overlay-teal") {
      fabricRef.current.add(new Fab.Rect({
        left:cw*0.06, top:ch*0.3, width:cw*0.88, height:ch*0.42,
        fill:teal, rx:10, ry:10, selectable:false, evented:false, name:"overlay",
      }));
    } else if (tmpl==="top") {
      fabricRef.current.add(new Fab.Rect({
        left:0, top:0, width:cw, height:ch*0.35,
        fill:dark, selectable:false, evented:false, name:"overlay",
      }));
    } else if (tmpl==="split") {
      fabricRef.current.add(new Fab.Rect({
        left:0, top:0, width:6, height:ch,
        fill:accentColor, selectable:false, evented:false, name:"accent-bar",
      }));
      fabricRef.current.add(new Fab.Rect({
        left:0, top:ch*0.6, width:cw, height:ch*0.4,
        fill:"rgba(0,0,0,0.7)", selectable:false, evented:false, name:"overlay",
      }));
    } else if (tmpl==="frame") {
      const pad=14;
      [
        { left:0, top:0, width:cw, height:pad },
        { left:0, top:ch-pad, width:cw, height:pad },
        { left:0, top:0, width:pad, height:ch },
        { left:cw-pad, top:0, width:pad, height:ch },
      ].forEach(r => fabricRef.current.add(new Fab.Rect({
        ...r, fill:accentColor, selectable:false, evented:false, name:"frame-rect",
      })));
    }
  }

  const handleTemplate = (tmpl:Template) => {
    setTemplate(tmpl);
    const {w,h}=getDims(); applyTemplate(tmpl,w,h);
    fabricRef.current?.renderAll();
  };

  function removeByName(name:string) {
    fabricRef.current?.getObjects().filter((o:any)=>o.name===name).forEach((o:any)=>fabricRef.current.remove(o));
  }
  function removeTexts() {
    fabricRef.current?.getObjects().filter((o:any)=>(o.type==="i-text"||o.type==="text")&&o.name!=="logo").forEach((o:any)=>fabricRef.current.remove(o));
  }

  function hexToRgba(hex:string, alpha:number) {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── 로고 ──
  function addLogo(cw:number, ch:number) {
    removeByName("logo");
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const fc = fabricRef.current;
    const pad = 14;
    const logoH = 22;
    const symbolR = 9; // 심볼 반지름
    const sx = cw - pad - 80; // 로고 시작 x
    const sy = ch - pad - logoH;
    const cx = sx + symbolR;
    const cy = sy + logoH/2;

    // ── 렌즈 심볼 ──────────────────────────────────
    // 왼쪽 반원 (오렌지)
    fc.add(new Fab.Path(`M ${cx} ${cy-symbolR} A ${symbolR} ${symbolR} 0 0 0 ${cx} ${cy+symbolR} Z`, {
      fill:"#E85D2C", selectable:false, evented:false, name:"logo",
    }));
    // 오른쪽 반원 (틸)
    fc.add(new Fab.Path(`M ${cx} ${cy-symbolR} A ${symbolR} ${symbolR} 0 0 1 ${cx} ${cy+symbolR} Z`, {
      fill:"#155855", selectable:false, evented:false, name:"logo",
    }));
    // 중간 링 왼쪽 (옐로)
    const r2 = symbolR * 0.62;
    fc.add(new Fab.Path(`M ${cx} ${cy-r2} A ${r2} ${r2} 0 0 0 ${cx} ${cy+r2} Z`, {
      fill:"#EB8F22", selectable:false, evented:false, name:"logo",
    }));
    // 중간 링 오른쪽 (세이지)
    fc.add(new Fab.Path(`M ${cx} ${cy-r2} A ${r2} ${r2} 0 0 1 ${cx} ${cy+r2} Z`, {
      fill:"#569082", selectable:false, evented:false, name:"logo",
    }));
    // 중앙 흰 원
    fc.add(new Fab.Circle({
      left:cx, top:cy, radius:symbolR*0.32,
      fill:"rgba(255,255,255,0.9)", originX:"center", originY:"center",
      selectable:false, evented:false, name:"logo",
    }));

    // ── PHOTO CLINIC 텍스트 ──────────────────────────
    fc.add(new Fab.Text("PHOTO", {
      left: cx + symbolR + 4, top: cy - 5,
      fontSize:8, fill:"#E85D2C", fontFamily:"'Noto Sans KR',sans-serif",
      fontWeight:"700", letterSpacing:1.5,
      selectable:true, name:"logo",
    }));
    fc.add(new Fab.Text("CLINIC", {
      left: cx + symbolR + 4 + 32, top: cy - 5,
      fontSize:8, fill:"#155855", fontFamily:"'Noto Sans KR',sans-serif",
      fontWeight:"700", letterSpacing:1.5,
      selectable:true, name:"logo",
    }));
  }
  const tmpl = template;

  const handleToggleLogo = () => {
    const next=!showLogo; setShowLogo(next);
    if(next){ const{w,h}=getDims(); addLogo(w,h); } else removeByName("logo");
    fabricRef.current?.renderAll();
  };

  // ── 텍스트 배치 ──
  function placeText(main:string, sub?:string) {
    const Fab=getFab(); if(!Fab||!fabricRef.current) { showToast("에디터 준비 중"); return; }
    const {w:cw,h:ch}=getDims();
    const fp=FONT_PAIRS[fontPair];
    removeTexts();

    let topM=ch*0.65, topS=ch*0.8;
    if (template==="overlay-teal") { topM=ch*0.38; topS=ch*0.56; }
    else if (template==="top")     { topM=ch*0.08; topS=ch*0.24; }
    else if (template==="split")   { topM=ch*0.65; topS=ch*0.8; }
    else if (template==="frame")   { topM=ch*0.6;  topS=ch*0.78; }
    else if (template==="minimal") { topM=ch*0.4;  topS=ch*0.58; }

    const hasShadow = template!=="overlay-teal" && template!=="minimal";
    const shadow = hasShadow ? "rgba(0,0,0,0.5) 0 2px 8px" : undefined;

    if (main) fabricRef.current.add(new Fab.IText(main, {
      left:cw/2, top:topM, originX:"center",
      fontSize, fill:textColor, fontFamily:`'${fp.display}',serif,sans-serif`,
      fontWeight:"600", textAlign, width:cw*0.86, lineHeight:lineH,
      charSpacing:letterSp*10, shadow, name:"main-text",
    }));
    if (sub) fabricRef.current.add(new Fab.IText(sub, {
      left:cw/2, top:topS, originX:"center",
      fontSize:Math.max(10, Math.round(fontSize*0.52)), fill:textColor,
      fontFamily:`'${fp.body}',sans-serif`, fontWeight:"400",
      textAlign, width:cw*0.86, opacity:0.75, lineHeight:lineH,
      charSpacing:letterSp*10, shadow, name:"sub-text",
    }));
    fabricRef.current.renderAll(); saveUndoState();
    showToast("적용 완료 · 더블클릭으로 편집");
  }

  // ── 도형 삽입 ──
  function addShape(type:"rect"|"circle"|"line"|"triangle") {
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const {w:cw,h:ch}=getDims();
    let obj:any;
    const common = { left:cw/2, top:ch/2, originX:"center", originY:"center", fill:"transparent", stroke:accentColor, strokeWidth:2 };
    if (type==="rect")     obj=new Fab.Rect({...common, width:120, height:80, rx:4});
    if (type==="circle")   obj=new Fab.Circle({...common, radius:60});
    if (type==="triangle") obj=new Fab.Triangle({...common, width:100, height:86});
    if (type==="line")     obj=new Fab.Line([0,0,cw*0.4,0],{...common, stroke:accentColor, strokeWidth:1, top:ch*0.6});
    if (obj) { fabricRef.current.add(obj); fabricRef.current.setActiveObject(obj); fabricRef.current.renderAll(); saveUndoState(); }
  }

  // ── 편집 도구 ──
  const addFreeText = () => {
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const {w:cw,h:ch}=getDims();
    const fp=FONT_PAIRS[fontPair];
    const obj = new Fab.IText("텍스트", {
      left:cw/2, top:ch/2, originX:"center", originY:"center",
      fontSize, fill:textColor, fontFamily:`'${fp.display}',serif,sans-serif`, fontWeight:"600",
    });
    fabricRef.current.add(obj); fabricRef.current.setActiveObject(obj);
    fabricRef.current.renderAll(); obj.enterEditing(); saveUndoState();
  };

  const removeSelected = () => {
    if (!fabricRef.current) return;
    const active=fabricRef.current.getActiveObjects();
    if(!active.length){ showToast("삭제할 객체 선택"); return; }
    active.forEach((o:any)=>fabricRef.current.remove(o));
    fabricRef.current.discardActiveObject(); fabricRef.current.renderAll(); saveUndoState();
  };

  const bringFwd = () => { const o=fabricRef.current?.getActiveObject(); if(o){ fabricRef.current.bringForward(o); fabricRef.current.renderAll(); } };
  const sendBwd  = () => { const o=fabricRef.current?.getActiveObject(); if(o){ fabricRef.current.sendBackwards(o); fabricRef.current.renderAll(); } };
  const flipH    = () => { const o=fabricRef.current?.getActiveObject(); if(o){ o.set("flipX",!o.flipX); fabricRef.current.renderAll(); } };
  const duplicate = () => {
    const o=fabricRef.current?.getActiveObject(); if(!o) return;
    o.clone((c:any)=>{ c.set({left:o.left+20, top:o.top+20}); fabricRef.current.add(c); fabricRef.current.renderAll(); saveUndoState(); });
  };

  // ── AI 캡션 ──
  const generateCaption = async () => {
    setGenerating(true);
    try {
      const res=await fetch("/api/caption",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({contentType,dept,tone,customNote}) });
      const data=await res.json();
      if(!data.ok) throw new Error(data.error);
      setCaptions(data.captions||[]); setHashtags(data.hashtags||""); setSelIdx(0); setIsMock(!!data.mock);
      showToast(data.mock?"샘플 데이터 (API 키 미설정)":"캡션 생성 완료!");
    } catch(e:any){ showToast("생성 실패: "+e.message); } finally{ setGenerating(false); }
  };

  // ── 다운로드 ──
  const download = (fmt:"png"|"jpeg") => {
    if (!fabricRef.current) return;
    fabricRef.current.discardActiveObject(); fabricRef.current.renderAll();
    const url=fabricRef.current.toDataURL({ format:fmt, quality:0.95, multiplier:2 });
    const a=document.createElement("a"); a.href=url;
    a.download=`photoclinic_${ratio.replace(":","x")}_${Date.now()}.${fmt==="jpeg"?"jpg":"png"}`;
    a.click(); showToast("다운로드 완료");
  };

  const {w:cw,h:ch}=getDims();

  // ── UI ────────────────────────────────────────────────
  const darkBg  = "#111109";
  const panelBg = "#1A1A1A";
  const border  = "#2A2A2A";
  const txt     = "#E8E4DC";
  const muted   = "#666";
  const accent  = PC_STYLE.brand.orange;

  const iStyle:React.CSSProperties = { width:"100%", border:`1px solid ${border}`, borderRadius:7, padding:"7px 10px", fontSize:12, fontFamily:"inherit", background:"#222", color:txt, outline:"none" };
  const btnStyle = (active?:boolean):React.CSSProperties => ({ border:`1px solid ${active?accent:border}`, borderRadius:7, background:active?"#2A1A10":"#222", color:active?accent:txt, fontSize:11, fontWeight:600, cursor:"pointer", padding:"6px 10px", fontFamily:"inherit", transition:"all .15s" });

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:darkBg, color:txt }}>

      {/* ── 상단 툴바 ── */}
      <div style={{ background:"#151515", borderBottom:`1px solid ${border}`, padding:"8px 16px", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        {/* 로고 */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:12 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="8" fill="#E85D2C"/>
            <circle cx="9" cy="9" r="8" fill="#155855" clipPath="url(#nlr)"/>
            <defs><clipPath id="nlr"><rect x="9" y="0" width="9" height="18"/></clipPath></defs>
            <circle cx="9" cy="9" r="5.5" fill="#EB8F22"/>
            <circle cx="9" cy="9" r="5.5" fill="#569082" clipPath="url(#nlr)"/>
            <circle cx="9" cy="9" r="3" fill="white"/>
          </svg>
          <span style={{ fontSize:12, fontWeight:700, color:txt, letterSpacing:1 }}>PHOTO CLINIC</span>
        </div>

        {/* 실행 취소/다시 실행 */}
        <button onClick={undo} disabled={!canUndo} title="실행 취소 (⌘Z)"
          style={{ ...btnStyle(false), opacity:canUndo?1:0.35 }}>↩ 취소</button>
        <button onClick={redo} disabled={!canRedo} title="다시 실행 (⌘Y)"
          style={{ ...btnStyle(false), opacity:canRedo?1:0.35 }}>↪ 다시</button>

        <div style={{ width:1, height:20, background:border, margin:"0 4px" }} />

        {/* 편집 도구 */}
        <button onClick={addFreeText}   style={btnStyle(false)}>+ 텍스트</button>
        <button onClick={()=>addShape("rect")}     style={btnStyle(false)}>□</button>
        <button onClick={()=>addShape("circle")}   style={btnStyle(false)}>○</button>
        <button onClick={()=>addShape("triangle")} style={btnStyle(false)}>△</button>
        <button onClick={()=>addShape("line")}     style={btnStyle(false)}>—</button>
        <button onClick={duplicate}    style={btnStyle(false)}>복제</button>
        <button onClick={flipH}        style={btnStyle(false)}>반전</button>
        <button onClick={bringFwd}     style={btnStyle(false)}>앞으로</button>
        <button onClick={sendBwd}      style={btnStyle(false)}>뒤로</button>
        <button onClick={removeSelected} style={{ ...btnStyle(false), color:"#E85D2C" }}>삭제</button>

        <div style={{ width:1, height:20, background:border, margin:"0 4px" }} />

        <button onClick={handleToggleLogo} style={btnStyle(showLogo)}>로고 {showLogo?"✓":""}</button>

        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button onClick={()=>download("png")}   style={{ ...btnStyle(false), background:"#155855", borderColor:"#155855", color:"#fff" }}>PNG ↓</button>
          <button onClick={()=>download("jpeg")}  style={{ ...btnStyle(false) }}>JPG ↓</button>
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── 왼쪽 패널 ── */}
        <aside style={{ width:280, background:panelBg, borderRight:`1px solid ${border}`, overflowY:"auto", flexShrink:0 }}>

          {/* 탭 네비 */}
          <div style={{ display:"flex", borderBottom:`1px solid ${border}` }}>
            {([["design","디자인"],["text","텍스트·AI"],["filter","필터"]] as const).map(([key,label]) => (
              <button key={key} onClick={()=>setActiveTool(key as typeof activeTool)}
                style={{ flex:1, height:38, border:"none", background:activeTool===key?"#222":"transparent", color:activeTool===key?accent:muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", borderBottom:activeTool===key?`2px solid ${accent}`:"none" }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding:"14px 12px" }}>

          {/* ── 디자인 탭 ── */}
          {activeTool==="design" && <>

            {/* 이미지 업로드 */}
            <PanelSec label="사진 업로드" accent={accent}>
              <div onClick={()=>fileRef.current?.click()}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) loadImage(f); }}
                style={{ border:`1.5px dashed ${imageLoaded?accent:border}`, borderRadius:9, padding:"14px 8px", textAlign:"center", cursor:"pointer", background:"#1E1E1E" }}>
                <div style={{ fontSize:12, color:imageLoaded?accent:muted, fontWeight:600 }}>
                  {imageLoaded?"✓ 이미지 로드됨":"클릭 또는 드래그"}
                </div>
                <div style={{ fontSize:10, color:"#444", marginTop:3 }}>JPG · PNG · WEBP · 10MB</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{ if(e.target.files?.[0]){ loadImage(e.target.files[0]); e.target.value=""; } }}/>
            </PanelSec>

            {/* 비율 */}
            <PanelSec label="비율" accent={accent}>
              <div style={{ display:"flex", gap:6 }}>
                {RATIOS.map(r=>(
                  <button key={r.key} onClick={()=>handleRatio(r.key)} style={{ flex:1, padding:"8px 4px", border:`1px solid ${ratio===r.key?accent:border}`, borderRadius:8, background:ratio===r.key?"#2A1A10":"#1E1E1E", cursor:"pointer", fontFamily:"inherit" }}>
                    <div style={{ width:r.key==="1:1"?18:r.key==="4:5"?14:10, height:18, border:`2px solid ${ratio===r.key?accent:"#444"}`, borderRadius:2, margin:"0 auto 4px" }} />
                    <div style={{ fontSize:9, fontWeight:700, color:ratio===r.key?accent:muted }}>{r.label}</div>
                  </button>
                ))}
              </div>
            </PanelSec>

            {/* 레이아웃 */}
            <PanelSec label="레이아웃 템플릿" accent={accent}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                {TEMPLATES.map(t=>(
                  <button key={t.key} onClick={()=>handleTemplate(t.key)}
                    style={{ padding:"8px 7px", border:`1px solid ${template===t.key?accent:border}`, borderRadius:8, background:template===t.key?"#2A1A10":"#1E1E1E", cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:template===t.key?accent:txt }}>{t.name}</div>
                    <div style={{ fontSize:9, color:muted, marginTop:1 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
                <label style={{ fontSize:10, color:muted, minWidth:60 }}>오버레이 {overlayAlpha}%</label>
                <input type="range" min={0} max={90} value={overlayAlpha}
                  onChange={e=>{ setOverlayAlpha(+e.target.value); const{w,h}=getDims(); applyTemplate(template,w,h); fabricRef.current?.renderAll(); }}
                  style={{ flex:1 }} />
              </div>
            </PanelSec>

            {/* 액센트 컬러 */}
            <PanelSec label="액센트 컬러" accent={accent}>
              {[PC_STYLE.brand.orange, PC_STYLE.brand.teal, PC_STYLE.brand.orange2, PC_STYLE.brand.teal2, "#FFFFFF", "#1C2B28"].map(hex=>(
                <span key={hex} onClick={()=>setAccentColor(hex)}
                  style={{ display:"inline-block", width:24, height:24, borderRadius:"50%", background:hex, border:`2px solid ${accentColor===hex?"#fff":"transparent"}`, cursor:"pointer", margin:"0 4px 4px 0", transform:accentColor===hex?"scale(1.2)":"scale(1)", transition:"all .15s", boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #444":"none" }} />
              ))}
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
                <label style={{ fontSize:10, color:muted }}>커스텀</label>
                <input type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)} style={{ width:28, height:24, border:"none", borderRadius:4, cursor:"pointer", background:"transparent" }} />
              </div>
            </PanelSec>

            {/* 팬톤 팔레트 */}
            <PanelSec label="팬톤 컬러 팔레트" accent={accent}>
              <button onClick={()=>setShowPantone(v=>!v)} style={{ ...btnStyle(showPantone), width:"100%", marginBottom:8 }}>
                {showPantone?"팔레트 닫기 ▲":"팬톤 컬러 추천 ▼"}
              </button>
              {showPantone && (
                <>
                  <div style={{ display:"flex", gap:4, marginBottom:10, flexWrap:"wrap" }}>
                    {PANTONE_PALETTES.map((p,i)=>(
                      <button key={p.name} onClick={()=>setActivePalette(i)} style={{ fontSize:9, padding:"3px 7px", border:`1px solid ${activePalette===i?accent:border}`, borderRadius:5, background:activePalette===i?"#2A1A10":"#1E1E1E", color:activePalette===i?accent:muted, cursor:"pointer", fontFamily:"inherit" }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    {PANTONE_PALETTES[activePalette].colors.map(c=>(
                      <div key={c.hex} onClick={()=>{ setTextColor(c.hex); setAccentColor(c.hex); }} title={`${c.name}\n${c.label}`}
                        style={{ flex:1, height:40, borderRadius:6, background:c.hex, cursor:"pointer", border:`2px solid ${textColor===c.hex?"#fff":"transparent"}`, transition:"all .15s" }} />
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:4, marginTop:4 }}>
                    {PANTONE_PALETTES[activePalette].colors.map(c=>(
                      <div key={c.hex} style={{ flex:1, textAlign:"center" }}>
                        <div style={{ fontSize:8, color:muted, lineHeight:1.3 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:9, color:muted, marginTop:8 }}>클릭하면 텍스트·액센트 컬러로 적용됩니다</div>
                </>
              )}
            </PanelSec>
          </>}

          {/* ── 텍스트·AI 탭 ── */}
          {activeTool==="text" && <>

            {/* 콘텐츠 유형 */}
            <PanelSec label="콘텐츠 유형" accent={accent}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {CONTENT_TYPES.map(ct=>(
                  <button key={ct.key} onClick={()=>setContentType(ct.key)}
                    style={{ padding:"6px 8px", border:`1px solid ${contentType===ct.key?accent:border}`, borderRadius:7, background:contentType===ct.key?"#2A1A10":"#1E1E1E", color:contentType===ct.key?accent:txt, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    {ct.emoji} {ct.label}
                  </button>
                ))}
              </div>
            </PanelSec>

            {/* AI / 직접 입력 */}
            <PanelSec label="캡션" accent={accent}>
              <div style={{ display:"flex", gap:0, marginBottom:10, background:"#111", borderRadius:7, padding:3 }}>
                {(["ai","manual"] as const).map(tab=>(
                  <button key={tab} onClick={()=>setActiveTab(tab)}
                    style={{ flex:1, height:26, border:"none", borderRadius:5, background:activeTab===tab?"#222":"transparent", color:activeTab===tab?txt:muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    {tab==="ai"?"AI 생성":"직접 입력"}
                  </button>
                ))}
              </div>

              {activeTab==="ai" ? (
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  <select value={dept} onChange={e=>setDept(e.target.value)} style={iStyle}>
                    <option value="">진료과목 (선택)</option>
                    {DEPTS.map(d=><option key={d}>{d}</option>)}
                  </select>
                  <select value={tone} onChange={e=>setTone(e.target.value)} style={iStyle}>
                    {TONES.map(t=><option key={t}>{t}</option>)}
                  </select>
                  <textarea value={customNote} onChange={e=>setCustomNote(e.target.value)}
                    placeholder="추가 참고사항 (선택)" rows={2}
                    style={{ ...iStyle, resize:"vertical", minHeight:54 }} />
                  <button onClick={generateCaption} disabled={generating}
                    style={{ height:38, background:generating?"#333":accent, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:generating?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                    {generating?<><Spinner/><span>생성 중...</span></>:"스토리 캡션 생성 (5줄+)"}
                  </button>
                  {isMock&&<div style={{ fontSize:10, color:"#C8860A", background:"#2A2000", borderRadius:6, padding:"5px 8px" }}>샘플 · ANTHROPIC_API_KEY 설정 시 실제 생성</div>}
                  {captions.length>0&&<>
                    {captions.map((cap,i)=>(
                      <div key={i} onClick={()=>setSelIdx(i)}
                        style={{ border:`1px solid ${selIdx===i?accent:border}`, borderRadius:8, padding:"8px 10px", cursor:"pointer", background:selIdx===i?"#2A1A10":"#1E1E1E" }}>
                        <div style={{ fontSize:9, fontWeight:700, color:accent, marginBottom:3 }}>{cap.type}</div>
                        <div style={{ fontSize:11, lineHeight:1.7, color:txt, whiteSpace:"pre-line", maxHeight:120, overflowY:"auto", paddingRight:4 }}>{cap.text}</div>
                      </div>
                    ))}
                    <div style={{ fontSize:10, color:"#569082", lineHeight:1.7, wordBreak:"break-all", padding:"6px 0" }}>{hashtags}</div>
                    <button onClick={()=>placeText(captions[selIdx].text)}
                      style={{ height:34, background:"#155855", color:"#fff", border:"none", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                      선택한 캡션 캔버스에 적용
                    </button>
                  </>}
                </div>
              ):(
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  <textarea value={mainText} onChange={e=>setMainText(e.target.value)} placeholder="메인 텍스트" rows={3}
                    style={{ ...iStyle, resize:"vertical" }} />
                  <input value={subText} onChange={e=>setSubText(e.target.value)} placeholder="서브 텍스트 (선택)" style={iStyle}/>
                  <button onClick={()=>placeText(mainText,subText||undefined)}
                    style={{ height:34, background:"#155855", color:"#fff", border:"none", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    캔버스에 적용
                  </button>
                </div>
              )}
            </PanelSec>

            {/* 폰트 설정 */}
            <PanelSec label="폰트 설정" accent={accent}>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {FONT_PAIRS.map((fp,i)=>(
                  <button key={i} onClick={()=>setFontPair(i)}
                    style={{ padding:"7px 10px", border:`1px solid ${fontPair===i?accent:border}`, borderRadius:7, background:fontPair===i?"#2A1A10":"#1E1E1E", color:fontPair===i?accent:txt, fontSize:11, cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
                    <span style={{ fontFamily:`'${fp.display}',serif,sans-serif`, marginRight:6 }}>{fp.display.split(" ")[0]}</span>
                    <span style={{ fontSize:9, color:muted }}>· {fp.label}</span>
                  </button>
                ))}
                <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:4 }}>
                  <label style={{ fontSize:10, color:muted, minWidth:50 }}>{fontSize}px</label>
                  <input type="range" min={12} max={80} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{ flex:1 }} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <label style={{ fontSize:10, color:muted, minWidth:50 }}>줄간격</label>
                  <input type="range" min={10} max={25} value={Math.round(lineH*10)} onChange={e=>setLineH(+e.target.value/10)} style={{ flex:1 }} />
                  <span style={{ fontSize:10, color:muted, minWidth:24 }}>{lineH.toFixed(1)}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <label style={{ fontSize:10, color:muted, minWidth:50 }}>자간</label>
                  <input type="range" min={-5} max={20} value={letterSp} onChange={e=>setLetterSp(+e.target.value)} style={{ flex:1 }} />
                  <span style={{ fontSize:10, color:muted, minWidth:24 }}>{letterSp}</span>
                </div>
                <div style={{ display:"flex", gap:5 }}>
                  {(["left","center","right"] as const).map(a=>(
                    <button key={a} onClick={()=>setTextAlign(a)} style={{ flex:1, height:28, border:`1px solid ${textAlign===a?accent:border}`, borderRadius:6, background:textAlign===a?"#2A1A10":"#1E1E1E", color:textAlign===a?accent:muted, fontSize:12, cursor:"pointer" }}>
                      {a==="left"?"←":a==="center"?"≡":"→"}
                    </button>
                  ))}
                </div>
              </div>
            </PanelSec>

            {/* 텍스트 색상 */}
            <PanelSec label="텍스트 색상" accent={accent}>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["#FFFFFF","#F5F0EB","#E8E4DC","#E85D2C","#EB8F22","#155855","#569082","#1C2B28","#000000"].map(hex=>(
                  <div key={hex} onClick={()=>{ setTextColor(hex); fabricRef.current?.getObjects().forEach((o:any)=>{ if(o.type==="i-text"||o.type==="text") o.set("fill",hex); }); fabricRef.current?.renderAll(); }}
                    style={{ width:24, height:24, borderRadius:"50%", background:hex, border:`2px solid ${textColor===hex?"#fff":"transparent"}`, cursor:"pointer", transform:textColor===hex?"scale(1.2)":"scale(1)", transition:"all .15s", boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #444":"none" }} />
                ))}
              </div>
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
                <label style={{ fontSize:10, color:muted }}>커스텀</label>
                <input type="color" value={textColor} onChange={e=>{ setTextColor(e.target.value); }} style={{ width:28, height:22, border:"none", borderRadius:4, cursor:"pointer", background:"transparent" }} />
              </div>
            </PanelSec>
          </>}

          {/* ── 필터 탭 ── */}
          {activeTool==="filter" && <>
            <PanelSec label="사진 필터 (포토클리닉 스타일)" accent={accent}>
              <div style={{ fontSize:10, color:muted, marginBottom:10, lineHeight:1.6 }}>
                포토클리닉 스타일: 따뜻한 필름 느낌<br/>
                색온도 높게 · 채도 절제 · 약간 언더한 밝기<br/>
                → 아래 프리셋 버튼으로 한번에 적용
              </div>
              {[
                { label:"밝기",   val:brightness, set:setBrightness, min:50, max:150, def:100 },
                { label:"대비",   val:contrast,   set:setContrast,   min:50, max:150, def:100 },
                { label:"채도",   val:saturation, set:setSaturation, min:0,  max:200, def:90  },
                { label:"색온도", val:warmth,      set:setWarmth,     min:-50,max:50,  def:0   },
              ].map(({ label, val, set, min, max, def }) => (
                <div key={label} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <label style={{ fontSize:11, color:txt, fontWeight:600 }}>{label}</label>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <span style={{ fontSize:10, color:muted }}>{val}</span>
                      <button onClick={()=>set(def)} style={{ fontSize:9, color:muted, background:"none", border:`1px solid ${border}`, borderRadius:4, padding:"1px 5px", cursor:"pointer" }}>초기화</button>
                    </div>
                  </div>
                  <input type="range" min={min} max={max} value={val} onChange={e=>set(+e.target.value)} style={{ width:"100%", accentColor:accent }} />
                </div>
              ))}
              <button onClick={()=>{ setBrightness(93); setContrast(102); setSaturation(82); setWarmth(20); }}
                style={{ ...btnStyle(false), width:"100%", marginTop:4, borderColor:accent, color:accent }}>
                🎞 포토클리닉 필름 프리셋
              </button>
              <div style={{ fontSize:9, color:muted, marginTop:4, lineHeight:1.5 }}>
                밝기 -7 · 대비 +2 · 채도 -18 · 색온도 +20 (따뜻한 필름 느낌)
              </div>
              <button onClick={()=>{ setBrightness(100); setContrast(100); setSaturation(90); setWarmth(0); }}
                style={{ ...btnStyle(false), width:"100%", marginTop:6 }}>
                기본값으로 초기화
              </button>
            </PanelSec>
          </>}

          </div>
        </aside>

        {/* ── 캔버스 영역 ── */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"24px", overflowY:"auto", background:"#0D0D0D" }}>
          {/* 캔버스 */}
          <div style={{ boxShadow:"0 12px 60px rgba(0,0,0,.6)", borderRadius:4, overflow:"hidden", position:"relative" }}>
            <canvas ref={canvasRef} />
            {!fabricReady&&(
              <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.8)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
                <Spinner size={32} />
                <div style={{ fontSize:12, color:muted }}>에디터 초기화 중...</div>
              </div>
            )}
          </div>
          <div style={{ fontSize:10, color:"#444", marginTop:10 }}>
            {cw}×{ch}px · {ratio} · 다운로드 2배 해상도 · Cmd+Z 취소 · Cmd+Y 다시실행
          </div>
        </main>
      </div>

      {/* 토스트 */}
      <div style={{ position:"fixed", bottom:20, left:"50%", transform:`translateX(-50%) translateY(${toast?"0":"70px"})`, background:"#155855", color:"#fff", fontSize:12, padding:"9px 18px", borderRadius:20, transition:"transform .3s", pointerEvents:"none", zIndex:999, fontWeight:600 }}>
        {toast}
      </div>
    </div>
  );
}

function PanelSec({ label, children, accent }: { label:string; children:React.ReactNode; accent:string }) {
  return (
    <div style={{ marginBottom:18, paddingBottom:16, borderBottom:"1px solid #222" }}>
      <div style={{ fontSize:9, fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:".09em", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ width:4, height:4, borderRadius:"50%", background:accent, display:"inline-block" }} />
        {label}
      </div>
      {children}
    </div>
  );
}

function Spinner({ size=14 }:{ size?:number }) {
  return <div style={{ width:size, height:size, border:`${Math.max(2,size/7)}px solid rgba(255,255,255,.15)`, borderTopColor:"#E85D2C", borderRadius:"50%", animation:"spin .6s linear infinite", flexShrink:0 }} />;
}
