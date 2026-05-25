"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { PANTONE_PALETTES, FONT_PAIRS, PC_STYLE } from "@/lib/photoclinic-style";

// ── 타입 ──────────────────────────────────────────────
type Ratio       = "1:1"|"4:5"|"9:16";
type Template    = "photo-bottom"|"photo-top"|"text-only"|"photo-overlay"|"split-v"|"frame";
type ContentType = "portfolio"|"bts"|"philosophy"|"space"|"profile";
type CaptionItem = { type:string; text:string };

// ── 상수 ─────────────────────────────────────────────
const RATIOS = [
  { key:"1:1"  as Ratio, label:"1:1 피드",    w:540, h:540 },
  { key:"4:5"  as Ratio, label:"4:5 세로",    w:432, h:540 },
  { key:"9:16" as Ratio, label:"9:16 스토리", w:304, h:540 },
];

// 실제 인스타 카드 스타일에서 분석한 레이아웃
const TEMPLATES = [
  { key:"photo-bottom"  as Template, name:"사진 위 · 텍스트 아래", desc:"상단 60% 사진 + 하단 크림 텍스트" },
  { key:"photo-top"     as Template, name:"텍스트 위 · 사진 아래", desc:"상단 크림 텍스트 + 하단 사진" },
  { key:"photo-overlay" as Template, name:"사진 위 텍스트 오버레이", desc:"사진 전체 + 텍스트 위에 올림" },
  { key:"text-only"     as Template, name:"텍스트 카드", desc:"크림 배경 + 중앙 텍스트 + 하단 심볼" },
  { key:"split-v"       as Template, name:"세로 구분선", desc:"좌측 컬러 바 + 들여쓰기 텍스트" },
  { key:"frame"         as Template, name:"얇은 테두리", desc:"사진 + 바깥 프레임" },
];

const CONTENT_TYPES: { key:ContentType; label:string; emoji:string }[] = [
  { key:"portfolio",  label:"포트폴리오",   emoji:"📸" },
  { key:"bts",        label:"촬영 현장",    emoji:"🎬" },
  { key:"philosophy", label:"철학·생각",    emoji:"💭" },
  { key:"space",      label:"공간 감성",    emoji:"🏛" },
  { key:"profile",    label:"의료진 프로필",emoji:"👤" },
];

const DEPTS = ["피부과","성형외과","치과","안과","정형외과","한의원","산부인과","내과","정신건강의학과"];
const TONES = ["따뜻·감성","다크·고급","모던·절제","클린·밝음"];

// 포토클리닉 UI 컬러 (민트 기반)
const UI = {
  bg:      "#EDF5F3",   // 옅은 민트 앱 배경
  panel:   "#F0F7F5",   // 패널
  surface: "#FFFFFF",
  border:  "#C8DDD9",
  accent:  "#E85D2C",   // 오렌지
  teal:    "#155855",
  muted:   "#5A7470",
  hint:    "#9BB5B0",
  txt:     "#1C2B28",
};

// 캔버스 카드 기본 배경 (크림 아이보리)
const CANVAS_BG = "#F5F0E8";
const MINT_BG   = "#E5F0EE";

export default function InstaDesignerPage() {
  // 캔버스 설정
  const [ratio,        setRatio]        = useState<Ratio>("4:5");
  const [template,     setTemplate]     = useState<Template>("photo-bottom");
  const [textColor,    setTextColor]    = useState(PC_STYLE.brand.orange);
  const [subTextColor, setSubTextColor] = useState(UI.muted);
  const [fontPair,     setFontPair]     = useState(0);
  const [fontSize,     setFontSize]     = useState(32);
  const [subFontSize,  setSubFontSize]  = useState(16);
  const [lineH,        setLineH]        = useState(1.4);
  const [letterSp,     setLetterSp]     = useState(0);
  const [textAlign,    setTextAlign]    = useState<"left"|"center"|"right">("left");
  const [showSymbol,   setShowSymbol]   = useState(true);
  const [accentColor,  setAccentColor]  = useState(PC_STYLE.brand.orange);
  const [canvasBg,     setCanvasBg]     = useState(CANVAS_BG);
  const [photoPct,     setPhotoPct]     = useState(60); // 사진이 차지하는 비율 (%)

  // AI
  const [contentType,  setContentType]  = useState<ContentType>("portfolio");
  const [dept,         setDept]         = useState("");
  const [tone,         setTone]         = useState("따뜻·감성");
  const [customNote,   setCustomNote]   = useState("");
  const [generating,   setGenerating]   = useState(false);
  const [captions,     setCaptions]     = useState<CaptionItem[]>([]);
  const [hashtags,     setHashtags]     = useState("");
  const [selIdx,       setSelIdx]       = useState(0);
  const [isMock,       setIsMock]       = useState(false);

  // 직접 입력
  const [mainText,    setMainText]   = useState("");
  const [subText,     setSubText]    = useState("");
  const [microText,   setMicroText]  = useState("");
  const [activeTab,   setActiveTab]  = useState<"ai"|"manual">("ai");
  const [activeTool,  setActiveTool] = useState<"layout"|"text"|"filter">("layout");

  // Undo/Redo
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [canUndo,   setCanUndo]   = useState(false);
  const [canRedo,   setCanRedo]   = useState(false);

  // 필터
  const [brightness, setBrightness] = useState(100);
  const [contrast,   setContrast]   = useState(100);
  const [saturation, setSaturation] = useState(95);
  const [warmth,     setWarmth]     = useState(0);

  // 기타
  const [toast,        setToast]        = useState("");
  const [imageLoaded,  setImageLoaded]  = useState(false);
  const [fabricReady,  setFabricReady]  = useState(false);
  const [showPantone,  setShowPantone]  = useState(false);
  const [activePal,    setActivePal]    = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const imgRef    = useRef<any>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg:string)=>{
    setToast(msg); setTimeout(()=>setToast(""),2500);
  },[]);

  // ── Fabric.js 로드 ─────────────────────────────────
  useEffect(()=>{
    if (typeof window==="undefined") return;
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
    s.onload=()=>setFabricReady(true);
    s.onerror=()=>showToast("Fabric.js 로드 실패 — 새로고침 해주세요");
    document.head.appendChild(s);
    return ()=>{ try{ fabricRef.current?.dispose(); }catch{} };
  },[]); // eslint-disable-line

  useEffect(()=>{
    if (fabricReady && canvasRef.current) initFabric(ratio);
  },[fabricReady]); // eslint-disable-line

  useEffect(()=>{
    if (imageLoaded) applyFilter();
  },[brightness,contrast,saturation,warmth]); // eslint-disable-line

  // ── 헬퍼 ──────────────────────────────────────────
  function getFab():any { return typeof window!=="undefined"?(window as any).fabric:null; }
  function getDims(r:Ratio=ratio){ return RATIOS.find(x=>x.key===r)||RATIOS[0]; }
  function hexToRgba(hex:string,alpha:number){
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function initFabric(r:Ratio=ratio){
    const Fab=getFab(); if(!Fab||!canvasRef.current) return;
    try{ fabricRef.current?.dispose(); }catch{}
    const {w,h}=getDims(r);
    fabricRef.current=new Fab.Canvas(canvasRef.current,{
      width:w, height:h, backgroundColor:canvasBg,
    });
    fabricRef.current.on("mouse:dblclick",(opt:any)=>{ if(opt.target?.type==="i-text") opt.target.enterEditing(); });
    fabricRef.current.on("object:modified",saveUndoState);
    fabricRef.current.on("object:added",   saveUndoState);
    fabricRef.current.on("object:removed", saveUndoState);
  }

  // ── Undo/Redo ─────────────────────────────────────
  function saveUndoState(){
    if(!fabricRef.current) return;
    const json=JSON.stringify(fabricRef.current.toJSON(["name"]));
    setUndoStack(prev=>{ const n=[...prev.slice(-19),json]; setCanUndo(n.length>0); return n; });
    setRedoStack([]); setCanRedo(false);
  }
  const undo=useCallback(()=>{
    if(!fabricRef.current||undoStack.length===0) return;
    const cur=JSON.stringify(fabricRef.current.toJSON(["name"]));
    const prev=undoStack[undoStack.length-1];
    setRedoStack(r=>{ const n=[...r,cur]; setCanRedo(true); return n; });
    setUndoStack(u=>{ const n=u.slice(0,-1); setCanUndo(n.length>0); return n; });
    fabricRef.current.loadFromJSON(JSON.parse(prev),()=>fabricRef.current.renderAll());
  },[undoStack]);
  const redo=useCallback(()=>{
    if(!fabricRef.current||redoStack.length===0) return;
    const cur=JSON.stringify(fabricRef.current.toJSON(["name"]));
    const nxt=redoStack[redoStack.length-1];
    setUndoStack(u=>{ const n=[...u,cur]; setCanUndo(true); return n; });
    setRedoStack(r=>{ const n=r.slice(0,-1); setCanRedo(n.length>0); return n; });
    fabricRef.current.loadFromJSON(JSON.parse(nxt),()=>fabricRef.current.renderAll());
  },[redoStack]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const tag=(e.target as HTMLElement)?.tagName;
      if(tag==="INPUT"||tag==="TEXTAREA") return;
      if((e.metaKey||e.ctrlKey)&&e.key==="z"&&!e.shiftKey){ e.preventDefault(); undo(); }
      if((e.metaKey||e.ctrlKey)&&(e.key==="y"||(e.key==="z"&&e.shiftKey))){ e.preventDefault(); redo(); }
      if(e.key==="Backspace"||e.key==="Delete") removeSelected();
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[undo,redo]);

  // ── 비율 변경 ─────────────────────────────────────
  const handleRatio=(r:Ratio)=>{
    setRatio(r);
    if(!fabricRef.current) return;
    const {w,h}=getDims(r);
    fabricRef.current.setWidth(w); fabricRef.current.setHeight(h);
    if(imgRef.current) scaleImg(imgRef.current,w,h);
    fabricRef.current.renderAll();
  };

  // ── 이미지 스케일 ──────────────────────────────────
  // 핵심: Fabric이 fromURL로 로드한 img의 실제 픽셀 크기를 정확히 읽어야 함
  function scaleImg(img:any, cw:number, ch:number, areaH?:number){
    const targetH = areaH ?? ch;
    // _element는 실제 HTMLImageElement
    const iw = img._element?.naturalWidth  || img.width  || 1;
    const ih = img._element?.naturalHeight || img.height || 1;
    const scale = Math.max(cw/iw, targetH/ih);
    img.set({
      scaleX: scale, scaleY: scale,
      left: (cw - iw*scale)/2,
      top:  (0  - (ih*scale - targetH)/2), // 세로 중앙
    });
  }

  // ── 이미지 업로드 ──────────────────────────────────
  const loadImage=useCallback((file:File)=>{
    if(file.size>10*1024*1024){ showToast("10MB 이하만 가능"); return; }
    if(!fabricReady){ showToast("에디터 초기화 중..."); return; }
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const reader=new FileReader();
    reader.onload=e=>{
      Fab.Image.fromURL(
        e.target!.result as string,
        (img:any)=>{
          if(!img||!img._element){ showToast("이미지 로드 실패 — 다시 시도"); return; }
          const {w,h}=getDims();
          applyLayout(img, template, w, h);
          imgRef.current=img;
          setImageLoaded(true);
          applyFilter(img);
          fabricRef.current.renderAll();
          showToast("이미지 업로드 완료 ✓");
          saveUndoState();
        },
        { crossOrigin:"anonymous" }
      );
    };
    reader.readAsDataURL(file);
  },[fabricReady,template,ratio,photoPct,showSymbol,canvasBg]); // eslint-disable-line

  // ── 레이아웃 적용 (핵심) ──────────────────────────
  // 레이아웃마다 이미지를 다른 영역에 배치
  function applyLayout(img:any, tmpl:Template, cw:number, ch:number){
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const fc=fabricRef.current;
    fc.clear();
    fc.setBackgroundColor(canvasBg,()=>{});
    removeByName("layout-rect");

    if(tmpl==="photo-bottom"){
      // 상단 60%(기본) 사진, 하단 크림 배경
      const photoH=Math.round(ch*(photoPct/100));
      // 클립 영역: 사진을 상단 photoH까지만 보이도록
      const clipRect=new Fab.Rect({ left:0,top:0,width:cw,height:photoH,absolutePositioned:true });
      scaleImg(img, cw, photoH);
      img.set({ clipPath:clipRect, top:0, selectable:true });
      fc.add(img); img.sendToBack();
      // 하단 크림 배경
      fc.add(new Fab.Rect({ left:0,top:photoH,width:cw,height:ch-photoH, fill:canvasBg, selectable:false,evented:false,name:"layout-rect" }));

    } else if(tmpl==="photo-top"){
      // 상단 크림, 하단 사진
      const photoH=Math.round(ch*(photoPct/100));
      const textH=ch-photoH;
      const clipRect=new Fab.Rect({ left:0,top:textH,width:cw,height:photoH,absolutePositioned:true });
      scaleImg(img, cw, photoH);
      img.set({ clipPath:clipRect, top:textH, selectable:true });
      fc.add(img); img.sendToBack();
      fc.add(new Fab.Rect({ left:0,top:0,width:cw,height:textH, fill:canvasBg, selectable:false,evented:false,name:"layout-rect" }));

    } else if(tmpl==="photo-overlay"){
      // 사진 전체 꽉 채움
      const iw=img._element?.naturalWidth||img.width||1;
      const ih=img._element?.naturalHeight||img.height||1;
      const scale=Math.max(cw/iw,ch/ih);
      img.set({ scaleX:scale,scaleY:scale, left:(cw-iw*scale)/2, top:(ch-ih*scale)/2, selectable:true });
      fc.add(img); img.sendToBack();

    } else if(tmpl==="text-only"){
      // 사진 없음, 크림 카드
      fc.setBackgroundColor(canvasBg,()=>{});
      if(img){
        // 이미지가 있어도 text-only는 안 보여줌
        // 작게 상단에 배치하는 옵션
      }

    } else if(tmpl==="split-v"){
      // 좌측 컬러바 + 사진 전체
      const iw=img._element?.naturalWidth||img.width||1;
      const ih=img._element?.naturalHeight||img.height||1;
      const scale=Math.max(cw/iw,ch/ih);
      img.set({ scaleX:scale,scaleY:scale, left:(cw-iw*scale)/2, top:(ch-ih*scale)/2, selectable:true });
      fc.add(img); img.sendToBack();
      // 하단 텍스트 배경
      fc.add(new Fab.Rect({ left:0,top:ch*0.58,width:cw,height:ch*0.42, fill:hexToRgba(canvasBg,0.92), selectable:false,evented:false,name:"layout-rect" }));
      // 좌측 세로 구분선
      fc.add(new Fab.Rect({ left:28,top:ch*0.65,width:2,height:ch*0.2, fill:accentColor, selectable:false,evented:false,name:"layout-rect" }));

    } else if(tmpl==="frame"){
      // 사진 전체 + 바깥 얇은 프레임
      const iw=img._element?.naturalWidth||img.width||1;
      const ih=img._element?.naturalHeight||img.height||1;
      const scale=Math.max(cw/iw,ch/ih);
      img.set({ scaleX:scale,scaleY:scale, left:(cw-iw*scale)/2, top:(ch-ih*scale)/2, selectable:true });
      fc.add(img); img.sendToBack();
      const pad=10;
      [
        { left:0,top:0,width:cw,height:pad },
        { left:0,top:ch-pad,width:cw,height:pad },
        { left:0,top:0,width:pad,height:ch },
        { left:cw-pad,top:0,width:pad,height:ch },
      ].forEach(r=>fc.add(new Fab.Rect({ ...r,fill:canvasBg,selectable:false,evented:false,name:"layout-rect" })));
    }

    if(showSymbol) addSymbol(cw,ch,tmpl);
  }

  const handleTemplate=(tmpl:Template)=>{
    setTemplate(tmpl);
    if(!fabricRef.current) return;
    const {w,h}=getDims();
    if(imgRef.current){
      applyLayout(imgRef.current, tmpl, w, h);
    } else {
      fabricRef.current.clear();
      fabricRef.current.setBackgroundColor(canvasBg,()=>{});
      if(showSymbol) addSymbol(w,h,tmpl);
    }
    fabricRef.current.renderAll();
  };

  // ── 포토클리닉 심볼 (렌즈 로고만, 가운데 하단) ───
  function addSymbol(cw:number, ch:number, tmpl:Template){
    removeByName("logo");
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const fc=fabricRef.current;
    const r1=14, r2=9, r3=4;
    // 위치: 하단 중앙
    let sy=ch-36;
    if(tmpl==="photo-bottom"||tmpl==="text-only"||tmpl==="split-v") sy=ch-40;
    const cx=cw/2, cy=sy+r1;

    // 왼쪽 반원 오렌지
    fc.add(new Fab.Path(`M ${cx} ${cy-r1} A ${r1} ${r1} 0 0 0 ${cx} ${cy+r1} Z`,
      {fill:"#E85D2C",selectable:false,evented:false,name:"logo"}));
    // 오른쪽 반원 틸
    fc.add(new Fab.Path(`M ${cx} ${cy-r1} A ${r1} ${r1} 0 0 1 ${cx} ${cy+r1} Z`,
      {fill:"#155855",selectable:false,evented:false,name:"logo"}));
    // 중간 링 왼쪽 옐로
    fc.add(new Fab.Path(`M ${cx} ${cy-r2} A ${r2} ${r2} 0 0 0 ${cx} ${cy+r2} Z`,
      {fill:"#EB8F22",selectable:false,evented:false,name:"logo"}));
    // 중간 링 오른쪽 세이지
    fc.add(new Fab.Path(`M ${cx} ${cy-r2} A ${r2} ${r2} 0 0 1 ${cx} ${cy+r2} Z`,
      {fill:"#569082",selectable:false,evented:false,name:"logo"}));
    // 중앙 흰 원
    fc.add(new Fab.Circle({
      left:cx,top:cy,radius:r3,fill:"rgba(255,255,255,0.95)",
      originX:"center",originY:"center",selectable:false,evented:false,name:"logo",
    }));
  }

  const handleToggleSymbol=()=>{
    const next=!showSymbol; setShowSymbol(next);
    if(next){ const{w,h}=getDims(); addSymbol(w,h,template); }
    else removeByName("logo");
    fabricRef.current?.renderAll();
  };

  // ── 필터 ─────────────────────────────────────────
  function applyFilter(img?:any){
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const target=img||imgRef.current; if(!target) return;
    const filters:any[]=[
      new Fab.Image.filters.Brightness({ brightness:(brightness-100)/100 }),
      new Fab.Image.filters.Contrast({   contrast:  (contrast-100)/100   }),
      new Fab.Image.filters.Saturation({ saturation:(saturation-100)/100 }),
    ];
    if(warmth!==0&&Fab.Image.filters.ColorMatrix){
      try{
        const w=warmth/50;
        const matrix=warmth>0
          ?[1+w*0.15,0,0,0,w*8, 0,1,0,0,0, 0,0,1-w*0.12,0,w*-4, 0,0,0,1,0]
          :[1+w*0.1,0,0,0,w*5, 0,1,0,0,0, 0,0,1-w*0.15,0,w*-6, 0,0,0,1,0];
        filters.push(new Fab.Image.filters.ColorMatrix({matrix}));
      }catch(e){ console.warn("[filter]",e); }
    }
    target.filters=filters;
    try{ target.applyFilters(); }catch(e){ target.filters=[]; }
    fabricRef.current?.renderAll();
  }

  // ── 텍스트 배치 ──────────────────────────────────
  function placeText(main:string, sub?:string, micro?:string){
    const Fab=getFab(); if(!Fab||!fabricRef.current){ showToast("에디터 준비 중"); return; }
    const {w:cw,h:ch}=getDims();
    const fp=FONT_PAIRS[fontPair];
    removeTexts();

    // 템플릿별 텍스트 위치
    let topM:number, topS:number, topMicro:number, leftX:number, wLimit:number;
    switch(template){
      case "photo-bottom":
        topM    = ch*(photoPct/100)+22;
        topS    = topM+fontSize*lineH+8;
        topMicro= topS+subFontSize*lineH+10;
        leftX   = textAlign==="center"?cw/2:36;
        wLimit  = cw-60;
        break;
      case "photo-top":{
        const textH=ch*(1-photoPct/100);
        topM    = textH*0.28;
        topS    = topM+fontSize*lineH+12;
        topMicro= topS+subFontSize*lineH+10;
        leftX   = textAlign==="center"?cw/2:36;
        wLimit  = cw-60;
        break;
      }
      case "text-only":
        topM    = ch*0.32;
        topS    = topM+fontSize*lineH+16;
        topMicro= topS+subFontSize*lineH+12;
        leftX   = textAlign==="center"?cw/2:36;
        wLimit  = cw-60;
        break;
      case "split-v":
        topM    = ch*0.63;
        topS    = topM+fontSize*lineH+10;
        topMicro= topS+subFontSize*lineH+8;
        leftX   = 40;
        wLimit  = cw-60;
        break;
      case "photo-overlay":
        topM    = ch*0.55;
        topS    = topM+fontSize*lineH+10;
        topMicro= topS+subFontSize*lineH+8;
        leftX   = textAlign==="center"?cw/2:36;
        wLimit  = cw-60;
        break;
      default:
        topM=ch*0.6; topS=topM+60; topMicro=topS+30;
        leftX=textAlign==="center"?cw/2:36; wLimit=cw-60;
    }

    const shadow = (template==="photo-overlay"||template==="split-v"||template==="frame")
      ? "rgba(0,0,0,0.45) 0 2px 8px" : undefined;
    const oX = textAlign==="center"?"center":"left";

    if(main) fabricRef.current.add(new Fab.IText(main,{
      left:leftX, top:topM, originX:oX,
      fontSize, fill:textColor,
      fontFamily:`'${fp.display}',serif,sans-serif`,
      fontWeight:"700", textAlign, width:wLimit,
      lineHeight:lineH, charSpacing:letterSp*10,
      shadow, name:"main-text",
    }));
    if(sub) fabricRef.current.add(new Fab.IText(sub,{
      left:leftX, top:topS, originX:oX,
      fontSize:subFontSize, fill:subTextColor,
      fontFamily:`'${fp.body}',sans-serif`,
      fontWeight:"400", textAlign, width:wLimit,
      lineHeight:lineH, charSpacing:letterSp*10,
      shadow, name:"sub-text",
    }));
    if(micro) fabricRef.current.add(new Fab.IText(micro,{
      left:leftX, top:topMicro, originX:oX,
      fontSize:Math.max(9,subFontSize-4), fill:UI.hint,
      fontFamily:`'${fp.body}',sans-serif`,
      fontWeight:"400", textAlign, width:wLimit,
      name:"micro-text",
    }));
    fabricRef.current.renderAll();
    saveUndoState();
    showToast("텍스트 적용 ✓ · 더블클릭 편집");
  }

  // ── 도형 삽입 ─────────────────────────────────────
  function addShape(type:"rect"|"circle"|"line"|"triangle"){
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const {w:cw,h:ch}=getDims();
    const common={left:cw/2,top:ch/2,originX:"center",originY:"center",
                  fill:"transparent",stroke:accentColor,strokeWidth:2};
    let obj:any;
    if(type==="rect")     obj=new Fab.Rect({...common,width:120,height:80,rx:4});
    if(type==="circle")   obj=new Fab.Circle({...common,radius:55});
    if(type==="triangle") obj=new Fab.Triangle({...common,width:100,height:86});
    if(type==="line")     obj=new Fab.Line([0,0,cw*0.35,0],
      {left:cw/2,top:ch*0.65,stroke:accentColor,strokeWidth:1.5,originX:"center",originY:"center"});
    if(obj){ fabricRef.current.add(obj); fabricRef.current.setActiveObject(obj); fabricRef.current.renderAll(); saveUndoState(); }
  }

  // ── 편집 도구 ─────────────────────────────────────
  function removeByName(name:string){
    fabricRef.current?.getObjects().filter((o:any)=>o.name===name).forEach((o:any)=>fabricRef.current.remove(o));
  }
  function removeTexts(){
    fabricRef.current?.getObjects().filter((o:any)=>
      ["main-text","sub-text","micro-text"].includes(o.name)||
      ((o.type==="i-text"||o.type==="text")&&!o.name?.startsWith("logo"))
    ).forEach((o:any)=>fabricRef.current.remove(o));
  }
  const addFreeText=()=>{
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const {w:cw,h:ch}=getDims();
    const fp=FONT_PAIRS[fontPair];
    const obj=new Fab.IText("텍스트",{left:cw/2,top:ch/2,originX:"center",originY:"center",
      fontSize,fill:textColor,fontFamily:`'${fp.display}',serif,sans-serif`,fontWeight:"700"});
    fabricRef.current.add(obj); fabricRef.current.setActiveObject(obj);
    fabricRef.current.renderAll(); obj.enterEditing(); saveUndoState();
  };
  const removeSelected=()=>{
    if(!fabricRef.current) return;
    const active=fabricRef.current.getActiveObjects();
    if(!active.length){ showToast("삭제할 객체 선택"); return; }
    active.forEach((o:any)=>fabricRef.current.remove(o));
    fabricRef.current.discardActiveObject(); fabricRef.current.renderAll(); saveUndoState();
  };
  const bringFwd =()=>{ const o=fabricRef.current?.getActiveObject(); if(o){fabricRef.current.bringForward(o);fabricRef.current.renderAll();} };
  const sendBwd  =()=>{ const o=fabricRef.current?.getActiveObject(); if(o){fabricRef.current.sendBackwards(o);fabricRef.current.renderAll();} };
  const duplicate=()=>{
    const o=fabricRef.current?.getActiveObject(); if(!o) return;
    o.clone((c:any)=>{ c.set({left:o.left+18,top:o.top+18}); fabricRef.current.add(c); fabricRef.current.renderAll(); saveUndoState(); });
  };

  // ── AI 캡션 ───────────────────────────────────────
  const generateCaption=async()=>{
    setGenerating(true);
    try{
      const res=await fetch("/api/caption",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contentType,dept,tone,customNote}),
      });
      const data=await res.json();
      if(!data.ok) throw new Error(data.error||"생성 실패");
      setCaptions(data.captions||[]); setHashtags(data.hashtags||""); setSelIdx(0); setIsMock(!!data.mock);
      showToast(data.mock?"샘플 데이터 (API 키 미설정)":"캡션 생성 완료!");
    }catch(e:any){ showToast("생성 실패: "+e.message); }
    finally{ setGenerating(false); }
  };

  // ── 다운로드 ─────────────────────────────────────
  const download=(fmt:"png"|"jpeg")=>{
    if(!fabricRef.current){ showToast("에디터가 준비되지 않았습니다"); return; }
    fabricRef.current.discardActiveObject(); fabricRef.current.renderAll();
    const url=fabricRef.current.toDataURL({format:fmt,quality:0.95,multiplier:2});
    const a=document.createElement("a"); a.href=url;
    a.download=`photoclinic_${ratio.replace(":","x")}_${Date.now()}.${fmt==="jpeg"?"jpg":"png"}`;
    a.click(); showToast("다운로드 완료 ✓");
  };

  const {w:cw,h:ch}=getDims();

  // ── UI ───────────────────────────────────────────
  const iS:React.CSSProperties={
    width:"100%",border:`1px solid ${UI.border}`,borderRadius:7,
    padding:"7px 10px",fontSize:12,fontFamily:"inherit",
    background:UI.surface,color:UI.txt,outline:"none",
  };
  const bS=(active?:boolean,color?:string):React.CSSProperties=>({
    border:`1.5px solid ${active?(color||UI.accent):UI.border}`,borderRadius:8,
    background:active?(color?hexToRgba(color,0.12):"#FFF5F2"):UI.surface,
    color:active?(color||UI.accent):UI.muted,
    fontSize:11,fontWeight:700,cursor:"pointer",padding:"6px 10px",
    fontFamily:"inherit",transition:"all .15s",
  });

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:UI.bg,color:UI.txt,fontFamily:"'Noto Sans KR',sans-serif"}}>

      {/* ── NAV ── */}
      <nav style={{background:UI.surface,borderBottom:`1px solid ${UI.border}`,height:54,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 8px rgba(21,88,85,.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {/* 포토클리닉 로고 심볼 */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" fill="#E85D2C"/>
            <circle cx="14" cy="14" r="13" fill="#155855" clipPath="url(#nc)"/>
            <defs><clipPath id="nc"><rect x="14" y="0" width="14" height="28"/></clipPath></defs>
            <circle cx="14" cy="14" r="8.5" fill="#EB8F22"/>
            <circle cx="14" cy="14" r="8.5" fill="#569082" clipPath="url(#nc)"/>
            <circle cx="14" cy="14" r="4" fill="white"/>
          </svg>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:UI.teal,letterSpacing:.5}}>PHOTO CLINIC</div>
            <div style={{fontSize:9,color:UI.hint,letterSpacing:.06}}>인스타그램 디자인 생성기</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {!fabricReady&&<span style={{fontSize:11,color:UI.accent,background:"#FFF5F2",padding:"3px 10px",borderRadius:20}}>초기화 중...</span>}
          <button onClick={undo} disabled={!canUndo} title="⌘Z" style={{...bS(false),opacity:canUndo?1:.35,fontSize:13,padding:"4px 10px"}}>↩</button>
          <button onClick={redo} disabled={!canRedo} title="⌘Y" style={{...bS(false),opacity:canRedo?1:.35,fontSize:13,padding:"4px 10px"}}>↪</button>
          <div style={{width:1,height:20,background:UI.border,margin:"0 2px"}}/>
          <button onClick={addFreeText}              style={bS(false)}>+ 텍스트</button>
          <button onClick={()=>addShape("rect")}     style={bS(false)}>□</button>
          <button onClick={()=>addShape("circle")}   style={bS(false)}>○</button>
          <button onClick={()=>addShape("line")}     style={bS(false)}>—</button>
          <button onClick={duplicate}                style={bS(false)}>복제</button>
          <button onClick={bringFwd}                 style={bS(false)}>앞</button>
          <button onClick={sendBwd}                  style={bS(false)}>뒤</button>
          <button onClick={removeSelected}           style={{...bS(false),color:"#C04020",borderColor:"#FACCB8"}}>삭제</button>
          <div style={{width:1,height:20,background:UI.border,margin:"0 2px"}}/>
          <button onClick={handleToggleSymbol} style={bS(showSymbol,UI.teal)}>심볼 {showSymbol?"✓":""}</button>
          <div style={{width:1,height:20,background:UI.border,margin:"0 2px"}}/>
          <button onClick={()=>download("png")}  style={{...bS(true,UI.teal),color:UI.teal}}>PNG ↓</button>
          <button onClick={()=>download("jpeg")} style={bS(false)}>JPG ↓</button>
        </div>
      </nav>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── 왼쪽 패널 ── */}
        <aside style={{width:288,background:UI.panel,borderRight:`1px solid ${UI.border}`,overflowY:"auto",flexShrink:0}}>

          {/* 탭 */}
          <div style={{display:"flex",borderBottom:`1px solid ${UI.border}`,background:UI.surface}}>
            {([["layout","레이아웃"],["text","텍스트·AI"],["filter","필터"]] as const).map(([k,l])=>(
              <button key={k} onClick={()=>setActiveTool(k as typeof activeTool)}
                style={{flex:1,height:38,border:"none",background:"transparent",
                        color:activeTool===k?UI.teal:UI.hint,fontSize:11,fontWeight:700,
                        cursor:"pointer",fontFamily:"inherit",
                        borderBottom:activeTool===k?`2.5px solid ${UI.teal}`:"none"}}>
                {l}
              </button>
            ))}
          </div>

          <div style={{padding:"14px 13px"}}>

          {/* ── 레이아웃 탭 ── */}
          {activeTool==="layout" && <>

            <Sec label="사진 업로드" accent={UI.accent}>
              <div onClick={()=>fileRef.current?.click()}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer.files[0]; if(f)loadImage(f); }}
                style={{border:`2px dashed ${imageLoaded?UI.teal:UI.border}`,borderRadius:10,
                        padding:"14px 8px",textAlign:"center",cursor:"pointer",background:UI.surface,transition:"all .2s"}}>
                <div style={{fontSize:13,color:imageLoaded?UI.teal:UI.hint,fontWeight:700}}>
                  {imageLoaded?"✓ 이미지 로드됨":"클릭 또는 드래그"}
                </div>
                <div style={{fontSize:10,color:UI.hint,marginTop:3}}>JPG · PNG · WEBP · 10MB</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
                onChange={e=>{if(e.target.files?.[0]){loadImage(e.target.files[0]);e.target.value="";}}}/>
            </Sec>

            <Sec label="비율" accent={UI.accent}>
              <div style={{display:"flex",gap:6}}>
                {RATIOS.map(r=>(
                  <button key={r.key} onClick={()=>handleRatio(r.key)}
                    style={{flex:1,padding:"8px 4px",border:`1.5px solid ${ratio===r.key?UI.teal:UI.border}`,
                            borderRadius:9,background:ratio===r.key?"#EAF4F2":UI.surface,cursor:"pointer",fontFamily:"inherit"}}>
                    <div style={{width:r.key==="1:1"?18:r.key==="4:5"?14:10,height:18,
                                 border:`2px solid ${ratio===r.key?UI.teal:UI.hint}`,borderRadius:2,margin:"0 auto 4px"}}/>
                    <div style={{fontSize:9,fontWeight:700,color:ratio===r.key?UI.teal:UI.muted}}>{r.label}</div>
                  </button>
                ))}
              </div>
            </Sec>

            <Sec label="레이아웃 스타일" accent={UI.accent}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {TEMPLATES.map(t=>(
                  <button key={t.key} onClick={()=>handleTemplate(t.key)}
                    style={{padding:"9px 8px",border:`1.5px solid ${template===t.key?UI.accent:UI.border}`,
                            borderRadius:9,background:template===t.key?"#FFF5F2":UI.surface,
                            cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s"}}>
                    <div style={{fontSize:11,fontWeight:700,color:template===t.key?UI.accent:UI.txt}}>{t.name}</div>
                    <div style={{fontSize:9,color:UI.hint,marginTop:2,lineHeight:1.4}}>{t.desc}</div>
                  </button>
                ))}
              </div>
              {(template==="photo-bottom"||template==="photo-top")&&(
                <div style={{marginTop:10}}>
                  <div style={{fontSize:10,color:UI.muted,marginBottom:5}}>사진 비율 {photoPct}%</div>
                  <input type="range" min={30} max={80} value={photoPct}
                    onChange={e=>{ setPhotoPct(+e.target.value); if(imgRef.current&&fabricRef.current){ const{w,h}=getDims(); applyLayout(imgRef.current,template,w,h); fabricRef.current.renderAll(); } }}
                    style={{width:"100%",accentColor:UI.teal}}/>
                </div>
              )}
            </Sec>

            <Sec label="배경 색상" accent={UI.accent}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                {[CANVAS_BG,"#FFFFFF","#1C2B28",MINT_BG,"#F0EBE0","#2A1A0A"].map(hex=>(
                  <div key={hex} onClick={()=>{ setCanvasBg(hex); fabricRef.current?.setBackgroundColor(hex,()=>fabricRef.current.renderAll()); }}
                    style={{width:26,height:26,borderRadius:6,background:hex,
                            border:`2px solid ${canvasBg===hex?UI.teal:"rgba(0,0,0,.1)"}`,cursor:"pointer",
                            transform:canvasBg===hex?"scale(1.15)":"scale(1)",transition:"all .15s",
                            boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #DCE8E5":"none"}}/>
                ))}
                <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:2}}>
                  <label style={{fontSize:10,color:UI.muted}}>직접</label>
                  <input type="color" value={canvasBg} onChange={e=>{ setCanvasBg(e.target.value); fabricRef.current?.setBackgroundColor(e.target.value,()=>fabricRef.current.renderAll()); }}
                    style={{width:26,height:22,border:"none",borderRadius:4,cursor:"pointer"}}/>
                </div>
              </div>
            </Sec>

            <Sec label="액센트 컬러" accent={UI.accent}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[PC_STYLE.brand.orange,PC_STYLE.brand.teal,PC_STYLE.brand.orange2,PC_STYLE.brand.teal2,"#9C6644","#2C2B35"].map(hex=>(
                  <div key={hex} onClick={()=>setAccentColor(hex)}
                    style={{width:24,height:24,borderRadius:"50%",background:hex,
                            border:`2px solid ${accentColor===hex?"#1C2B28":"transparent"}`,cursor:"pointer",
                            transform:accentColor===hex?"scale(1.2)":"scale(1)",transition:"all .15s"}}/>
                ))}
              </div>
            </Sec>

            <Sec label="팬톤 컬러" accent={UI.accent}>
              <button onClick={()=>setShowPantone(v=>!v)} style={{...bS(showPantone,UI.teal),width:"100%",marginBottom:8}}>
                {showPantone?"닫기 ▲":"팬톤 추천 ▼"}
              </button>
              {showPantone&&<>
                <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
                  {PANTONE_PALETTES.map((p,i)=>(
                    <button key={p.name} onClick={()=>setActivePal(i)}
                      style={{fontSize:9,padding:"3px 7px",border:`1px solid ${activePal===i?UI.accent:UI.border}`,
                              borderRadius:5,background:activePal===i?"#FFF5F2":UI.surface,
                              color:activePal===i?UI.accent:UI.muted,cursor:"pointer",fontFamily:"inherit"}}>
                      {p.name}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {PANTONE_PALETTES[activePal].colors.map(c=>(
                    <div key={c.hex} onClick={()=>{ setTextColor(c.hex); setAccentColor(c.hex); }}
                      title={`${c.label}`}
                      style={{flex:1,height:36,borderRadius:6,background:c.hex,cursor:"pointer",
                              border:`2px solid ${textColor===c.hex?"#1C2B28":"transparent"}`,transition:"all .15s"}}/>
                  ))}
                </div>
                <div style={{display:"flex",gap:4,marginTop:4}}>
                  {PANTONE_PALETTES[activePal].colors.map(c=>(
                    <div key={c.hex} style={{flex:1,textAlign:"center",fontSize:8,color:UI.muted,lineHeight:1.3}}>{c.label}</div>
                  ))}
                </div>
              </>}
            </Sec>
          </>}

          {/* ── 텍스트·AI 탭 ── */}
          {activeTool==="text" && <>

            <Sec label="콘텐츠 유형" accent={UI.accent}>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {CONTENT_TYPES.map(ct=>(
                  <button key={ct.key} onClick={()=>setContentType(ct.key)}
                    style={{padding:"5px 8px",border:`1.5px solid ${contentType===ct.key?UI.accent:UI.border}`,
                            borderRadius:7,background:contentType===ct.key?"#FFF5F2":UI.surface,
                            color:contentType===ct.key?UI.accent:UI.txt,fontSize:11,fontWeight:600,
                            cursor:"pointer",fontFamily:"inherit"}}>
                    {ct.emoji} {ct.label}
                  </button>
                ))}
              </div>
            </Sec>

            <Sec label="캡션" accent={UI.accent}>
              <div style={{display:"flex",gap:0,marginBottom:10,background:UI.bg,borderRadius:8,padding:3}}>
                {(["ai","manual"] as const).map(tab=>(
                  <button key={tab} onClick={()=>setActiveTab(tab)}
                    style={{flex:1,height:27,border:"none",borderRadius:6,
                            background:activeTab===tab?UI.surface:"transparent",
                            color:activeTab===tab?UI.txt:UI.hint,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    {tab==="ai"?"AI 생성":"직접 입력"}
                  </button>
                ))}
              </div>

              {activeTab==="ai"?(
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  <select value={dept} onChange={e=>setDept(e.target.value)} style={iS}>
                    <option value="">진료과목 선택</option>
                    {DEPTS.map(d=><option key={d}>{d}</option>)}
                  </select>
                  <select value={tone} onChange={e=>setTone(e.target.value)} style={iS}>
                    {TONES.map(t=><option key={t}>{t}</option>)}
                  </select>
                  <textarea value={customNote} onChange={e=>setCustomNote(e.target.value)}
                    placeholder="추가 참고사항" rows={2}
                    style={{...iS,resize:"vertical",minHeight:50}}/>
                  <button onClick={generateCaption} disabled={generating}
                    style={{height:38,background:generating?UI.hint:UI.accent,color:"#fff",border:"none",
                            borderRadius:9,fontSize:12,fontWeight:700,cursor:generating?"not-allowed":"pointer",
                            fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                    {generating?<><Spin color="#fff"/><span>생성 중...</span></>:"스토리 캡션 생성"}
                  </button>
                  {isMock&&<div style={{fontSize:10,color:"#C8860A",background:"#FDF5E0",borderRadius:7,padding:"5px 9px"}}>샘플 · API 키 설정 시 실제 생성</div>}
                  {captions.length>0&&<>
                    {captions.map((cap,i)=>(
                      <div key={i} onClick={()=>setSelIdx(i)}
                        style={{border:`1.5px solid ${selIdx===i?UI.accent:UI.border}`,borderRadius:9,padding:"8px 11px",
                                cursor:"pointer",background:selIdx===i?"#FFF5F2":UI.surface}}>
                        <div style={{fontSize:9,fontWeight:700,color:UI.accent,marginBottom:3}}>{cap.type}</div>
                        <div style={{fontSize:11,lineHeight:1.65,color:UI.txt,whiteSpace:"pre-line",maxHeight:110,overflowY:"auto"}}>{cap.text}</div>
                      </div>
                    ))}
                    <div style={{fontSize:10,color:UI.teal,lineHeight:1.7,wordBreak:"break-all",padding:"4px 0"}}>{hashtags}</div>
                    <button onClick={()=>placeText(captions[selIdx].text)}
                      style={{height:34,background:UI.teal,color:"#fff",border:"none",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      캔버스에 적용
                    </button>
                  </>}
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{fontSize:10,color:UI.muted,marginBottom:2}}>메인 텍스트 (크게)</div>
                  <textarea value={mainText} onChange={e=>setMainText(e.target.value)} rows={3}
                    placeholder="예: 포토클리닉을&#10;병원이미지를 만드는&#10;브랜딩회사로 만들고 싶습니다"
                    style={{...iS,resize:"vertical"}}/>
                  <div style={{fontSize:10,color:UI.muted,marginBottom:2}}>서브 텍스트 (작게)</div>
                  <textarea value={subText} onChange={e=>setSubText(e.target.value)} rows={2}
                    placeholder="예: 사진을 잘 찍는다는 말씀보다&#10;병원이미지를 잘 담는다는 피드백이 더 좋습니다"
                    style={{...iS,resize:"vertical"}}/>
                  <div style={{fontSize:10,color:UI.muted,marginBottom:2}}>마이크로 텍스트 (더 작게)</div>
                  <input value={microText} onChange={e=>setMicroText(e.target.value)}
                    placeholder="예: 연세꿈꾸는치과교정과" style={iS}/>
                  <button onClick={()=>placeText(mainText,subText||undefined,microText||undefined)}
                    style={{height:36,background:UI.teal,color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    캔버스에 적용
                  </button>
                </div>
              )}
            </Sec>

            <Sec label="폰트 & 크기" accent={UI.accent}>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {FONT_PAIRS.map((fp,i)=>(
                  <button key={i} onClick={()=>setFontPair(i)}
                    style={{padding:"7px 10px",border:`1.5px solid ${fontPair===i?UI.teal:UI.border}`,
                            borderRadius:7,background:fontPair===i?"#EAF4F2":UI.surface,
                            color:fontPair===i?UI.teal:UI.txt,fontSize:11,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                    <span style={{fontFamily:`'${fp.display}',serif,sans-serif`,marginRight:6}}>{fp.display.split(" ")[0]}</span>
                    <span style={{fontSize:9,color:UI.hint}}>· {fp.label}</span>
                  </button>
                ))}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:6}}>
                  <div>
                    <div style={{fontSize:10,color:UI.muted,marginBottom:4}}>메인 {fontSize}px</div>
                    <input type="range" min={16} max={90} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{width:"100%",accentColor:UI.teal}}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:UI.muted,marginBottom:4}}>서브 {subFontSize}px</div>
                    <input type="range" min={10} max={36} value={subFontSize} onChange={e=>setSubFontSize(+e.target.value)} style={{width:"100%",accentColor:UI.teal}}/>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <label style={{fontSize:10,color:UI.muted,minWidth:42}}>줄간격</label>
                  <input type="range" min={10} max={25} value={Math.round(lineH*10)} onChange={e=>setLineH(+e.target.value/10)} style={{flex:1,accentColor:UI.teal}}/>
                  <span style={{fontSize:10,color:UI.muted,minWidth:24}}>{lineH.toFixed(1)}</span>
                </div>
                <div style={{display:"flex",gap:5}}>
                  {(["left","center","right"] as const).map(a=>(
                    <button key={a} onClick={()=>setTextAlign(a)}
                      style={{flex:1,height:28,border:`1.5px solid ${textAlign===a?UI.teal:UI.border}`,
                              borderRadius:6,background:textAlign===a?"#EAF4F2":UI.surface,
                              color:textAlign===a?UI.teal:UI.muted,fontSize:13,cursor:"pointer"}}>
                      {a==="left"?"←":a==="center"?"≡":"→"}
                    </button>
                  ))}
                </div>
              </div>
            </Sec>

            <Sec label="텍스트 색상" accent={UI.accent}>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:UI.muted,marginBottom:5}}>메인 텍스트</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[PC_STYLE.brand.orange,"#1C2B28","#FFFFFF",PC_STYLE.brand.teal,"#9C6644","#F5F0E8"].map(hex=>(
                    <div key={hex} onClick={()=>{ setTextColor(hex); fabricRef.current?.getObjects().forEach((o:any)=>{ if(o.name==="main-text"||(o.type==="i-text"&&!o.name?.startsWith("logo"))) o.set("fill",hex); }); fabricRef.current?.renderAll(); }}
                      style={{width:24,height:24,borderRadius:"50%",background:hex,
                              border:`2px solid ${textColor===hex?"#1C2B28":"rgba(0,0,0,.1)"}`,cursor:"pointer",
                              transform:textColor===hex?"scale(1.2)":"scale(1)",transition:"all .15s",
                              boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #DCE8E5":"none"}}/>
                  ))}
                  <input type="color" value={textColor} onChange={e=>setTextColor(e.target.value)} style={{width:24,height:24,border:"none",borderRadius:"50%",cursor:"pointer"}}/>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:UI.muted,marginBottom:5}}>서브 텍스트</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[UI.muted,UI.hint,"#1C2B28",PC_STYLE.brand.orange,"#FFFFFF"].map(hex=>(
                    <div key={hex} onClick={()=>setSubTextColor(hex)}
                      style={{width:24,height:24,borderRadius:"50%",background:hex,
                              border:`2px solid ${subTextColor===hex?"#1C2B28":"rgba(0,0,0,.1)"}`,cursor:"pointer",
                              transform:subTextColor===hex?"scale(1.2)":"scale(1)",transition:"all .15s",
                              boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #DCE8E5":"none"}}/>
                  ))}
                  <input type="color" value={subTextColor} onChange={e=>setSubTextColor(e.target.value)} style={{width:24,height:24,border:"none",borderRadius:"50%",cursor:"pointer"}}/>
                </div>
              </div>
            </Sec>
          </>}

          {/* ── 필터 탭 ── */}
          {activeTool==="filter" && <>
            <Sec label="사진 필터" accent={UI.accent}>
              <div style={{fontSize:10,color:UI.muted,marginBottom:10,lineHeight:1.6,background:"#EAF4F2",padding:"8px 10px",borderRadius:8}}>
                포토클리닉 프리셋: 따뜻한 필름 느낌<br/>
                밝기 -7 · 대비 +2 · 채도 -5 · 색온도 +15
              </div>
              {[
                {label:"밝기",  val:brightness, set:setBrightness, min:50,max:150,def:100},
                {label:"대비",  val:contrast,   set:setContrast,   min:50,max:150,def:100},
                {label:"채도",  val:saturation, set:setSaturation, min:0, max:200,def:95 },
                {label:"색온도",val:warmth,      set:setWarmth,     min:-50,max:50,def:0 },
              ].map(({label,val,set,min,max,def})=>(
                <div key={label} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <label style={{fontSize:11,color:UI.txt,fontWeight:600}}>{label}</label>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:10,color:UI.muted}}>{val}</span>
                      <button onClick={()=>set(def)}
                        style={{fontSize:9,color:UI.muted,background:UI.surface,border:`1px solid ${UI.border}`,borderRadius:4,padding:"1px 5px",cursor:"pointer"}}>
                        초기화
                      </button>
                    </div>
                  </div>
                  <input type="range" min={min} max={max} value={val} onChange={e=>set(+e.target.value)} style={{width:"100%",accentColor:UI.teal}}/>
                </div>
              ))}
              <button onClick={()=>{ setBrightness(93); setContrast(102); setSaturation(95); setWarmth(15); }}
                style={{...bS(true,UI.teal),width:"100%",marginTop:4,color:UI.teal}}>
                🎞 포토클리닉 필름 프리셋
              </button>
              <button onClick={()=>{ setBrightness(100); setContrast(100); setSaturation(95); setWarmth(0); }}
                style={{...bS(false),width:"100%",marginTop:6}}>
                기본값 초기화
              </button>
            </Sec>
          </>}

          </div>
        </aside>

        {/* ── 캔버스 ── */}
        <main style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"28px 24px",overflowY:"auto",background:UI.bg}}>
          <div style={{boxShadow:"0 6px 32px rgba(21,88,85,.12)",borderRadius:4,overflow:"hidden",position:"relative"}}>
            <canvas ref={canvasRef}/>
            {!fabricReady&&(
              <div style={{position:"absolute",inset:0,background:"rgba(229,240,238,.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
                <Spin size={32} color={UI.teal}/>
                <div style={{fontSize:12,color:UI.muted}}>에디터 초기화 중...</div>
              </div>
            )}
          </div>
          <div style={{fontSize:10,color:UI.hint,marginTop:10,textAlign:"center"}}>
            {cw}×{ch}px · {ratio} · 다운로드 2배 해상도 · ⌘Z 취소 · ⌘Y 다시실행
          </div>
        </main>
      </div>

      {/* 토스트 */}
      <div style={{position:"fixed",bottom:20,left:"50%",transform:`translateX(-50%) translateY(${toast?"0":"70px"})`,
                   background:UI.teal,color:"#fff",fontSize:12,padding:"9px 18px",borderRadius:20,
                   transition:"transform .3s",pointerEvents:"none",zIndex:999,fontWeight:600,whiteSpace:"nowrap"}}>
        {toast}
      </div>
    </div>
  );
}

function Sec({label,children,accent}:{label:string;children:React.ReactNode;accent:string}){
  return(
    <div style={{marginBottom:18,paddingBottom:16,borderBottom:`1px solid ${UI.border}`}}>
      <div style={{fontSize:9,fontWeight:800,color:UI.muted,textTransform:"uppercase",letterSpacing:".09em",marginBottom:9,display:"flex",alignItems:"center",gap:5}}>
        <span style={{width:4,height:4,borderRadius:"50%",background:accent,display:"inline-block"}}/>
        {label}
      </div>
      {children}
    </div>
  );
}

function Spin({size=14,color="#E85D2C"}:{size?:number;color?:string}){
  return(
    <div style={{width:size,height:size,
                 border:`${Math.max(2,Math.floor(size/7))}px solid rgba(0,0,0,.08)`,
                 borderTopColor:color,borderRadius:"50%",
                 animation:"spin .6s linear infinite",flexShrink:0}}/>
  );
}
