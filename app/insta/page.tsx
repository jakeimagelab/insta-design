"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { PANTONE_PALETTES, FONT_PAIRS, PC_STYLE } from "@/lib/photoclinic-style";

type Ratio       = "1:1"|"4:5"|"9:16";
type FitMode     = "contain"|"cover";
type Template    = "photo-bottom"|"photo-top"|"photo-overlay"|"text-only"|"split-v"|"frame";
type ContentType = "portfolio"|"bts"|"philosophy"|"space"|"profile";
type CaptionItem = { type:string; text:string };

const RATIOS = [
  { key:"1:1"  as Ratio, label:"1:1 피드",    w:540, h:540 },
  { key:"4:5"  as Ratio, label:"4:5 세로",    w:432, h:540 },
  { key:"9:16" as Ratio, label:"9:16 스토리", w:304, h:540 },
];
const TEMPLATES = [
  { key:"photo-bottom"  as Template, name:"사진↑ 텍스트↓", desc:"상단 사진+하단 크림" },
  { key:"photo-top"     as Template, name:"텍스트↑ 사진↓", desc:"상단 크림+하단 사진" },
  { key:"photo-overlay" as Template, name:"사진+텍스트 위", desc:"사진 전체+텍스트 오버레이" },
  { key:"text-only"     as Template, name:"텍스트 카드",    desc:"크림배경+중앙 텍스트" },
  { key:"split-v"       as Template, name:"세로 구분선",    desc:"컬러 바+텍스트" },
  { key:"frame"         as Template, name:"테두리 프레임",  desc:"사진+바깥 프레임" },
];
const CONTENT_TYPES: {key:ContentType;label:string;emoji:string}[] = [
  {key:"portfolio",label:"포트폴리오",emoji:"📸"},
  {key:"bts",label:"촬영 현장",emoji:"🎬"},
  {key:"philosophy",label:"철학·생각",emoji:"💭"},
  {key:"space",label:"공간 감성",emoji:"🏛"},
  {key:"profile",label:"의료진 프로필",emoji:"👤"},
];
const DEPTS=["피부과","성형외과","치과","안과","정형외과","한의원","산부인과","내과","정신건강의학과"];
const TONES=["따뜻·감성","다크·고급","모던·절제","클린·밝음"];
const UI={bg:"#EDF5F3",panel:"#F0F7F5",surface:"#FFFFFF",border:"#C8DDD9",
           accent:"#E85D2C",teal:"#155855",muted:"#5A7470",hint:"#9BB5B0",txt:"#1C2B28"};
const CANVAS_BG="#F5F0E8";

export default function InstaDesignerPage() {
  const [ratio,       setRatio]      = useState<Ratio>("4:5");
  const [template,    setTemplate]   = useState<Template>("photo-bottom");
  const [textColor,   setTextColor]  = useState(PC_STYLE.brand.orange);
  const [subColor,    setSubColor]   = useState(UI.muted);
  const [fontPair,    setFontPair]   = useState(0);
  const [fontSize,    setFontSize]   = useState(32);
  const [subFontSize, setSubFontSize]= useState(16);
  const [lineH,       setLineH]      = useState(1.4);
  const [letterSp,    setLetterSp]   = useState(0);
  const [textAlign,   setTextAlign]  = useState<"left"|"center"|"right">("left");
  const [showSymbol,  setShowSymbol] = useState(true);
  const [accentColor, setAccentColor]= useState(PC_STYLE.brand.orange);
  const [canvasBg,    setCanvasBg]   = useState(CANVAS_BG);
  const [contentBg,   setContentBg]  = useState(CANVAS_BG);
  const [photoPct,    setPhotoPct]   = useState(60);
  const [photoZoom,   setPhotoZoom]  = useState(100);
  const [photoOpacity,setPhotoOpacity]= useState(100);
  const [photoFit,    setPhotoFit]   = useState<FitMode>("contain"); // contain=사진 전체 보이기, cover=영역 채우기
  const [shapeStyle,  setShapeStyle] = useState<"stroke"|"fill"|"both">("stroke");
  const [shapeStrokeColor,setShapeStrokeColor]=useState(PC_STYLE.brand.orange);
  const [shapeFillColor,setShapeFillColor]=useState(PC_STYLE.brand.teal2);
  const [shapeOpacity,setShapeOpacity]=useState(100);
  // 세로 구분선 전용
  const [dividerColor,setDividerColor]=useState(PC_STYLE.brand.orange);

  const [contentType, setContentType]= useState<ContentType>("portfolio");
  const [dept,setDept]=useState("");
  const [tone,setTone]=useState("따뜻·감성");
  const [customNote,setCustomNote]=useState("");
  const [generating,setGenerating]=useState(false);
  const [captions,setCaptions]=useState<CaptionItem[]>([]);
  const [hashtags,setHashtags]=useState("");
  const [selIdx,setSelIdx]=useState(0);
  const [isMock,setIsMock]=useState(false);

  const [mainText,setMainText]=useState("");
  const [subText,setSubText]=useState("");
  const [microText,setMicroText]=useState("");
  const [activeTab,setActiveTab]=useState<"ai"|"manual">("ai");
  const [activeTool,setActiveTool]=useState<"layout"|"text"|"shape"|"filter">("layout");

  // ── AI 디자인 생성 ───────────────────────────────────
  const [aiDesignPrompt,setAiDesignPrompt]=useState("");
  const [aiDesigning,setAiDesigning]=useState(false);
  const [aiRationale,setAiRationale]=useState("");

  // ── 피드 그리드 미리보기 ─────────────────────────────
  const [showFeedGrid,setShowFeedGrid]=useState(false);
  const [feedSlots,setFeedSlots]=useState<(string|null)[]>(Array(9).fill(null));
  const [feedCurrentSlot,setFeedCurrentSlot]=useState(4); // 기본 중앙 슬롯

  // ── 캐러셀 ───────────────────────────────────────────
  type CarouselSlide={id:number;thumb:string;hires:string;label:string};
  const [carouselSlides,setCarouselSlides]=useState<CarouselSlide[]>([]);
  const [showCarousel,setShowCarousel]=useState(false);
  const slideIdRef=useRef(0);

  // ── 콘텐츠 아이디어 AI ───────────────────────────────
  type ContentIdea={day:string;type:string;emoji:string;title:string;hook:string;caption:string;hashtags:string;designHint:string};
  const [showIdeas,setShowIdeas]=useState(false);
  const [ideaDept,setIdeaDept]=useState("");
  const [ideaStyle,setIdeaStyle]=useState("따뜻·감성");
  const [ideaCount,setIdeaCount]=useState(5);
  const [ideas,setIdeas]=useState<ContentIdea[]>([]);
  const [ideaLoading,setIdeaLoading]=useState(false);
  const [ideaMock,setIdeaMock]=useState(false);

  // ── 브랜드 키트 ──────────────────────────────────────
  type BrandKit={
    id:string; name:string; createdAt:number;
    // 컬러
    canvasBg:string; contentBg:string; textColor:string; subColor:string; accentColor:string; dividerColor:string;
    // 폰트·타이포
    fontPair:number; fontSize:number; subFontSize:number; lineH:number; letterSp:number; textAlign:"left"|"center"|"right";
    // 레이아웃
    template:Template; ratio:Ratio; photoFit:FitMode; photoPct:number; photoZoom:number;
  };
  const BRAND_KIT_KEY="pc_brand_kits_v1";
  const loadKitsFromStorage=():BrandKit[]=>{
    try{ return JSON.parse(localStorage.getItem(BRAND_KIT_KEY)||"[]"); }catch{ return []; }
  };
  const [brandKits,setBrandKits]=useState<BrandKit[]>(()=>typeof window!=="undefined"?loadKitsFromStorage():[]);
  const [showBrandKit,setShowBrandKit]=useState(false);
  const [kitNameInput,setKitNameInput]=useState("");

  // ── Undo/Redo: ref로 관리해서 stale closure 완전 방지 ──
  const undoRef   = useRef<string[]>([]);
  const redoRef   = useRef<string[]>([]);
  const isRestoringRef = useRef(false); // 복원 중 플래그
  const [canUndo,setCanUndo]=useState(false);
  const [canRedo,setCanRedo]=useState(false);

  const [brightness,setBrightness]=useState(100);
  const [contrast,setContrast]=useState(100);
  const [saturation,setSaturation]=useState(95);
  const [warmth,setWarmth]=useState(0);

  const [toast,setToast]=useState("");
  const [imageLoaded,setImageLoaded]=useState(false);
  const [fabricReady,setFabricReady]=useState(false);
  const [showPantone,setShowPantone]=useState(false);
  const [activePal,setActivePal]=useState(0);
  // 회전 각도 표시
  const [rotAngle,setRotAngle]=useState<number|null>(null);
  // 선택된 텍스트 실시간 편집
  const [selectedIsText,setSelectedIsText]=useState(false);
  // canvas→state 동기화 중 플래그 (useEffect stale-loop 방지)
  const syncingFromCanvas=useRef(false);

  const canvasRef=useRef<HTMLCanvasElement>(null);
  const fabricRef=useRef<any>(null);
  const imgRef=useRef<any>(null);
  const imgElRef=useRef<any>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  // fitArea가 계산한 자동 중앙 위치를 기억 → 사용자 오프셋 보존에 사용
  const lastFitPositionRef=useRef<{left:number;top:number}|null>(null);

  const showToast=useCallback((msg:string)=>{setToast(msg);setTimeout(()=>setToast(""),2500);},[]);

  // ── Fabric.js 로드 ──────────────────────────────────
  useEffect(()=>{
    if(typeof window==="undefined") return;
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
    s.onload=()=>setFabricReady(true);
    s.onerror=()=>showToast("Fabric.js 로드 실패 — 새로고침");
    document.head.appendChild(s);
    return ()=>{ try{fabricRef.current?.dispose();}catch{} };
  },[]); // eslint-disable-line

  useEffect(()=>{
    if(fabricReady&&canvasRef.current) initFabric(ratio);
  },[fabricReady]); // eslint-disable-line

  // ── filter 디바운스 ref ──────────────────────────────
  const filterRafRef=useRef<number|null>(null);
  const layoutRafRef=useRef<number|null>(null);

  // 필터: useEffect 내에서 직접 RAF — scheduleFilter useCallback은 stale closure 문제가 있어 제거
  useEffect(()=>{
    if(!imageLoaded) return;
    if(filterRafRef.current!=null) cancelAnimationFrame(filterRafRef.current);
    filterRafRef.current=requestAnimationFrame(()=>{ filterRafRef.current=null; applyFilter(); });
  },[brightness,contrast,saturation,warmth,imageLoaded]); // eslint-disable-line
  useEffect(()=>{
    if(imgRef.current){
      imgRef.current.set("opacity", photoOpacity/100);
      fabricRef.current?.renderAll();
    }
  },[photoOpacity]);

  // ── 선택된 텍스트 실시간 반영 ──────────────────────────
  // canvas→state 동기화 중에는 skip (무한루프 방지)
  function getSelText(){
    const o=fabricRef.current?.getActiveObject();
    return (o&&["i-text","textbox","text"].includes(o.type))?o:null;
  }
  useEffect(()=>{
    if(syncingFromCanvas.current) return;
    const o=getSelText(); if(!o) return;
    o.set({fontSize}); o.setCoords(); fabricRef.current?.renderAll();
  },[fontSize]); // eslint-disable-line
  useEffect(()=>{
    if(syncingFromCanvas.current) return;
    const o=getSelText(); if(!o) return;
    o.set({fill:textColor}); fabricRef.current?.renderAll();
  },[textColor]); // eslint-disable-line
  useEffect(()=>{
    if(syncingFromCanvas.current) return;
    const o=getSelText(); if(!o) return;
    const fp=FONT_PAIRS[fontPair];
    const fam=o.name?.includes("sub")||o.name?.includes("micro")
      ?`'${fp.body}',sans-serif`:`'${fp.display}',serif,sans-serif`;
    o.set({fontFamily:fam}); fabricRef.current?.renderAll();
  },[fontPair]); // eslint-disable-line
  useEffect(()=>{
    if(syncingFromCanvas.current) return;
    const o=getSelText(); if(!o) return;
    o.set({textAlign,originX:textAlign==="center"?"center":"left"});
    fabricRef.current?.renderAll();
  },[textAlign]); // eslint-disable-line
  useEffect(()=>{
    if(syncingFromCanvas.current) return;
    const o=getSelText(); if(!o) return;
    o.set({lineHeight:lineH}); fabricRef.current?.renderAll();
  },[lineH]); // eslint-disable-line
  useEffect(()=>{
    if(syncingFromCanvas.current) return;
    const o=getSelText(); if(!o) return;
    o.set({charSpacing:letterSp*10}); fabricRef.current?.renderAll();
  },[letterSp]); // eslint-disable-line

  function getFab():any{ return typeof window!=="undefined"?(window as any).fabric:null; }
  function getDims(r:Ratio=ratio){ return RATIOS.find(x=>x.key===r)||RATIOS[0]; }
  function hexToRgba(hex:string,a:number){
    const rv=parseInt(hex.slice(1,3),16),gv=parseInt(hex.slice(3,5),16),bv=parseInt(hex.slice(5,7),16);
    return `rgba(${rv},${gv},${bv},${a})`;
  }

  function initFabric(r:Ratio=ratio){
    const Fab=getFab(); if(!Fab||!canvasRef.current) return;
    try{fabricRef.current?.dispose();}catch{}
    const {w,h}=getDims(r);
    fabricRef.current=new Fab.Canvas(canvasRef.current,{
      width:w, height:h,
      backgroundColor:canvasBg,
      preserveObjectStacking:true,
      renderOnAddRemove: false,   // add/remove 시 자동 렌더 끔 → 수동 renderAll로 일괄 처리
      skipOffscreen: true,        // 화면 밖 객체 스킵
      enablePointerEvents: true,
      perPixelTargetFind: false,  // true이면 픽셀 검사로 느려짐, false = bbox 기반 (빠름)
      targetFindTolerance: 4,     // 클릭 영역 여유 4px
      centeredScaling: false,
      centeredRotation: true,
      uniformScaling: false,      // shift 누를 때만 uniform
      // 캔버스 컨텍스트 힌트
      contextAttributes: { willReadFrequently: false, alpha: false },
    });

    // 더블클릭 텍스트 편집
    fabricRef.current.on("mouse:dblclick",(opt:any)=>{
      if(opt.target?.type==="i-text") opt.target.enterEditing();
    });

    // 드래그 중 RAF 스로틀링 — 과도한 renderAll 방지
    let movingRaf:number|null=null;
    fabricRef.current.on("object:moving",()=>{
      if(movingRaf!=null) return; // 이전 RAF 대기 중이면 skip
      movingRaf=requestAnimationFrame(()=>{
        movingRaf=null;
        fabricRef.current?.renderAll();
      });
    });

    // ── 핵심: 복원 중이 아닐 때만 undo 스택 저장 ──
    const onModified=()=>{
      if(isRestoringRef.current) return;
      const json=JSON.stringify(fabricRef.current.toJSON(["name","clipPath"]));
      undoRef.current=[...undoRef.current.slice(-29),json];
      redoRef.current=[];
      setCanUndo(undoRef.current.length>0);
      setCanRedo(false);
    };
    fabricRef.current.on("object:modified",onModified);
    fabricRef.current.on("object:added",   onModified);
    fabricRef.current.on("object:removed", onModified);

    // ── 회전 각도 표시 + 스내핑 ──
    fabricRef.current.on("object:rotating",(opt:any)=>{
      const obj=opt.target; if(!obj) return;
      // angle을 0~359 범위로 정규화
      let angle=((obj.angle % 360) + 360) % 360;
      // 90도 스내핑 (±5도 범위)
      const snaps=[0,90,180,270];
      let snapped=false;
      for(const s of snaps){
        if(Math.abs(angle-s)<5){
          angle=s;
          obj.set({angle});
          obj.setCoords();
          snapped=true;
          break;
        }
      }
      // 359~360 → 0 처리 (270+5 이상은 0으로)
      if(!snapped && angle>355){ angle=0; obj.set({angle}); obj.setCoords(); }
      if(snapped) fabricRef.current?.renderAll();
      setRotAngle(Math.round(angle));
    });
    fabricRef.current.on("mouse:up",()=>{ setRotAngle(null); });

    // ── 텍스트 선택 시 패널 동기화 ──
    const syncTextFromCanvas=(obj:any)=>{
      const isText=["i-text","textbox","text"].includes(obj?.type);
      setSelectedIsText(isText);
      if(!isText) return;
      setActiveTool("text");
      syncingFromCanvas.current=true;
      if(obj.fontSize!=null)    setFontSize(Math.round(obj.fontSize));
      if(obj.fill)              setTextColor(obj.fill as string);
      if(obj.textAlign)         setTextAlign(obj.textAlign as "left"|"center"|"right");
      if(obj.lineHeight!=null)  setLineH(obj.lineHeight);
      if(obj.charSpacing!=null) setLetterSp(obj.charSpacing/10);
      const fam=obj.fontFamily??"";
      const idx=FONT_PAIRS.findIndex(fp=>fam.includes(fp.display));
      if(idx>=0) setFontPair(idx);
      requestAnimationFrame(()=>{ syncingFromCanvas.current=false; });
    };
    fabricRef.current.on("selection:created",(opt:any)=>{
      if(opt.selected?.length===1) syncTextFromCanvas(opt.selected[0]);
      else setSelectedIsText(false);
    });
    fabricRef.current.on("selection:updated",(opt:any)=>{
      if(opt.selected?.length===1) syncTextFromCanvas(opt.selected[0]);
      else setSelectedIsText(false);
    });
    fabricRef.current.on("selection:cleared",()=>setSelectedIsText(false));
  }

  // ── Undo ────────────────────────────────────────────
  const undo=useCallback(()=>{
    if(!fabricRef.current||undoRef.current.length===0) return;
    // 현재 상태를 redo에 저장
    const cur=JSON.stringify(fabricRef.current.toJSON(["name","clipPath"]));
    redoRef.current=[...redoRef.current,cur];
    setCanRedo(true);
    // 이전 상태 복원
    const prev=undoRef.current[undoRef.current.length-1];
    undoRef.current=undoRef.current.slice(0,-1);
    setCanUndo(undoRef.current.length>0);
    isRestoringRef.current=true;
    fabricRef.current.loadFromJSON(JSON.parse(prev),()=>{
      refreshImageRef();
      ensureFixedOrder();
      isRestoringRef.current=false;
    });
  },[]); // eslint-disable-line

  const redo=useCallback(()=>{
    if(!fabricRef.current||redoRef.current.length===0) return;
    const cur=JSON.stringify(fabricRef.current.toJSON(["name","clipPath"]));
    undoRef.current=[...undoRef.current,cur];
    setCanUndo(true);
    const nxt=redoRef.current[redoRef.current.length-1];
    redoRef.current=redoRef.current.slice(0,-1);
    setCanRedo(redoRef.current.length>0);
    isRestoringRef.current=true;
    fabricRef.current.loadFromJSON(JSON.parse(nxt),()=>{
      refreshImageRef();
      ensureFixedOrder();
      isRestoringRef.current=false;
    });
  },[]); // eslint-disable-line

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const tag=(e.target as HTMLElement)?.tagName;
      if(tag==="INPUT"||tag==="TEXTAREA") return;
      if((e.metaKey||e.ctrlKey)&&e.key==="z"&&!e.shiftKey){e.preventDefault();undo();}
      if((e.metaKey||e.ctrlKey)&&(e.key==="y"||(e.key==="z"&&e.shiftKey))){e.preventDefault();redo();}
      if(e.key==="Backspace"||e.key==="Delete") removeSelected();
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[undo,redo]);

  // ── 비율 변경 ────────────────────────────────────────
  const handleRatio=(r:Ratio)=>{
    setRatio(r);
    if(!fabricRef.current) return;
    const {w,h}=getDims(r);
    fabricRef.current.setWidth(w);
    fabricRef.current.setHeight(h);

    // 비율 변경 시 현재 사진을 새 캔버스 영역에 다시 맞춤.
    // 기존 코드는 cover 방식이라 1:1→4:5, 4:5→9:16 변경 시 사진 일부가 잘렸음.
    refreshImageRef();
    if(imgRef.current) applyLayout(imgRef.current,template,w,h,true,photoFit,photoPct,photoZoom);
    ensureFixedOrder();
  };

  function refreshImageRef(){
    const photo=fabricRef.current?.getObjects().find((o:any)=>o.name==="photo"||o.type==="image");
    if(photo) imgRef.current=photo;
  }

  function ensureFixedOrder(){
    const fc=fabricRef.current; if(!fc) return;
    const objs=fc.getObjects?.()||[];
    const logos=objs.filter((o:any)=>o.name==="logo");
    logos.forEach((o:any)=>fc.bringToFront(o));
    fc.renderAll();
  }

  function getLogoState(){
    const logo=fabricRef.current?.getObjects?.().find((o:any)=>o.name==="logo");
    if(!logo) return null;
    return {left:logo.left, top:logo.top, scaleX:logo.scaleX, scaleY:logo.scaleY, angle:logo.angle};
  }

  function makeFreshImage(img?:any){
    const Fab=getFab();
    const el=imgElRef.current || img?._element;
    if(!Fab || !el) return img;
    return new Fab.Image(el,{
      noScaleCache: false,
      objectCaching: true,  // 캐시 사용 → 드래그 시 GPU 재활용
    });
  }

  // ── 이미지 스케일 ───────────────────────────────────
  // contain: 사진 전체가 보이게 맞춤 / cover: 영역을 꽉 채움
  // userDeltaX/Y: 사용자가 드래그로 이동한 오프셋 (중앙 기준)
  function fitArea(img:any, cw:number, areaTop:number, areaH:number, mode:FitMode=photoFit, areaLeft=0, areaW=cw, zoomPct:number=photoZoom, userDeltaX=0, userDeltaY=0){
    const _el = imgElRef.current || img.getElement?.() || img._element;
    // naturalWidth/Height 우선, 없으면 img.width/height (0이면 1로 방어)
    const iw = Math.max(1, _el?.naturalWidth  || _el?.width  || img.width  || img._originalElement?.naturalWidth  || 1);
    const ih = Math.max(1, _el?.naturalHeight || _el?.height || img.height || img._originalElement?.naturalHeight || 1);
    const safeAreaW = Math.max(1, areaW);
    const safeAreaH = Math.max(1, areaH);
    const baseScale = mode==="cover"
      ? Math.max(safeAreaW / iw, safeAreaH / ih)
      : Math.min(safeAreaW / iw, safeAreaH / ih);
    const scale = baseScale * (zoomPct/100);
    const sw = iw * scale;
    const sh = ih * scale;
    const autoLeft = areaLeft + (safeAreaW - sw) / 2;
    const autoTop  = areaTop  + (safeAreaH - sh) / 2;
    // 자동 중앙 위치 기록 (사용자 오프셋 보존에 사용)
    lastFitPositionRef.current = { left: autoLeft, top: autoTop };
    img.set({
      name: "photo",
      width: iw,
      height: ih,
      cropX: 0,
      cropY: 0,
      scaleX: scale,
      scaleY: scale,
      left:  autoLeft + userDeltaX,
      top:   autoTop  + userDeltaY,
      selectable: true,
      evented: true,
      objectCaching: true,
      noScaleCache: false,
      opacity: photoOpacity/100,
    });
    img.setCoords();
  }

  // ── 레이아웃 적용 ────────────────────────────────────
  // photo-bottom/photo-top: overlay rect으로 사진 영역 밖을 덮음 (clipPath 방식 제거)
  // Fabric.js 5.x에서 clipPath + objectCaching:true 조합이 충돌하여 이미지가 잘리는 버그 존재.
  // preserveObjectStacking:true 덕분에 overlay rect은 항상 이미지 위에 유지됨 → 시각적으로 동일.
  // keepOffset=true: 사용자가 드래그한 위치 오프셋 유지 (photoPct·zoom·contentBg 변경 시)
  function applyLayout(img:any, tmpl:Template, cw:number, ch:number, keepLogo?:boolean, fitMode:FitMode=photoFit, pct:number=photoPct, zoomPct:number=photoZoom, keepOffset?:boolean){
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const fc=fabricRef.current;
    const logoState=keepLogo!==false ? getLogoState() : null;

    // 캔버스 클리어 전에 사용자 이동 오프셋 저장
    let userDeltaX=0, userDeltaY=0;
    if(keepOffset && imgRef.current && lastFitPositionRef.current){
      userDeltaX=(imgRef.current.left??0)-lastFitPositionRef.current.left;
      userDeltaY=(imgRef.current.top??0)-lastFitPositionRef.current.top;
    }

    // text-only가 아닐 때만 이미지 복사
    const freshImg = tmpl!=="text-only" ? makeFreshImage(img) : img;
    if(freshImg) img = freshImg;

    // clipPath 제거 (이전 이미지에 남아있을 수 있으므로 명시적 초기화)
    if(img) img.clipPath = undefined;

    // 클리어 후 배경 설정
    fc.clear();
    fc.setBackgroundColor(canvasBg,()=>{});

    if(tmpl==="photo-bottom"){
      const photoH=Math.round(ch*(pct/100));
      const textH=ch-photoH;
      fitArea(img,cw,0,photoH,fitMode,0,cw,zoomPct,userDeltaX,userDeltaY);
      fc.add(img);
      // 하단 크림 배경 — 이미지 위에 쌓여 사진 영역 밖 오버플로우를 덮음
      // evented:true + selectable:false → 텍스트 영역 클릭이 이미지로 전달되지 않음
      fc.add(new Fab.Rect({left:-2,top:photoH-1,width:cw+4,height:textH+2,
        fill:contentBg,selectable:false,evented:true,name:"layout-bg"}));

    } else if(tmpl==="photo-top"){
      const photoH=Math.round(ch*(pct/100));
      const textH=ch-photoH;
      fitArea(img,cw,textH,photoH,fitMode,0,cw,zoomPct,userDeltaX,userDeltaY);
      fc.add(img);
      // 상단 크림 배경 — 이미지 위에 쌓여 텍스트 영역 오버플로우를 덮음
      fc.add(new Fab.Rect({left:-2,top:0,width:cw+4,height:textH+1,
        fill:contentBg,selectable:false,evented:true,name:"layout-bg"}));

    } else if(tmpl==="photo-overlay"){
      fitArea(img,cw,0,ch,fitMode,0,cw,zoomPct,userDeltaX,userDeltaY);
      fc.add(img);

    } else if(tmpl==="text-only"){
      // 사진 없이 텍스트만 — img는 추가하지 않음

    } else if(tmpl==="split-v"){
      fitArea(img,cw,0,ch,fitMode,0,cw,zoomPct,userDeltaX,userDeltaY);
      fc.add(img);
      // 하단 크림 오버레이
      fc.add(new Fab.Rect({left:-2,top:ch*0.58,width:cw+4,height:ch*0.42,
        fill:hexToRgba(contentBg,0.92),selectable:false,evented:false,name:"layout-bg"}));
      // 세로 구분선 — selectable:true 로 이동 가능
      fc.add(new Fab.Rect({left:28,top:ch*0.64,width:2.5,height:ch*0.22,
        fill:dividerColor,selectable:true,evented:true,name:"divider",
        hasControls:true,hasBorders:false,lockScalingX:true}));

    } else if(tmpl==="frame"){
      fitArea(img,cw,0,ch,fitMode,0,cw,zoomPct,userDeltaX,userDeltaY);
      fc.add(img);
      const pad=10;
      // 사진 위에 프레임(배경색) 테두리
      fc.add(new Fab.Rect({left:-2,top:0,width:cw+4,height:pad,fill:contentBg,selectable:false,evented:false,name:"layout-bg"}));
      fc.add(new Fab.Rect({left:-2,top:ch-pad,width:cw+4,height:pad,fill:contentBg,selectable:false,evented:false,name:"layout-bg"}));
      fc.add(new Fab.Rect({left:0,top:0,width:pad,height:ch,fill:contentBg,selectable:false,evented:false,name:"layout-bg"}));
      fc.add(new Fab.Rect({left:cw-pad,top:0,width:pad,height:ch,fill:contentBg,selectable:false,evented:false,name:"layout-bg"}));
    }

    if(tmpl!=="text-only" && img){
      imgRef.current = img;
      applyFilter(img);
    }

    // 로고 심볼 복원 또는 새로 추가
    if(showSymbol) addSymbol(cw,ch,logoState);
    ensureFixedOrder();
    // renderOnAddRemove:false이므로 명시적 renderAll
    fabricRef.current.renderAll();
  }

  const handleTemplate=(tmpl:Template)=>{
    setTemplate(tmpl);
    if(!fabricRef.current) return;
    const {w,h}=getDims();
    if(tmpl==="text-only"){
      const logoState=getLogoState();
      fabricRef.current.clear();
      fabricRef.current.setBackgroundColor(canvasBg,()=>{});
      if(showSymbol) addSymbol(w,h,logoState);
      ensureFixedOrder();
    } else if(imgRef.current){
      applyLayout(imgRef.current,tmpl,w,h,true,photoFit,photoPct,photoZoom);
      ensureFixedOrder();
    } else {
      const logoState=getLogoState();
      fabricRef.current.clear();
      fabricRef.current.setBackgroundColor(canvasBg,()=>{});
      if(showSymbol) addSymbol(w,h,logoState);
      ensureFixedOrder();
    }
  };

  // ── 이미지 업로드 ────────────────────────────────────
  // fromURL 대신 HTMLImageElement 직접 생성 → new Fab.Image(el) 방식
  // 이렇게 해야 naturalWidth/Height가 100% 보장됨
  const loadImage=useCallback((file:File)=>{
    if(file.size>10*1024*1024){showToast("10MB 이하만 가능");return;}
    if(!fabricReady){showToast("에디터 초기화 중...");return;}
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;

    // ObjectURL 사용 → FileReader보다 빠르고 메모리 효율적
    const objectUrl=URL.createObjectURL(file);
    const el=new window.Image();
    // crossOrigin 없이 objectURL은 동일 origin이므로 taint 없음
    el.decoding="async"; // 비동기 디코딩으로 메인스레드 블로킹 방지
    el.onload=()=>{
      // decode() 완료 후 naturalWidth 보장
      (el.decode ? el.decode() : Promise.resolve()).then(()=>{
        imgElRef.current = el;
        const img=new Fab.Image(el,{
          noScaleCache: false,
          objectCaching: true,  // 드래그 성능 향상
        });
        const {w,h}=getDims();
        // keepOffset:false — 신규 업로드이므로 위치 초기화
        applyLayout(img,template,w,h,true,photoFit,photoPct,photoZoom,false);
        // imgRef.current 및 applyFilter는 applyLayout 내부에서 이미 처리됨
        setImageLoaded(true);
        showToast("이미지 업로드 완료 ✓");
      }).catch(()=>showToast("이미지 디코드 실패 — 다른 파일로 시도해주세요"));
    };
    el.onerror=()=>showToast("이미지 로드 실패 — 다른 파일로 시도해주세요");
    el.src=objectUrl;
    // URL은 onload 콜백 이후에도 el이 살아있으므로 컴포넌트 언마운트 시 해제
    // (단순 에디터 용도에서는 페이지 수명과 동일하므로 허용)
  },[fabricReady,template,ratio,photoPct,photoZoom,photoOpacity,photoFit,showSymbol,canvasBg,contentBg,dividerColor]); // eslint-disable-line

  // ── 포토클리닉 심볼 ──────────────────────────────────
  function addSymbol(cw:number,ch:number, state?:{left:number;top:number;scaleX:number;scaleY:number;angle:number}|null){
    removeByName("logo");
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const r1=14,r2=9,r3=4;
    const cx=cw/2, cy=ch-38;
    const parts=[
      new Fab.Path(`M ${0} ${-r1} A ${r1} ${r1} 0 0 0 ${0} ${r1} Z`, {fill:"#E85D2C"}),
      new Fab.Path(`M ${0} ${-r1} A ${r1} ${r1} 0 0 1 ${0} ${r1} Z`, {fill:"#155855"}),
      new Fab.Path(`M ${0} ${-r2} A ${r2} ${r2} 0 0 0 ${0} ${r2} Z`, {fill:"#EB8F22"}),
      new Fab.Path(`M ${0} ${-r2} A ${r2} ${r2} 0 0 1 ${0} ${r2} Z`, {fill:"#569082"}),
      new Fab.Circle({left:0,top:0,radius:r3,fill:"rgba(255,255,255,0.95)",originX:"center",originY:"center"})
    ];
    const group=new Fab.Group(parts,{
      left:state?.left ?? cx,
      top:state?.top ?? cy,
      scaleX:state?.scaleX ?? 1,
      scaleY:state?.scaleY ?? 1,
      angle:state?.angle ?? 0,
      originX:"center",
      originY:"center",
      name:"logo",
      selectable:true,
      evented:true,
      hasControls:true,
      lockScalingFlip:true
    });
    fabricRef.current.add(group);
  }

  const handleToggleSymbol=()=>{
    const next=!showSymbol; setShowSymbol(next);
    if(next){const{w,h}=getDims();addSymbol(w,h);}
    else removeByName("logo");
    ensureFixedOrder();
  };

  // ── 필터 ─────────────────────────────────────────────
  function applyFilter(img?:any){
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const target=img||imgRef.current; if(!target) return;
    const filters:any[]=[
      new Fab.Image.filters.Brightness({brightness:(brightness-100)/100}),
      new Fab.Image.filters.Contrast({contrast:(contrast-100)/100}),
      new Fab.Image.filters.Saturation({saturation:(saturation-100)/100}),
    ];
    if(warmth!==0&&Fab.Image.filters.ColorMatrix){
      try{
        const wn=warmth/50;
        const matrix=warmth>0
          ?[1+wn*0.15,0,0,0,wn*8, 0,1,0,0,0, 0,0,1-wn*0.12,0,wn*-4, 0,0,0,1,0]
          :[1+wn*0.1,0,0,0,wn*5, 0,1,0,0,0, 0,0,1-wn*0.15,0,wn*-6, 0,0,0,1,0];
        filters.push(new Fab.Image.filters.ColorMatrix({matrix}));
      }catch(err){console.warn("[filter]",err);}
    }
    target.filters=filters;
    try{target.applyFilters();}catch(err){target.filters=[];}
    fabricRef.current?.renderAll();
  }

  // ── 텍스트 배치 ─────────────────────────────────────
  function placeText(main:string,sub?:string,micro?:string){
    const Fab=getFab(); if(!Fab||!fabricRef.current){showToast("에디터 준비 중");return;}
    const {w:cw,h:ch}=getDims();
    const fp=FONT_PAIRS[fontPair];
    removeTexts();
    let topM:number,topS:number,topMicro:number;
    let leftX=textAlign==="center"?cw/2:36;
    const wLimit=cw-60;
    const oX=textAlign==="center"?"center":"left";
    switch(template){
      case "photo-bottom": {const ph=ch*(photoPct/100); topM=ph+20; topS=topM+fontSize*lineH+10; topMicro=topS+subFontSize*lineH+8; break;}
      case "photo-top":    {const th=ch*(1-photoPct/100); topM=th*0.28; topS=topM+fontSize*lineH+10; topMicro=topS+subFontSize*lineH+8; break;}
      case "text-only":     topM=ch*0.32; topS=topM+fontSize*lineH+14; topMicro=topS+subFontSize*lineH+10; break;
      case "split-v":      leftX=44; topM=ch*0.63; topS=topM+fontSize*lineH+8; topMicro=topS+subFontSize*lineH+6; break;
      default:              topM=ch*0.55; topS=topM+fontSize*lineH+10; topMicro=topS+subFontSize*lineH+8;
    }
    const shadow=(template==="photo-overlay")?"rgba(0,0,0,0.45) 0 2px 8px":undefined;
    if(main) fabricRef.current.add(new Fab.IText(main,{
      left:leftX,top:topM,originX:oX,fontSize,fill:textColor,
      fontFamily:`'${fp.display}',serif,sans-serif`,fontWeight:"700",
      textAlign,width:wLimit,lineHeight:lineH,charSpacing:letterSp*10,shadow,name:"main-text",
    }));
    if(sub) fabricRef.current.add(new Fab.IText(sub,{
      left:leftX,top:topS,originX:oX,fontSize:subFontSize,fill:subColor,
      fontFamily:`'${fp.body}',sans-serif`,fontWeight:"400",
      textAlign,width:wLimit,lineHeight:lineH,charSpacing:letterSp*10,shadow,name:"sub-text",
    }));
    if(micro) fabricRef.current.add(new Fab.IText(micro,{
      left:leftX,top:topMicro,originX:oX,fontSize:Math.max(9,subFontSize-4),fill:UI.hint,
      fontFamily:`'${fp.body}',sans-serif`,fontWeight:"400",textAlign,width:wLimit,name:"micro-text",
    }));
    ensureFixedOrder();
    showToast("텍스트 적용 ✓ · 더블클릭으로 편집");
  }

  // ── 도형 삽입 ────────────────────────────────────────
  function isShapeObject(o:any){
    return ["rect","circle","triangle","line","path"].includes(o?.type);
  }
  function applyShapeStyleToObject(obj:any){
    if(!obj) return;
    if(obj.type==="line"){
      obj.set({stroke:shapeStrokeColor,strokeWidth:2,opacity:shapeOpacity/100});
      return;
    }
    if(shapeStyle==="stroke"){
      obj.set({stroke:shapeStrokeColor,strokeWidth:2,fill:"transparent",opacity:shapeOpacity/100});
    }else if(shapeStyle==="fill"){
      obj.set({stroke:"transparent",strokeWidth:0,fill:shapeFillColor,opacity:shapeOpacity/100});
    }else{
      obj.set({stroke:shapeStrokeColor,strokeWidth:2,fill:shapeFillColor,opacity:shapeOpacity/100});
    }
  }
  type ShapeType="rect"|"roundrect"|"circle"|"triangle"|"line"|"star"|"hexagon"|"pentagon"|"arrow"|"cross";
  function addShape(type:ShapeType){
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const {w:cw,h:ch}=getDims();
    const cx=cw/2, cy=ch/2;
    let obj:any;
    if(type==="rect")      obj=new Fab.Rect({left:cx,top:cy,originX:"center",originY:"center",width:120,height:80,rx:0});
    if(type==="roundrect") obj=new Fab.Rect({left:cx,top:cy,originX:"center",originY:"center",width:120,height:80,rx:18,ry:18});
    if(type==="circle")    obj=new Fab.Circle({left:cx,top:cy,originX:"center",originY:"center",radius:55});
    if(type==="triangle")  obj=new Fab.Triangle({left:cx,top:cy,originX:"center",originY:"center",width:100,height:86});
    if(type==="line")      obj=new Fab.Line([0,0,cw*0.35,0],{left:cx,top:cy,originX:"center",originY:"center"});
    // Path 기반 도형 (originX/Y:"center"로 중앙 배치)
    const paths:Record<string,string>={
      star:    "M 0,-50 L 11.76,-16.18 L 47.55,-15.45 L 19.09,6.18 L 29.39,40.45 L 0,20 L -29.39,40.45 L -19.09,6.18 L -47.55,-15.45 L -11.76,-16.18 Z",
      hexagon: "M 43.3,-25 L 43.3,25 L 0,50 L -43.3,25 L -43.3,-25 L 0,-50 Z",
      pentagon:"M 0,-50 L 47.55,-15.45 L 29.39,40.45 L -29.39,40.45 L -47.55,-15.45 Z",
      arrow:   "M -50,-15 L 10,-15 L 10,-35 L 50,0 L 10,35 L 10,15 L -50,15 Z",
      cross:   "M -15,-50 L 15,-50 L 15,-15 L 50,-15 L 50,15 L 15,15 L 15,50 L -15,50 L -15,15 L -50,15 L -50,-15 L -15,-15 Z",
    };
    if(paths[type]) obj=new Fab.Path(paths[type],{left:cx,top:cy,originX:"center",originY:"center"});
    if(obj){
      applyShapeStyleToObject(obj);
      fabricRef.current.add(obj);
      fabricRef.current.setActiveObject(obj);
      ensureFixedOrder();
    }
  }

  // ── 편집 도구 ────────────────────────────────────────
  function removeByName(name:string){
    fabricRef.current?.getObjects().filter((o:any)=>o.name===name).forEach((o:any)=>fabricRef.current.remove(o));
  }
  function removeTexts(){
    fabricRef.current?.getObjects().filter((o:any)=>
      ["main-text","sub-text","micro-text"].includes(o.name)
    ).forEach((o:any)=>fabricRef.current.remove(o));
  }
  const addFreeText=()=>{
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const {w:cw,h:ch}=getDims();
    const fp=FONT_PAIRS[fontPair];
    const obj=new Fab.IText("텍스트",{left:cw/2,top:ch/2,originX:"center",originY:"center",
      fontSize,fill:textColor,fontFamily:`'${fp.display}',serif,sans-serif`,fontWeight:"700"});
    fabricRef.current.add(obj);
    fabricRef.current.setActiveObject(obj);
    ensureFixedOrder();
    obj.enterEditing();
  };
  const removeSelected=()=>{
    if(!fabricRef.current) return;
    const active=fabricRef.current.getActiveObjects();
    if(!active.length){showToast("삭제할 객체 선택");return;}
    active.forEach((o:any)=>fabricRef.current.remove(o));
    fabricRef.current.discardActiveObject();
    ensureFixedOrder();
  };
  function selectedObjects(){
    const fc=fabricRef.current; if(!fc) return [];
    return fc.getActiveObjects?.() || (fc.getActiveObject()?[fc.getActiveObject()]:[]);
  }
  useEffect(()=>{
    const objs=selectedObjects().filter((o:any)=>isShapeObject(o));
    if(!objs.length) return;
    objs.forEach((o:any)=>applyShapeStyleToObject(o));
    fabricRef.current?.renderAll();
  },[shapeStyle,shapeStrokeColor,shapeFillColor,shapeOpacity]);
  function afterLayerChange(msg:string){
    fabricRef.current?.discardActiveObject();
    ensureFixedOrder();
    showToast(msg);
  }
  const bringFwd=()=>{
    const fc=fabricRef.current; const objs=selectedObjects(); if(!fc||!objs.length){showToast("배치할 콘텐츠를 선택해주세요");return;}
    objs.forEach((o:any)=>fc.bringForward(o));
    ensureFixedOrder();
  };
  const sendBwd =()=>{
    const fc=fabricRef.current; const objs=selectedObjects(); if(!fc||!objs.length){showToast("배치할 콘텐츠를 선택해주세요");return;}
    objs.forEach((o:any)=>fc.sendBackwards(o));
    ensureFixedOrder();
  };
  const bringFront=()=>{
    const fc=fabricRef.current; const objs=selectedObjects(); if(!fc||!objs.length){showToast("배치할 콘텐츠를 선택해주세요");return;}
    objs.forEach((o:any)=>fc.bringToFront(o));
    afterLayerChange("맨 앞으로 배치 ✓");
  };
  const sendBack=()=>{
    const fc=fabricRef.current; const objs=selectedObjects(); if(!fc||!objs.length){showToast("배치할 콘텐츠를 선택해주세요");return;}
    objs.forEach((o:any)=>fc.sendToBack(o));
    afterLayerChange("맨 뒤로 배치 ✓");
  };
  const applyCurrentShapeStyle=()=>{
    const objs=selectedObjects().filter((o:any)=>isShapeObject(o));
    if(!objs.length){showToast("적용할 도형을 선택해주세요");return;}
    objs.forEach((o:any)=>applyShapeStyleToObject(o));
    ensureFixedOrder();
    showToast("도형 스타일 적용 ✓");
  };
  const duplicate=()=>{
    const o=fabricRef.current?.getActiveObject();if(!o) return;
    o.clone((c:any)=>{c.set({left:o.left+18,top:o.top+18});fabricRef.current.add(c);ensureFixedOrder();});
  };
  const rotate90=()=>{
    const o=fabricRef.current?.getActiveObject();if(!o) return;
    const newAngle=((o.angle+90)%360);
    o.set({angle:newAngle});
    o.setCoords();
    ensureFixedOrder();
    fabricRef.current?.renderAll();
  };

  // ── AI 캡션 ──────────────────────────────────────────
  const generateCaption=async()=>{
    setGenerating(true);
    try{
      const res=await fetch("/api/caption",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contentType,dept,tone,customNote})});
      const data=await res.json();
      if(!data.ok) throw new Error(data.error||"생성 실패");
      setCaptions(data.captions||[]);setHashtags(data.hashtags||"");setSelIdx(0);setIsMock(!!data.mock);
      showToast(data.mock?"샘플 데이터":"캡션 생성 완료!");
    }catch(e:any){showToast("생성 실패: "+e.message);}
    finally{setGenerating(false);}
  };

  // ── 다운로드 ─────────────────────────────────────────
  const download=(fmt:"png"|"jpeg")=>{
    if(!fabricRef.current){showToast("에디터 준비 안 됨");return;}
    fabricRef.current.discardActiveObject();ensureFixedOrder();
    const url=fabricRef.current.toDataURL({format:fmt,quality:0.95,multiplier:2});
    const a=document.createElement("a");a.href=url;
    a.download=`photoclinic_${ratio.replace(":","x")}_${Date.now()}.${fmt==="jpeg"?"jpg":"png"}`;
    a.click();showToast("다운로드 완료 ✓");
  };

  const copyToClipboard=async()=>{
    if(!fabricRef.current){showToast("에디터 준비 안 됨");return;}
    fabricRef.current.discardActiveObject();ensureFixedOrder();
    const url=fabricRef.current.toDataURL({format:"png",quality:1,multiplier:2});
    try{
      const res=await fetch(url);
      const blob=await res.blob();
      await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]);
      showToast("클립보드에 복사됨 ✓");
    }catch{
      showToast("복사 실패 — 브라우저에서 권한 필요");
    }
  };

  // ── 콘텐츠 아이디어 함수 ─────────────────────────────
  const generateIdeas=async()=>{
    setIdeaLoading(true); setIdeas([]);
    try{
      const res=await fetch("/api/ideas",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({dept:ideaDept,style:ideaStyle,count:ideaCount}),
      });
      const data=await res.json();
      if(!data.ok) throw new Error(data.error||"API 오류");
      setIdeas(data.ideas||[]);
      setIdeaMock(!!data.mock);
    }catch(e:any){
      showToast("아이디어 생성 실패: "+e.message);
    }finally{
      setIdeaLoading(false);
    }
  };

  // 아이디어 카드에서 AI 디자인으로 바로 연결
  const useIdeaForDesign=(idea:ContentIdea)=>{
    setAiDesignPrompt(`${ideaDept||"병원"} ${idea.type} 포스트, ${idea.designHint}`);
    setMainText(idea.hook);
    setSubText(idea.title);
    setActiveTab("manual");
    setActiveTool("layout");
    setShowIdeas(false);
    showToast("아이디어를 디자인 프롬프트에 적용했습니다 ✓");
  };

  // ── 브랜드 키트 함수들 ───────────────────────────────
  const saveKit=()=>{
    const name=kitNameInput.trim();
    if(!name){showToast("병원 이름을 입력하세요");return;}
    const kit:BrandKit={
      id:Date.now().toString(), name, createdAt:Date.now(),
      canvasBg, contentBg, textColor, subColor, accentColor, dividerColor,
      fontPair, fontSize, subFontSize, lineH, letterSp, textAlign,
      template, ratio, photoFit, photoPct, photoZoom,
    };
    const updated=[kit,...brandKits];
    setBrandKits(updated);
    localStorage.setItem(BRAND_KIT_KEY,JSON.stringify(updated));
    setKitNameInput("");
    showToast(`"${name}" 저장 완료 ✓`);
  };

  const applyKit=(kit:BrandKit)=>{
    setCanvasBg(kit.canvasBg);   setContentBg(kit.contentBg);
    setTextColor(kit.textColor); setSubColor(kit.subColor);
    setAccentColor(kit.accentColor); setDividerColor(kit.dividerColor);
    setFontPair(kit.fontPair);   setFontSize(kit.fontSize);
    setSubFontSize(kit.subFontSize); setLineH(kit.lineH);
    setLetterSp(kit.letterSp);   setTextAlign(kit.textAlign);
    setTemplate(kit.template);   setPhotoFit(kit.photoFit);
    setPhotoPct(kit.photoPct);   setPhotoZoom(kit.photoZoom);
    // 비율 + 캔버스 크기
    if(kit.ratio!==ratio){
      setRatio(kit.ratio);
      const {w,h}=getDims(kit.ratio);
      fabricRef.current?.setWidth(w);
      fabricRef.current?.setHeight(h);
    }
    // 캔버스 배경 즉시 반영
    if(fabricRef.current){
      fabricRef.current.setBackgroundColor(kit.canvasBg,()=>{});
      const {w,h}=getDims(kit.ratio||ratio);
      if(imgRef.current){
        applyLayout(imgRef.current,kit.template,w,h,true,kit.photoFit,kit.photoPct,kit.photoZoom,false);
      } else {
        fabricRef.current.renderAll();
      }
    }
    showToast(`"${kit.name}" 적용 완료 ✓`);
    setShowBrandKit(false);
  };

  const deleteKit=(id:string)=>{
    const updated=brandKits.filter(k=>k.id!==id);
    setBrandKits(updated);
    localStorage.setItem(BRAND_KIT_KEY,JSON.stringify(updated));
  };

  const exportKits=()=>{
    const json=JSON.stringify(brandKits,null,2);
    const a=document.createElement("a");
    a.href="data:application/json;charset=utf-8,"+encodeURIComponent(json);
    a.download=`photoclinic_brandkits_${Date.now()}.json`;
    a.click();
  };

  const importKits=(file:File)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const parsed:BrandKit[]=JSON.parse(e.target?.result as string);
        const merged=[...parsed,...brandKits].filter((k,i,arr)=>arr.findIndex(x=>x.id===k.id)===i);
        setBrandKits(merged);
        localStorage.setItem(BRAND_KIT_KEY,JSON.stringify(merged));
        showToast(`${parsed.length}개 키트 가져오기 완료 ✓`);
      }catch{ showToast("파일 형식이 올바르지 않습니다"); }
    };
    reader.readAsText(file);
  };

  // ── 캐러셀 함수들 ────────────────────────────────────
  const addCarouselSlide=()=>{
    if(!fabricRef.current){showToast("캔버스 준비 안 됨");return;}
    fabricRef.current.discardActiveObject();
    ensureFixedOrder();
    const hires=fabricRef.current.toDataURL({format:"jpeg",quality:0.95,multiplier:2});
    const thumb=fabricRef.current.toDataURL({format:"jpeg",quality:0.7,multiplier:0.5});
    const id=++slideIdRef.current;
    const label=`슬라이드 ${carouselSlides.length+1}`;
    setCarouselSlides(prev=>[...prev,{id,thumb,hires,label}]);
    showToast(`슬라이드 ${carouselSlides.length+1} 추가됨 ✓`);
  };

  const removeCarouselSlide=(id:number)=>{
    setCarouselSlides(prev=>prev.filter(s=>s.id!==id));
  };

  const moveCarouselSlide=(id:number,dir:-1|1)=>{
    setCarouselSlides(prev=>{
      const idx=prev.findIndex(s=>s.id===id);
      if(idx<0) return prev;
      const next=[...prev];
      const target=idx+dir;
      if(target<0||target>=next.length) return prev;
      [next[idx],next[target]]=[next[target],next[idx]];
      return next;
    });
  };

  const updateSlide=(id:number)=>{
    if(!fabricRef.current){showToast("캔버스 준비 안 됨");return;}
    fabricRef.current.discardActiveObject();
    ensureFixedOrder();
    const hires=fabricRef.current.toDataURL({format:"jpeg",quality:0.95,multiplier:2});
    const thumb=fabricRef.current.toDataURL({format:"jpeg",quality:0.7,multiplier:0.5});
    setCarouselSlides(prev=>prev.map(s=>s.id===id?{...s,hires,thumb}:s));
    showToast("슬라이드 업데이트 ✓");
  };

  const downloadAllSlides=async()=>{
    if(carouselSlides.length===0){showToast("슬라이드가 없습니다");return;}
    showToast(`${carouselSlides.length}장 다운로드 중...`);
    for(let i=0;i<carouselSlides.length;i++){
      await new Promise<void>(resolve=>{
        setTimeout(()=>{
          const a=document.createElement("a");
          a.href=carouselSlides[i].hires;
          a.download=`photoclinic_carousel_${String(i+1).padStart(2,"0")}_${ratio.replace(":","x")}.jpg`;
          a.click();
          resolve();
        },i*400); // 브라우저 다운로드 간 간격
      });
    }
    setTimeout(()=>showToast("전체 다운로드 완료 ✓"),carouselSlides.length*400+200);
  };

  // ── 피드 그리드 미리보기 ─────────────────────────────
  const openFeedGrid=()=>{
    if(!fabricRef.current){showToast("캔버스 준비 안 됨");return;}
    fabricRef.current.discardActiveObject();
    ensureFixedOrder();
    const url=fabricRef.current.toDataURL({format:"jpeg",quality:0.85,multiplier:1});
    setFeedSlots(prev=>{
      const next=[...prev];
      next[feedCurrentSlot]=url;
      return next;
    });
    setShowFeedGrid(true);
  };

  const placeInSlot=(idx:number)=>{
    if(!fabricRef.current) return;
    fabricRef.current.discardActiveObject();
    ensureFixedOrder();
    const url=fabricRef.current.toDataURL({format:"jpeg",quality:0.85,multiplier:1});
    setFeedSlots(prev=>{const n=[...prev];n[idx]=url;return n;});
    setFeedCurrentSlot(idx);
  };

  const clearSlot=(idx:number,e:React.MouseEvent)=>{
    e.stopPropagation();
    setFeedSlots(prev=>{const n=[...prev];n[idx]=null;return n;});
    if(feedCurrentSlot===idx) setFeedCurrentSlot(4);
  };

  // ── AI 디자인 생성 함수 ──────────────────────────────
  const generateAiDesign=async()=>{
    if(!aiDesignPrompt.trim()){showToast("디자인 설명을 입력하세요");return;}
    setAiDesigning(true); setAiRationale("");
    try{
      const res=await fetch("/api/design",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({prompt:aiDesignPrompt,haPhoto:imageLoaded}),
      });
      const data=await res.json();
      if(!data.ok) throw new Error(data.error||"API 오류");

      // 1. 비율 변경
      if(data.ratio && data.ratio!==ratio){
        setRatio(data.ratio);
        const {w,h}=getDims(data.ratio);
        if(fabricRef.current){
          fabricRef.current.setWidth(w);
          fabricRef.current.setHeight(h);
        }
      }
      // 2. 상태 일괄 적용
      if(data.template)    setTemplate(data.template);
      if(data.canvasBg)    setCanvasBg(data.canvasBg);
      if(data.contentBg)   setContentBg(data.contentBg);
      if(data.textColor)   setTextColor(data.textColor);
      if(data.subColor)    setSubColor(data.subColor);
      if(data.accentColor) setAccentColor(data.accentColor);
      if(data.fontPairIdx!=null) setFontPair(data.fontPairIdx);
      if(data.fontSize)    setFontSize(data.fontSize);
      if(data.subFontSize) setSubFontSize(data.subFontSize);
      if(data.lineH)       setLineH(data.lineH);
      if(data.letterSp!=null) setLetterSp(data.letterSp);
      if(data.textAlign)   setTextAlign(data.textAlign);
      if(data.photoFit)    setPhotoFit(data.photoFit);
      if(data.photoPct)    setPhotoPct(data.photoPct);
      if(data.photoZoom)   setPhotoZoom(data.photoZoom);
      if(data.mainText)    setMainText(data.mainText);
      if(data.subText)     setSubText(data.subText);
      if(data.microText)   setMicroText(data.microText);
      if(data.rationale)   setAiRationale(data.rationale);

      // 3. 레이아웃 재적용 (상태 변경은 비동기이므로 직접 값 사용)
      const {w,h}=getDims(data.ratio||ratio);
      if(fabricRef.current){
        fabricRef.current.setBackgroundColor(data.canvasBg||canvasBg,()=>{});
        if(imgRef.current){
          // 임시 상태로 직접 applyLayout 호출
          const savedFit=photoFit; const savedPct=photoPct; const savedZoom=photoZoom;
          if(data.photoFit)  setPhotoFit(data.photoFit);
          if(data.photoPct)  setPhotoPct(data.photoPct);
          if(data.photoZoom) setPhotoZoom(data.photoZoom);
          applyLayout(imgRef.current,data.template||template,w,h,true,
            data.photoFit||savedFit, data.photoPct||savedPct, data.photoZoom||savedZoom, false);
        } else {
          // 사진 없으면 배경 컬러만 업데이트
          fabricRef.current.setBackgroundColor(data.canvasBg||canvasBg,()=>{
            fabricRef.current?.renderAll();
          });
          if(showSymbol){const lo=getLogoState();removeByName("logo");addSymbol(w,h,lo);}
          ensureFixedOrder();
        }
      }
      // 4. 텍스트 자동 적용 (텍스트 탭으로 전환)
      if(data.mainText||data.subText) setActiveTool("text");
      showToast(data.mock?"AI 디자인 적용 완료 (데모)":"AI 디자인 적용 완료 ✓");
    }catch(e:any){
      showToast("AI 디자인 생성 실패: "+e.message);
    }finally{
      setAiDesigning(false);
    }
  };

  const {w:cw,h:ch}=getDims();
  const iS:React.CSSProperties={width:"100%",border:`1px solid ${UI.border}`,borderRadius:7,
    padding:"7px 10px",fontSize:12,fontFamily:"inherit",background:UI.surface,color:UI.txt,outline:"none"};
  const bS=(on?:boolean,col?:string):React.CSSProperties=>({
    border:`1.5px solid ${on?(col||UI.accent):UI.border}`,borderRadius:8,
    background:on?(col?hexToRgba(col,0.1):"#FFF5F2"):UI.surface,
    color:on?(col||UI.accent):UI.muted,
    fontSize:11,fontWeight:700,cursor:"pointer",padding:"6px 10px",fontFamily:"inherit",transition:"all .15s",
  });

  return(
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:UI.bg,color:UI.txt,fontFamily:"'Noto Sans KR',sans-serif"}}>

      {/* ── NAV ── */}
      <nav style={{background:UI.surface,borderBottom:`1px solid ${UI.border}`,height:52,padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 6px rgba(21,88,85,.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="12" fill="#E85D2C"/>
            <circle cx="13" cy="13" r="12" fill="#155855" clipPath="url(#nc2)"/>
            <defs><clipPath id="nc2"><rect x="13" y="0" width="13" height="26"/></clipPath></defs>
            <circle cx="13" cy="13" r="8" fill="#EB8F22"/>
            <circle cx="13" cy="13" r="8" fill="#569082" clipPath="url(#nc2)"/>
            <circle cx="13" cy="13" r="3.5" fill="white"/>
          </svg>
          <span style={{fontSize:13,fontWeight:700,color:UI.teal,letterSpacing:.5}}>PHOTO CLINIC</span>
        </div>

        <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
          {!fabricReady&&<span style={{fontSize:10,color:UI.accent,background:"#FFF5F2",padding:"2px 8px",borderRadius:20}}>초기화중...</span>}

          {/* Undo / Redo */}
          <button onClick={undo} disabled={!canUndo} title="실행 취소 ⌘Z"
            style={{...bS(false),opacity:canUndo?1:.3,fontSize:14,padding:"3px 10px"}}>↩</button>
          <button onClick={redo} disabled={!canRedo} title="다시 실행 ⌘Y"
            style={{...bS(false),opacity:canRedo?1:.3,fontSize:14,padding:"3px 10px"}}>↪</button>

          <div style={{width:1,height:18,background:UI.border}}/>
          <button onClick={addFreeText} style={bS(false)}>+ 텍스트</button>
          <button onClick={()=>setActiveTool("shape")} style={bS(activeTool==="shape",UI.teal)}>+ 도형</button>
          <button onClick={duplicate}   style={bS(false)}>복제</button>
          <button onClick={rotate90}                 style={bS(false)}>↻90°</button>
          <button onClick={bringFront}               style={bS(false)}>맨앞</button>
          <button onClick={bringFwd}                 style={bS(false)}>앞</button>
          <button onClick={sendBwd}                  style={bS(false)}>뒤</button>
          <button onClick={sendBack}                 style={bS(false)}>맨뒤</button>
          <button onClick={removeSelected}           style={{...bS(false),color:"#C04020",borderColor:"#FACCB8"}}>삭제</button>
          <div style={{width:1,height:18,background:UI.border}}/>
          <button onClick={handleToggleSymbol} style={bS(showSymbol,UI.teal)}>심볼{showSymbol?" ✓":""}</button>
          <div style={{width:1,height:18,background:UI.border}}/>
          {/* 콘텐츠 아이디어 AI 버튼 */}
          <button onClick={()=>setShowIdeas(true)} style={bS(false)}>💡 아이디어</button>
          {/* 브랜드 키트 버튼 */}
          <button onClick={()=>setShowBrandKit(true)}
            style={{...bS(brandKits.length>0,UI.teal),position:"relative",paddingRight:brandKits.length>0?22:10}}>
            🎨 브랜드키트
            {brandKits.length>0&&(
              <span style={{position:"absolute",top:-4,right:-4,background:UI.teal,color:"#fff",
                            fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 5px",minWidth:16,textAlign:"center"}}>
                {brandKits.length}
              </span>
            )}
          </button>
          {/* 캐러셀 버튼 — 슬라이드 수 배지 표시 */}
          <button onClick={()=>setShowCarousel(true)}
            style={{...bS(carouselSlides.length>0,UI.teal),position:"relative",paddingRight:carouselSlides.length>0?22:10}}>
            🎞 캐러셀
            {carouselSlides.length>0&&(
              <span style={{position:"absolute",top:-4,right:-4,background:UI.accent,color:"#fff",
                            fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 5px",minWidth:16,textAlign:"center"}}>
                {carouselSlides.length}
              </span>
            )}
          </button>
          <div style={{width:1,height:18,background:UI.border}}/>
          <button onClick={()=>download("png")}  style={{...bS(true,UI.teal),color:UI.teal}}>PNG↓</button>
          <button onClick={()=>download("jpeg")} style={bS(false)}>JPG↓</button>
        </div>
      </nav>

      {/* 회전 각도 오버레이 */}
      {rotAngle!==null&&(
        <div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",
                     background:UI.teal,color:"#fff",fontSize:13,fontWeight:700,
                     padding:"6px 20px",borderRadius:20,zIndex:200,pointerEvents:"none",
                     boxShadow:"0 4px 16px rgba(21,88,85,.3)"}}>
          {rotAngle}° {rotAngle===0||rotAngle===90||rotAngle===180||rotAngle===270?"⚡ 스냅":""}
        </div>
      )}

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── 왼쪽 패널 ── */}
        <aside style={{width:286,background:UI.panel,borderRight:`1px solid ${UI.border}`,overflowY:"auto",flexShrink:0}}>
          <div style={{display:"flex",borderBottom:`1px solid ${UI.border}`,background:UI.surface}}>
            {([["layout","레이아웃"],["text","텍스트·AI"],["shape","도형"],["filter","필터"]] as const).map(([k,l])=>(
              <button key={k} onClick={()=>setActiveTool(k as typeof activeTool)}
                style={{flex:1,height:38,border:"none",background:"transparent",
                        color:activeTool===k?UI.teal:UI.hint,fontSize:11,fontWeight:700,
                        cursor:"pointer",fontFamily:"inherit",
                        borderBottom:activeTool===k?`2.5px solid ${UI.teal}`:"none"}}>
                {l}
              </button>
            ))}
          </div>

          <div style={{padding:"13px 12px"}}>

          {/* ── 레이아웃 탭 ── */}
          {activeTool==="layout"&&<>

            {/* AI 디자인 생성 */}
            <div style={{background:`linear-gradient(135deg,${UI.teal}18,${UI.accent}12)`,
                         border:`1.5px solid ${UI.teal}40`,borderRadius:12,padding:"14px 14px 12px",marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:800,color:UI.teal,letterSpacing:".08em",
                           textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:14}}>✦</span> AI 디자인 생성
              </div>
              <textarea
                value={aiDesignPrompt}
                onChange={e=>setAiDesignPrompt(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey))generateAiDesign();}}
                placeholder={"예: 피부과 병원, 고급스럽고 따뜻한 느낌\n또는: 치과 포트폴리오, 쿨하고 클린한 스타일"}
                rows={2}
                style={{width:"100%",border:`1px solid ${UI.teal}50`,borderRadius:8,padding:"8px 10px",
                        fontSize:11,fontFamily:"inherit",background:"rgba(255,255,255,0.7)",
                        color:UI.txt,outline:"none",resize:"none",lineHeight:1.5,
                        boxSizing:"border-box",marginBottom:8}}/>
              <button
                onClick={generateAiDesign}
                disabled={aiDesigning||!aiDesignPrompt.trim()}
                style={{width:"100%",padding:"9px",background:aiDesigning?"#9BB5B0":UI.teal,
                        color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,
                        cursor:aiDesigning||!aiDesignPrompt.trim()?"not-allowed":"pointer",
                        fontFamily:"inherit",transition:"background .2s",letterSpacing:".03em"}}>
                {aiDesigning?"✦ 디자인 생성 중...":"✦ AI 디자인 적용"}
              </button>
              {aiRationale&&(
                <div style={{marginTop:8,fontSize:10,color:UI.muted,lineHeight:1.5,
                             background:"rgba(255,255,255,0.6)",borderRadius:6,padding:"7px 9px",
                             borderLeft:`3px solid ${UI.teal}`}}>
                  {aiRationale}
                </div>
              )}
              <div style={{fontSize:9,color:UI.hint,marginTop:6,textAlign:"center"}}>
                ⌘Enter로 바로 생성 · 템플릿·컬러·폰트·텍스트 일괄 적용
              </div>
            </div>

            <Sec label="사진 업로드" accent={UI.accent}>
              <div onClick={()=>fileRef.current?.click()}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)loadImage(f);}}
                style={{border:`2px dashed ${imageLoaded?UI.teal:UI.border}`,borderRadius:10,
                        padding:"14px 8px",textAlign:"center",cursor:"pointer",background:UI.surface}}>
                <div style={{fontSize:12,color:imageLoaded?UI.teal:UI.hint,fontWeight:700}}>
                  {imageLoaded?"✓ 로드됨 · 클릭해서 교체":"클릭 또는 드래그"}
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

            <Sec label="레이아웃" accent={UI.accent}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                {TEMPLATES.map(t=>(
                  <button key={t.key} onClick={()=>handleTemplate(t.key)}
                    style={{padding:"8px 7px",border:`1.5px solid ${template===t.key?UI.accent:UI.border}`,
                            borderRadius:9,background:template===t.key?"#FFF5F2":UI.surface,
                            cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
                    <div style={{fontSize:11,fontWeight:700,color:template===t.key?UI.accent:UI.txt}}>{t.name}</div>
                    <div style={{fontSize:9,color:UI.hint,marginTop:1}}>{t.desc}</div>
                  </button>
                ))}
              </div>
              {(template==="photo-bottom"||template==="photo-top")&&(
                <div style={{marginTop:10,padding:"9px",background:UI.bg,borderRadius:8}}>
                  <div style={{fontSize:10,color:UI.muted,marginBottom:5,display:"flex",justifyContent:"space-between"}}>
                    <span>{template==="photo-bottom"?"하단 크림 영역":"상단 크림 영역"}</span><span style={{color:UI.teal,fontWeight:700}}>{100-photoPct}%</span>
                  </div>
                  <input type="range" min={10} max={70} value={100-photoPct} style={{width:"100%",accentColor:UI.teal}}
                    onChange={e=>{
                      const nextPanelPct=+e.target.value;
                      const nextPhotoPct=100-nextPanelPct;
                      setPhotoPct(nextPhotoPct);
                      if(imgRef.current&&fabricRef.current){
                        const{w,h}=getDims();
                        if(layoutRafRef.current!=null) cancelAnimationFrame(layoutRafRef.current);
                        layoutRafRef.current=requestAnimationFrame(()=>{
                          layoutRafRef.current=null;
                          applyLayout(imgRef.current,template,w,h,true,photoFit,nextPhotoPct,photoZoom,true);
                        });
                      }
                    }}/>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginTop:10}}>
                    <span style={{fontSize:10,color:UI.muted,minWidth:72}}>크림 색상</span>
                    {[CANVAS_BG,"#FFFFFF","#F0EBE0","#E5F0EE","#F7E3D7","#1C2B28"].map(hex=>(
                      <div key={hex} onClick={()=>{
                          setContentBg(hex);
                          if((template==="photo-bottom"||template==="photo-top")&&imgRef.current&&fabricRef.current){const{w,h}=getDims();applyLayout(imgRef.current,template,w,h,true,photoFit,photoPct,photoZoom,true);}
                        }}
                        style={{width:20,height:20,borderRadius:"50%",background:hex,cursor:"pointer",
                                border:`2px solid ${contentBg===hex?UI.teal:"rgba(0,0,0,.1)"}`,
                                boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #ddd":"none"}}/>
                    ))}
                    <input type="color" value={contentBg} onChange={e=>{
                        setContentBg(e.target.value);
                        if((template==="photo-bottom"||template==="photo-top")&&imgRef.current&&fabricRef.current){const{w,h}=getDims();applyLayout(imgRef.current,template,w,h,true,photoFit,photoPct,photoZoom,true);}
                      }}
                      style={{width:22,height:22,border:"none",borderRadius:"50%",cursor:"pointer"}}/>
                  </div>
                </div>
              )}
              {imageLoaded&&template!=="text-only"&&(
                <div style={{marginTop:10,padding:"9px",background:UI.bg,borderRadius:8}}>
                  <div style={{fontSize:10,color:UI.muted,marginBottom:6,fontWeight:700}}>사진 맞춤</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    <button onClick={()=>{
                        setPhotoFit("contain");
                        if(imgRef.current&&fabricRef.current){const{w,h}=getDims();applyLayout(imgRef.current,template,w,h,true,"contain",photoPct,photoZoom);}
                      }}
                      style={bS(photoFit==="contain",UI.teal)}>전체 보기</button>
                    <button onClick={()=>{
                        setPhotoFit("cover");
                        if(imgRef.current&&fabricRef.current){const{w,h}=getDims();applyLayout(imgRef.current,template,w,h,true,"cover",photoPct,photoZoom);}
                      }}
                      style={bS(photoFit==="cover",UI.accent)}>영역 채우기</button>
                  </div>
                  <div style={{marginTop:10}}>
                    <div style={{fontSize:10,color:UI.muted,marginBottom:5,display:"flex",justifyContent:"space-between"}}>
                      <span>사진 확대</span><span style={{color:UI.teal,fontWeight:700}}>{photoZoom}%</span>
                    </div>
                    <input type="range" min={50} max={120} value={photoZoom} style={{width:"100%",accentColor:UI.teal}}
                      onChange={e=>{
                        const nextZoom=+e.target.value;
                        setPhotoZoom(nextZoom);
                        if(imgRef.current&&fabricRef.current){
                          const{w,h}=getDims();
                          if(layoutRafRef.current!=null) cancelAnimationFrame(layoutRafRef.current);
                          layoutRafRef.current=requestAnimationFrame(()=>{
                            layoutRafRef.current=null;
                            applyLayout(imgRef.current,template,w,h,true,photoFit,photoPct,nextZoom,true);
                          });
                        }
                      }}/>
                  </div>
                  <div style={{marginTop:10}}>
                    <div style={{fontSize:10,color:UI.muted,marginBottom:5,display:"flex",justifyContent:"space-between"}}>
                      <span>사진 opacity</span><span style={{color:UI.teal,fontWeight:700}}>{photoOpacity}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={photoOpacity} style={{width:"100%",accentColor:UI.teal}}
                      onChange={e=>setPhotoOpacity(+e.target.value)}/>
                  </div>
                  <div style={{fontSize:9,color:UI.hint,marginTop:6,lineHeight:1.5}}>기본값은 사진이 잘리지 않는 ‘전체 보기’이며, 확대는 최대 120%까지 가능합니다.</div>
                </div>
              )}

              <div style={{marginTop:10,padding:"9px",background:UI.bg,borderRadius:8}}>
                <div style={{fontSize:10,color:UI.muted,marginBottom:6,fontWeight:700}}>선택 콘텐츠 배치</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5}}>
                  <button onClick={bringFront} style={bS(false)}>맨앞</button>
                  <button onClick={bringFwd}   style={bS(false)}>앞</button>
                  <button onClick={sendBwd}    style={bS(false)}>뒤</button>
                  <button onClick={sendBack}   style={bS(false)}>맨뒤</button>
                </div>
                <div style={{fontSize:9,color:UI.hint,marginTop:6,lineHeight:1.5}}>사진·텍스트·도형을 클릭한 뒤 레이어 순서를 바꿀 수 있습니다.</div>
              </div>
              {/* 세로 구분선 컬러 (split-v일 때만) */}
              {template==="split-v"&&(
                <div style={{marginTop:12,padding:"10px",background:UI.bg,borderRadius:8}}>
                  <div style={{fontSize:10,color:UI.muted,marginBottom:7,fontWeight:700}}>구분선 컬러 & 위치</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    {[PC_STYLE.brand.orange,PC_STYLE.brand.teal,PC_STYLE.brand.orange2,"#1C2B28","#FFFFFF","#9C6644"].map(hex=>(
                      <div key={hex} onClick={()=>{
                          setDividerColor(hex);
                          // 캔버스의 divider rect 컬러도 즉시 업데이트
                          fabricRef.current?.getObjects().filter((o:any)=>o.name==="divider")
                            .forEach((o:any)=>{o.set("fill",hex);});
                          fabricRef.current?.renderAll();
                        }}
                        style={{width:22,height:22,borderRadius:"50%",background:hex,cursor:"pointer",
                                border:`2px solid ${dividerColor===hex?"#1C2B28":"transparent"}`,
                                transform:dividerColor===hex?"scale(1.2)":"scale(1)",transition:"all .15s",
                                boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #ddd":"none"}}/>
                    ))}
                    <input type="color" value={dividerColor} onChange={e=>{
                        setDividerColor(e.target.value);
                        fabricRef.current?.getObjects().filter((o:any)=>o.name==="divider")
                          .forEach((o:any)=>{o.set("fill",e.target.value);});
                        fabricRef.current?.renderAll();
                      }}
                      style={{width:22,height:22,border:"none",borderRadius:"50%",cursor:"pointer"}}/>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginTop:10}}>
                    <span style={{fontSize:10,color:UI.muted,minWidth:72}}>하단 크림</span>
                    {[CANVAS_BG,"#FFFFFF","#F0EBE0","#E5F0EE","#F7E3D7","#1C2B28"].map(hex=>(
                      <div key={hex} onClick={()=>{
                          setContentBg(hex);
                          if(imgRef.current&&fabricRef.current){const{w,h}=getDims();applyLayout(imgRef.current,template,w,h,true,photoFit,photoPct,photoZoom,true);}
                        }}
                        style={{width:20,height:20,borderRadius:"50%",background:hex,cursor:"pointer",
                                border:`2px solid ${contentBg===hex?UI.teal:"rgba(0,0,0,.1)"}`,
                                boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #ddd":"none"}}/>
                    ))}
                    <input type="color" value={contentBg} onChange={e=>{
                        setContentBg(e.target.value);
                        if(imgRef.current&&fabricRef.current){const{w,h}=getDims();applyLayout(imgRef.current,template,w,h,true,photoFit,photoPct,photoZoom,true);}
                      }}
                      style={{width:22,height:22,border:"none",borderRadius:"50%",cursor:"pointer"}}/>
                  </div>
                  <div style={{fontSize:9,color:UI.hint,lineHeight:1.5,marginTop:8}}>구분선을 드래그해서 위치를 이동할 수 있어요. 사진을 클릭해도 레이어가 갑자기 위로 튀지 않도록 보정했습니다.</div>
                </div>
              )}
            </Sec>

            <Sec label="배경 색상" accent={UI.accent}>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                {[CANVAS_BG,"#FFFFFF","#1C2B28","#E5F0EE","#F0EBE0","#2A1A0A"].map(hex=>(
                  <div key={hex} onClick={()=>{setCanvasBg(hex);fabricRef.current?.setBackgroundColor(hex,()=>{ensureFixedOrder();});}}
                    style={{width:24,height:24,borderRadius:6,background:hex,cursor:"pointer",
                            border:`2px solid ${canvasBg===hex?UI.teal:"rgba(0,0,0,.1)"}`,
                            transform:canvasBg===hex?"scale(1.12)":"scale(1)",transition:"all .15s",
                            boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #ddd":"none"}}/>
                ))}
                <input type="color" value={canvasBg} onChange={e=>{setCanvasBg(e.target.value);fabricRef.current?.setBackgroundColor(e.target.value,()=>{ensureFixedOrder();});}}
                  style={{width:24,height:24,border:"none",borderRadius:6,cursor:"pointer"}}/>
              </div>
            </Sec>

            <Sec label="액센트 컬러" accent={UI.accent}>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                {[PC_STYLE.brand.orange,PC_STYLE.brand.teal,PC_STYLE.brand.orange2,PC_STYLE.brand.teal2,"#9C6644","#2C2B35"].map(hex=>(
                  <div key={hex} onClick={()=>setAccentColor(hex)}
                    style={{width:22,height:22,borderRadius:"50%",background:hex,cursor:"pointer",
                            border:`2px solid ${accentColor===hex?"#1C2B28":"transparent"}`,
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
                      style={{fontSize:9,padding:"3px 6px",border:`1px solid ${activePal===i?UI.accent:UI.border}`,
                              borderRadius:5,background:activePal===i?"#FFF5F2":UI.surface,
                              color:activePal===i?UI.accent:UI.muted,cursor:"pointer",fontFamily:"inherit"}}>
                      {p.name}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {PANTONE_PALETTES[activePal].colors.map(c=>(
                    <div key={c.hex} onClick={()=>{setTextColor(c.hex);setAccentColor(c.hex);}}
                      title={c.label}
                      style={{flex:1,height:34,borderRadius:6,background:c.hex,cursor:"pointer",
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
          {activeTool==="text"&&<>
            {/* 텍스트 선택 시 실시간 편집 배너 */}
            {selectedIsText&&(
              <div style={{background:"#EAF4F2",border:`1.5px solid ${UI.teal}`,borderRadius:9,
                           padding:"10px 12px",marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:UI.teal,marginBottom:3}}>
                  ✏️ 텍스트 선택됨
                </div>
                <div style={{fontSize:9,color:UI.muted,lineHeight:1.6}}>
                  아래 폰트·크기·색상·정렬 설정이 즉시 반영됩니다.<br/>
                  내용은 캔버스에서 <b>더블클릭</b>해서 편집하세요.
                </div>
              </div>
            )}
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
                    style={{flex:1,height:26,border:"none",borderRadius:6,
                            background:activeTab===tab?UI.surface:"transparent",
                            color:activeTab===tab?UI.txt:UI.hint,fontSize:11,fontWeight:700,
                            cursor:"pointer",fontFamily:"inherit"}}>
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
                    placeholder="추가 참고사항" rows={2} style={{...iS,resize:"vertical",minHeight:50}}/>
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
                        style={{border:`1.5px solid ${selIdx===i?UI.accent:UI.border}`,borderRadius:9,
                                padding:"8px 11px",cursor:"pointer",background:selIdx===i?"#FFF5F2":UI.surface}}>
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
                  <div style={{fontSize:10,color:UI.muted}}>메인 텍스트 (크게)</div>
                  <textarea value={mainText} onChange={e=>setMainText(e.target.value)} rows={3}
                    placeholder={"포토클리닉을\n병원이미지를 만드는\n브랜딩회사로 만들고 싶습니다"} style={{...iS,resize:"vertical"}}/>
                  <div style={{fontSize:10,color:UI.muted}}>서브 텍스트</div>
                  <textarea value={subText} onChange={e=>setSubText(e.target.value)} rows={2}
                    placeholder={"사진을 잘 찍는다는 말씀보다\n병원이미지를 잘 담는다는 피드백이 더 좋습니다"} style={{...iS,resize:"vertical"}}/>
                  <div style={{fontSize:10,color:UI.muted}}>마이크로 텍스트 (병원명 등)</div>
                  <input value={microText} onChange={e=>setMicroText(e.target.value)} placeholder="연세꿈꾸는치과교정과" style={iS}/>
                  <button onClick={()=>placeText(mainText,subText||undefined,microText||undefined)}
                    style={{height:36,background:UI.teal,color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    캔버스에 적용
                  </button>
                </div>
              )}
            </Sec>

            <Sec label="폰트 & 크기" accent={UI.accent}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {FONT_PAIRS.map((fp,i)=>(
                  <button key={i} onClick={()=>setFontPair(i)}
                    style={{padding:"6px 10px",border:`1.5px solid ${fontPair===i?UI.teal:UI.border}`,
                            borderRadius:7,background:fontPair===i?"#EAF4F2":UI.surface,
                            color:fontPair===i?UI.teal:UI.txt,fontSize:11,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                    <span style={{fontFamily:`'${fp.display}',serif,sans-serif`,marginRight:6}}>{fp.display.split(" ")[0]}</span>
                    <span style={{fontSize:9,color:UI.hint}}>· {fp.label}</span>
                  </button>
                ))}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
                  <div>
                    <div style={{fontSize:10,color:UI.muted,marginBottom:3}}>메인 {fontSize}px</div>
                    <input type="range" min={16} max={90} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{width:"100%",accentColor:UI.teal}}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:UI.muted,marginBottom:3}}>서브 {subFontSize}px</div>
                    <input type="range" min={10} max={36} value={subFontSize} onChange={e=>setSubFontSize(+e.target.value)} style={{width:"100%",accentColor:UI.teal}}/>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:7,marginTop:2}}>
                  <label style={{fontSize:10,color:UI.muted,minWidth:42}}>줄간격 {lineH.toFixed(1)}</label>
                  <input type="range" min={10} max={25} value={Math.round(lineH*10)} onChange={e=>setLineH(+e.target.value/10)} style={{flex:1,accentColor:UI.teal}}/>
                </div>
                <div style={{display:"flex",gap:5,marginTop:2}}>
                  {(["left","center","right"] as const).map(a=>(
                    <button key={a} onClick={()=>setTextAlign(a)}
                      style={{flex:1,height:26,border:`1.5px solid ${textAlign===a?UI.teal:UI.border}`,
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
                <div style={{fontSize:10,color:UI.muted,marginBottom:4}}>메인</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                  {[PC_STYLE.brand.orange,"#1C2B28","#FFFFFF",PC_STYLE.brand.teal,"#9C6644",CANVAS_BG].map(hex=>(
                    <div key={hex} onClick={()=>setTextColor(hex)}
                      style={{width:22,height:22,borderRadius:"50%",background:hex,cursor:"pointer",
                              border:`2px solid ${textColor===hex?"#1C2B28":"rgba(0,0,0,.1)"}`,
                              transform:textColor===hex?"scale(1.2)":"scale(1)",transition:"all .15s",
                              boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #ddd":"none"}}/>
                  ))}
                  <input type="color" value={textColor} onChange={e=>setTextColor(e.target.value)} style={{width:22,height:22,border:"none",borderRadius:"50%",cursor:"pointer"}}/>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:UI.muted,marginBottom:4}}>서브</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                  {[UI.muted,UI.hint,"#1C2B28",PC_STYLE.brand.orange,"#FFFFFF"].map(hex=>(
                    <div key={hex} onClick={()=>setSubColor(hex)}
                      style={{width:22,height:22,borderRadius:"50%",background:hex,cursor:"pointer",
                              border:`2px solid ${subColor===hex?"#1C2B28":"rgba(0,0,0,.1)"}`,
                              transform:subColor===hex?"scale(1.2)":"scale(1)",transition:"all .15s",
                              boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #ddd":"none"}}/>
                  ))}
                  <input type="color" value={subColor} onChange={e=>setSubColor(e.target.value)} style={{width:22,height:22,border:"none",borderRadius:"50%",cursor:"pointer"}}/>
                </div>
              </div>
            </Sec>
          </>}

          {/* ── 도형 탭 ── */}
          {activeTool==="shape"&&<>
            <Sec label="도형 추가" accent={UI.accent}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:4}}>
                {([
                  ["rect",     "□ 사각형"],
                  ["roundrect","▢ 둥근사각"],
                  ["circle",   "○ 원"],
                  ["triangle", "△ 삼각형"],
                  ["star",     "★ 별"],
                  ["hexagon",  "⬡ 육각형"],
                  ["pentagon", "⬠ 오각형"],
                  ["arrow",    "➤ 화살표"],
                  ["cross",    "+ 십자"],
                  ["line",     "— 선"],
                ] as [ShapeType,string][]).map(([key,label])=>(
                  <button key={key} onClick={()=>addShape(key)}
                    style={{padding:"8px 4px",border:`1.5px solid ${UI.border}`,borderRadius:9,
                            background:UI.surface,cursor:"pointer",fontFamily:"inherit",
                            fontSize:10,color:UI.txt,fontWeight:600,textAlign:"center"}}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:9,color:UI.hint,marginTop:4,lineHeight:1.5}}>버튼을 클릭하면 캔버스 중앙에 추가됩니다.</div>
            </Sec>

            <Sec label="도형 스타일" accent={UI.accent}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
                <button onClick={()=>setShapeStyle("stroke")} style={bS(shapeStyle==="stroke",UI.teal)}>테두리</button>
                <button onClick={()=>setShapeStyle("fill")}   style={bS(shapeStyle==="fill",UI.teal)}>채우기</button>
                <button onClick={()=>setShapeStyle("both")}   style={bS(shapeStyle==="both",UI.teal)}>둘 다</button>
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:UI.muted,marginBottom:4}}>테두리 컬러</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                  {[PC_STYLE.brand.orange,PC_STYLE.brand.teal,PC_STYLE.brand.orange2,PC_STYLE.brand.teal2,"#1C2B28","#FFFFFF"].map(hex=>(
                    <div key={hex} onClick={()=>setShapeStrokeColor(hex)}
                      style={{width:22,height:22,borderRadius:"50%",background:hex,cursor:"pointer",
                              border:`2px solid ${shapeStrokeColor===hex?"#1C2B28":"rgba(0,0,0,.1)"}`,
                              boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #ddd":"none"}}/>
                  ))}
                  <input type="color" value={shapeStrokeColor} onChange={e=>setShapeStrokeColor(e.target.value)} style={{width:22,height:22,border:"none",borderRadius:"50%",cursor:"pointer"}}/>
                </div>
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:UI.muted,marginBottom:4}}>채우기 컬러</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                  {[PC_STYLE.brand.orange,PC_STYLE.brand.teal,PC_STYLE.brand.orange2,PC_STYLE.brand.teal2,"#F0EBE0","#1C2B28"].map(hex=>(
                    <div key={hex} onClick={()=>setShapeFillColor(hex)}
                      style={{width:22,height:22,borderRadius:"50%",background:hex,cursor:"pointer",
                              border:`2px solid ${shapeFillColor===hex?"#1C2B28":"rgba(0,0,0,.1)"}`}}/>
                  ))}
                  <input type="color" value={shapeFillColor} onChange={e=>setShapeFillColor(e.target.value)} style={{width:22,height:22,border:"none",borderRadius:"50%",cursor:"pointer"}}/>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:UI.muted,marginBottom:5,display:"flex",justifyContent:"space-between"}}>
                  <span>도형 opacity</span><span style={{color:UI.teal,fontWeight:700}}>{shapeOpacity}%</span>
                </div>
                <input type="range" min={0} max={100} value={shapeOpacity} style={{width:"100%",accentColor:UI.teal}} onChange={e=>setShapeOpacity(+e.target.value)}/>
              </div>
              <button onClick={applyCurrentShapeStyle} style={{...bS(true,UI.teal),width:"100%",color:UI.teal}}>선택 도형에 스타일 적용</button>
              <div style={{fontSize:9,color:UI.hint,marginTop:6,lineHeight:1.5}}>도형을 선택한 상태에서 조정하면 즉시 반영됩니다.</div>
            </Sec>

            <Sec label="레이어 배치" accent={UI.accent}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5}}>
                <button onClick={bringFront} style={bS(false)}>맨앞</button>
                <button onClick={bringFwd}   style={bS(false)}>앞</button>
                <button onClick={sendBwd}    style={bS(false)}>뒤</button>
                <button onClick={sendBack}   style={bS(false)}>맨뒤</button>
              </div>
            </Sec>
          </>}

          {/* ── 필터 탭 ── */}
          {activeTool==="filter"&&<>
            <Sec label="사진 필터" accent={UI.accent}>
              <div style={{fontSize:10,color:UI.muted,marginBottom:10,background:"#EAF4F2",padding:"8px 10px",borderRadius:8,lineHeight:1.6}}>
                포토클리닉 프리셋: 따뜻한 필름 느낌<br/>밝기 -7 · 대비 +2 · 채도 -5 · 색온도 +15
              </div>
              {[
                {label:"밝기",  val:brightness,set:setBrightness,min:50,max:150,def:100},
                {label:"대비",  val:contrast,  set:setContrast,  min:50,max:150,def:100},
                {label:"채도",  val:saturation,set:setSaturation,min:0, max:200,def:95 },
                {label:"색온도",val:warmth,     set:setWarmth,    min:-50,max:50,def:0 },
              ].map(({label,val,set,min,max,def})=>(
                <div key={label} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <label style={{fontSize:11,color:UI.txt,fontWeight:600}}>{label}</label>
                    <div style={{display:"flex",gap:5,alignItems:"center"}}>
                      <span style={{fontSize:10,color:UI.muted}}>{val}</span>
                      <button onClick={()=>set(def)} style={{fontSize:9,color:UI.muted,background:UI.surface,
                        border:`1px solid ${UI.border}`,borderRadius:4,padding:"1px 5px",cursor:"pointer"}}>초기화</button>
                    </div>
                  </div>
                  <input type="range" min={min} max={max} value={val} onChange={e=>set(+e.target.value)} style={{width:"100%",accentColor:UI.teal}}/>
                </div>
              ))}
              <button onClick={()=>{setBrightness(93);setContrast(102);setSaturation(95);setWarmth(15);}}
                style={{...bS(true,UI.teal),width:"100%",marginTop:4,color:UI.teal}}>
                🎞 포토클리닉 필름 프리셋
              </button>
              <button onClick={()=>{setBrightness(100);setContrast(100);setSaturation(95);setWarmth(0);}}
                style={{...bS(false),width:"100%",marginTop:6}}>기본값 초기화</button>
            </Sec>
          </>}

          </div>
        </aside>

        {/* ── 캔버스 ── */}
        <main style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                      justifyContent:"flex-start",padding:"28px 24px",overflowY:"auto",background:UI.bg}}>
          {/* sticky: 스크롤 내려도 캔버스가 항상 보임 */}
          <div style={{position:"sticky",top:28,display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{boxShadow:"0 6px 32px rgba(21,88,85,.14)",borderRadius:4,overflow:"hidden",position:"relative"}}>
              <canvas ref={canvasRef}/>
              {!fabricReady&&(
                <div style={{position:"absolute",inset:0,background:"rgba(229,240,238,.92)",
                             display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
                  <Spin size={32} color={UI.teal}/>
                  <div style={{fontSize:12,color:UI.muted}}>에디터 초기화 중...</div>
                </div>
              )}
            </div>
            {/* 다운로드 버튼 — 캔버스 바로 아래 */}
            <div style={{marginTop:14,display:"flex",flexDirection:"column",alignItems:"center",gap:8,width:"100%"}}>
              <div style={{display:"flex",gap:8}}>
                <button
                  onClick={()=>download("png")}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"10px 22px",
                          background:UI.teal,color:"#fff",border:"none",borderRadius:10,
                          fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                          boxShadow:"0 3px 12px rgba(21,88,85,.25)",transition:"opacity .15s"}}
                  onMouseOver={e=>(e.currentTarget.style.opacity="0.85")}
                  onMouseOut={e=>(e.currentTarget.style.opacity="1")}>
                  ⬇ PNG 저장
                </button>
                <button
                  onClick={()=>download("jpeg")}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"10px 22px",
                          background:UI.surface,color:UI.teal,border:`1.5px solid ${UI.teal}`,
                          borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                          transition:"opacity .15s"}}
                  onMouseOver={e=>(e.currentTarget.style.opacity="0.7")}
                  onMouseOut={e=>(e.currentTarget.style.opacity="1")}>
                  ⬇ JPG 저장
                </button>
                <button
                  onClick={copyToClipboard}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",
                          background:UI.surface,color:UI.muted,border:`1.5px solid ${UI.border}`,
                          borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                          transition:"opacity .15s"}}
                  onMouseOver={e=>(e.currentTarget.style.opacity="0.7")}
                  onMouseOut={e=>(e.currentTarget.style.opacity="1")}>
                  📋 복사
                </button>
              </div>
              {/* 피드 미리보기 버튼 */}
              <button
                onClick={openFeedGrid}
                style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",
                        background:"transparent",color:UI.teal,border:`1.5px solid ${UI.teal}40`,
                        borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        transition:"all .15s"}}
                onMouseOver={e=>{e.currentTarget.style.background=`${UI.teal}12`;}}
                onMouseOut={e=>{e.currentTarget.style.background="transparent";}}>
                ⊞ 피드 그리드 미리보기
              </button>
              <div style={{fontSize:10,color:UI.hint,textAlign:"center"}}>
                {cw}×{ch}px ({cw*2}×{ch*2} 2배) · ⌘Z 취소 / ⌘Y 다시실행
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── 피드 그리드 미리보기 모달 ── */}
      {showFeedGrid&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:500,
                     display:"flex",alignItems:"center",justifyContent:"center"}}
             onClick={()=>setShowFeedGrid(false)}>
          <div style={{background:"#fff",borderRadius:18,padding:"28px 28px 24px",
                       maxWidth:520,width:"92vw",boxShadow:"0 24px 80px rgba(0,0,0,.35)"}}
               onClick={e=>e.stopPropagation()}>
            {/* 헤더 */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:UI.txt}}>피드 그리드 미리보기</div>
                <div style={{fontSize:11,color:UI.muted,marginTop:2}}>슬롯을 클릭하면 현재 디자인을 배치합니다</div>
              </div>
              <button onClick={()=>setShowFeedGrid(false)}
                style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:UI.muted,padding:"4px 8px"}}>✕</button>
            </div>

            {/* 인스타 UI 흉내 — 프로필 영역 */}
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${UI.border}`}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${UI.accent},${UI.teal})`,
                           display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏥</div>
              <div>
                <div style={{fontWeight:800,fontSize:13,color:UI.txt}}>@photoclinic_kr</div>
                <div style={{fontSize:11,color:UI.muted}}>병원 브랜딩 전문 스튜디오</div>
              </div>
            </div>

            {/* 3×3 그리드 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>
              {feedSlots.map((slot,idx)=>(
                <div key={idx}
                  onClick={()=>placeInSlot(idx)}
                  style={{aspectRatio:"1",position:"relative",cursor:"pointer",
                          border:`2.5px solid ${feedCurrentSlot===idx?UI.accent:"transparent"}`,
                          borderRadius:2,overflow:"hidden",background:UI.bg,
                          transition:"border-color .15s"}}>
                  {slot
                    ? <img src={slot} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",
                                   alignItems:"center",justifyContent:"center",gap:4}}>
                        <div style={{fontSize:20,opacity:.25}}>+</div>
                        <div style={{fontSize:9,color:UI.hint,opacity:.6}}>클릭해서 배치</div>
                      </div>
                  }
                  {/* 현재 슬롯 배지 */}
                  {feedCurrentSlot===idx&&(
                    <div style={{position:"absolute",top:4,left:4,background:UI.accent,color:"#fff",
                                 fontSize:9,fontWeight:800,padding:"2px 5px",borderRadius:4}}>현재</div>
                  )}
                  {/* 슬롯 삭제 버튼 */}
                  {slot&&(
                    <button onClick={e=>clearSlot(idx,e)}
                      style={{position:"absolute",top:3,right:3,background:"rgba(0,0,0,.55)",
                              border:"none",borderRadius:"50%",width:18,height:18,
                              color:"#fff",fontSize:10,cursor:"pointer",lineHeight:"18px",padding:0}}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 안내 */}
            <div style={{marginTop:14,fontSize:10,color:UI.hint,textAlign:"center",lineHeight:1.6}}>
              슬롯 클릭 → 현재 디자인 배치 · ✕ → 슬롯 초기화<br/>
              디자인을 수정하고 다시 열면 현재 슬롯에 업데이트됩니다
            </div>

            {/* 닫기 */}
            <button onClick={()=>setShowFeedGrid(false)}
              style={{width:"100%",marginTop:14,padding:"10px",background:UI.teal,color:"#fff",
                      border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ── 콘텐츠 아이디어 AI 모달 ── */}
      {showIdeas&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:500,
                     display:"flex",alignItems:"center",justifyContent:"center"}}
             onClick={()=>setShowIdeas(false)}>
          <div style={{background:"#fff",borderRadius:18,padding:"28px",maxWidth:640,width:"96vw",
                       maxHeight:"90vh",display:"flex",flexDirection:"column",
                       boxShadow:"0 24px 80px rgba(0,0,0,.35)"}}
               onClick={e=>e.stopPropagation()}>

            {/* 헤더 */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:UI.txt}}>💡 콘텐츠 아이디어 AI</div>
                <div style={{fontSize:11,color:UI.muted,marginTop:2}}>병원 정보 입력 → 주간 포스트 플랜 생성</div>
              </div>
              <button onClick={()=>setShowIdeas(false)}
                style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:UI.muted}}>✕</button>
            </div>

            {/* 입력 폼 */}
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              <input value={ideaDept} onChange={e=>setIdeaDept(e.target.value)}
                placeholder="진료과 (예: 피부과, 치과)"
                style={{flex:2,minWidth:130,border:`1px solid ${UI.border}`,borderRadius:8,padding:"8px 10px",
                        fontSize:12,fontFamily:"inherit",background:"#fff",color:UI.txt,outline:"none"}}/>
              <select value={ideaStyle} onChange={e=>setIdeaStyle(e.target.value)}
                style={{flex:1,minWidth:110,border:`1px solid ${UI.border}`,borderRadius:8,padding:"8px 8px",
                        fontSize:12,fontFamily:"inherit",background:"#fff",color:UI.txt,outline:"none"}}>
                {["따뜻·감성","다크·고급","모던·절제","클린·밝음"].map(t=>(
                  <option key={t}>{t}</option>
                ))}
              </select>
              <select value={ideaCount} onChange={e=>setIdeaCount(Number(e.target.value))}
                style={{width:80,border:`1px solid ${UI.border}`,borderRadius:8,padding:"8px 8px",
                        fontSize:12,fontFamily:"inherit",background:"#fff",color:UI.txt,outline:"none"}}>
                {[3,5,7].map(n=><option key={n} value={n}>{n}개</option>)}
              </select>
              <button onClick={generateIdeas} disabled={ideaLoading}
                style={{padding:"8px 18px",background:ideaLoading?"#9BB5B0":UI.teal,color:"#fff",border:"none",
                        borderRadius:8,fontSize:12,fontWeight:700,cursor:ideaLoading?"not-allowed":"pointer",
                        fontFamily:"inherit",whiteSpace:"nowrap"}}>
                {ideaLoading?"생성 중...":"✦ 생성"}
              </button>
            </div>

            {/* 결과 목록 */}
            <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
              {ideaLoading&&(
                <div style={{textAlign:"center",padding:"40px",color:UI.muted,fontSize:12}}>
                  <div style={{fontSize:28,marginBottom:12}}>✦</div>
                  Claude가 콘텐츠 플랜을 만들고 있습니다...
                </div>
              )}
              {!ideaLoading&&ideas.length===0&&(
                <div style={{textAlign:"center",padding:"40px 20px",color:UI.hint,fontSize:12}}>
                  <div style={{fontSize:36,marginBottom:12,opacity:.3}}>💡</div>
                  진료과와 스타일을 선택하고<br/>생성 버튼을 눌러보세요.
                  {ideaMock&&<div style={{marginTop:8,fontSize:10,color:UI.accent}}>* API 키 없음 — 데모 데이터 표시</div>}
                </div>
              )}
              {ideas.map((idea,idx)=>(
                <div key={idx} style={{border:`1px solid ${UI.border}`,borderRadius:12,
                                       overflow:"hidden",background:UI.surface}}>
                  {/* 카드 헤더 */}
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                               background:`linear-gradient(90deg,${UI.teal}12,transparent)`,
                               borderBottom:`1px solid ${UI.border}`}}>
                    <span style={{fontSize:18}}>{idea.emoji}</span>
                    <div style={{flex:1}}>
                      <span style={{fontSize:11,fontWeight:800,color:UI.teal,marginRight:8}}>
                        {idea.day}요일
                      </span>
                      <span style={{fontSize:12,fontWeight:700,color:UI.txt}}>{idea.title}</span>
                    </div>
                    <span style={{fontSize:9,color:UI.hint,background:UI.bg,padding:"2px 8px",
                                  borderRadius:10,fontWeight:700}}>{idea.type}</span>
                  </div>
                  {/* 카드 바디 */}
                  <div style={{padding:"12px 14px"}}>
                    <div style={{fontSize:12,fontWeight:700,color:UI.accent,marginBottom:4}}>
                      "{idea.hook}"
                    </div>
                    <div style={{fontSize:11,color:UI.muted,lineHeight:1.6,whiteSpace:"pre-line",marginBottom:8}}>
                      {idea.caption}
                    </div>
                    <div style={{fontSize:10,color:UI.teal,marginBottom:10}}>{idea.hashtags}</div>
                    {/* 액션 버튼 */}
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>useIdeaForDesign(idea)}
                        style={{flex:1,padding:"7px",background:UI.teal,color:"#fff",border:"none",
                                borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                        ✦ 이 아이디어로 디자인
                      </button>
                      <button onClick={()=>{
                          setMainText(idea.hook);
                          setSubText(idea.title);
                          setShowIdeas(false);
                          showToast("텍스트 적용 완료 ✓");
                        }}
                        style={{padding:"7px 12px",background:UI.surface,color:UI.muted,
                                border:`1px solid ${UI.border}`,borderRadius:8,fontSize:11,
                                fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                        텍스트만
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {ideaMock&&ideas.length>0&&(
              <div style={{marginTop:10,fontSize:10,color:UI.hint,textAlign:"center"}}>
                * ANTHROPIC_API_KEY 없음 — 데모 데이터입니다
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 브랜드 키트 모달 ── */}
      {showBrandKit&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:500,
                     display:"flex",alignItems:"center",justifyContent:"center"}}
             onClick={()=>setShowBrandKit(false)}>
          <div style={{background:"#fff",borderRadius:18,padding:"28px",maxWidth:560,width:"94vw",
                       maxHeight:"88vh",display:"flex",flexDirection:"column",
                       boxShadow:"0 24px 80px rgba(0,0,0,.35)"}}
               onClick={e=>e.stopPropagation()}>

            {/* 헤더 */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:UI.txt}}>🎨 브랜드 키트</div>
                <div style={{fontSize:11,color:UI.muted,marginTop:2}}>병원별 컬러·폰트·레이아웃 저장</div>
              </div>
              <button onClick={()=>setShowBrandKit(false)}
                style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:UI.muted}}>✕</button>
            </div>

            {/* 현재 설정 저장 */}
            <div style={{background:UI.bg,borderRadius:12,padding:"14px",marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:UI.muted,marginBottom:8}}>현재 설정을 저장</div>
              {/* 컬러 미리보기 */}
              <div style={{display:"flex",gap:5,marginBottom:10}}>
                {[canvasBg,contentBg,textColor,accentColor,subColor].map((c,i)=>(
                  <div key={i} style={{width:24,height:24,borderRadius:6,background:c,
                                       border:`1px solid ${UI.border}`,flexShrink:0}}/>
                ))}
                <div style={{fontSize:10,color:UI.hint,alignSelf:"center",marginLeft:4}}>
                  {template} · {ratio} · {FONT_PAIRS[fontPair]?.label}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <input value={kitNameInput} onChange={e=>setKitNameInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&saveKit()}
                  placeholder="병원 이름 (예: 피부과 A클리닉)"
                  style={{flex:1,border:`1px solid ${UI.border}`,borderRadius:8,padding:"8px 10px",
                          fontSize:12,fontFamily:"inherit",background:"#fff",color:UI.txt,outline:"none"}}/>
                <button onClick={saveKit}
                  style={{padding:"8px 16px",background:UI.teal,color:"#fff",border:"none",
                          borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                          whiteSpace:"nowrap"}}>
                  저장
                </button>
              </div>
            </div>

            {/* 저장된 키트 목록 */}
            <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
              {brandKits.length===0?(
                <div style={{textAlign:"center",padding:"32px 20px",color:UI.hint,fontSize:12}}>
                  <div style={{fontSize:32,marginBottom:10,opacity:.3}}>🎨</div>
                  저장된 브랜드 키트가 없습니다.<br/>
                  병원 이름을 입력하고 현재 설정을 저장해보세요.
                </div>
              ):brandKits.map(kit=>(
                <div key={kit.id}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"12px",
                          background:UI.bg,borderRadius:10,border:`1px solid ${UI.border}`}}>
                  {/* 컬러 스와치 */}
                  <div style={{display:"flex",gap:3,flexShrink:0}}>
                    {[kit.canvasBg,kit.contentBg,kit.textColor,kit.accentColor].map((c,i)=>(
                      <div key={i} style={{width:16,height:32,borderRadius:3,background:c,
                                           border:`1px solid rgba(0,0,0,.08)`}}/>
                    ))}
                  </div>
                  {/* 정보 */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:UI.txt,
                                 overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {kit.name}
                    </div>
                    <div style={{fontSize:10,color:UI.hint,marginTop:2}}>
                      {kit.template} · {kit.ratio} · {FONT_PAIRS[kit.fontPair]?.label} · {new Date(kit.createdAt).toLocaleDateString("ko")}
                    </div>
                  </div>
                  {/* 적용 */}
                  <button onClick={()=>applyKit(kit)}
                    style={{padding:"6px 14px",background:UI.teal,color:"#fff",border:"none",
                            borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                            whiteSpace:"nowrap"}}>
                    적용
                  </button>
                  {/* 삭제 */}
                  <button onClick={()=>deleteKit(kit.id)}
                    style={{...bS(false),padding:"5px 8px",color:"#C04020",borderColor:"#FACCB8",fontSize:11}}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* 하단 — 내보내기/가져오기 */}
            <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${UI.border}`,
                         display:"flex",gap:8,justifyContent:"flex-end",alignItems:"center"}}>
              <div style={{fontSize:10,color:UI.hint,flex:1}}>
                {brandKits.length}개 저장됨 · 브라우저 로컬 저장
              </div>
              <label style={{...bS(false) as any,padding:"6px 12px",cursor:"pointer",fontSize:11,
                             border:`1.5px solid ${UI.border}`,borderRadius:8,color:UI.muted,
                             background:UI.surface,fontWeight:700,fontFamily:"inherit"}}>
                📥 가져오기
                <input type="file" accept=".json" style={{display:"none"}}
                  onChange={e=>{if(e.target.files?.[0]){importKits(e.target.files[0]);e.target.value="";}}}/>
              </label>
              {brandKits.length>0&&(
                <button onClick={exportKits}
                  style={{...bS(false),padding:"6px 12px",fontSize:11}}>
                  📤 내보내기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 캐러셀 모달 ── */}
      {showCarousel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:500,
                     display:"flex",alignItems:"center",justifyContent:"center"}}
             onClick={()=>setShowCarousel(false)}>
          <div style={{background:"#fff",borderRadius:18,padding:"28px",
                       maxWidth:600,width:"94vw",maxHeight:"88vh",display:"flex",flexDirection:"column",
                       boxShadow:"0 24px 80px rgba(0,0,0,.35)"}}
               onClick={e=>e.stopPropagation()}>

            {/* 헤더 */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:UI.txt}}>🎞 캐러셀 제작</div>
                <div style={{fontSize:11,color:UI.muted,marginTop:2}}>
                  슬라이드 {carouselSlides.length}장 · 인스타 캐러셀용 순서 관리
                </div>
              </div>
              <button onClick={()=>setShowCarousel(false)}
                style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:UI.muted,padding:"4px 8px"}}>✕</button>
            </div>

            {/* 현재 캔버스 → 슬라이드 추가 버튼 */}
            <button onClick={()=>{addCarouselSlide();}}
              style={{width:"100%",padding:"11px",background:UI.teal,color:"#fff",border:"none",
                      borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                      marginBottom:16,letterSpacing:".02em"}}>
              ＋ 현재 디자인을 슬라이드로 추가
            </button>

            {/* 슬라이드 리스트 */}
            <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
              {carouselSlides.length===0?(
                <div style={{textAlign:"center",padding:"40px 20px",color:UI.hint,fontSize:12}}>
                  <div style={{fontSize:36,marginBottom:12,opacity:.3}}>🎞</div>
                  디자인을 완성하고 슬라이드를 추가하세요.<br/>
                  여러 장 추가 후 순서를 조정할 수 있습니다.
                </div>
              ):carouselSlides.map((slide,idx)=>(
                <div key={slide.id}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
                          background:UI.bg,borderRadius:10,border:`1px solid ${UI.border}`}}>
                  {/* 순서 번호 */}
                  <div style={{width:28,height:28,borderRadius:"50%",background:UI.teal,color:"#fff",
                               fontSize:13,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",
                               flexShrink:0}}>
                    {idx+1}
                  </div>
                  {/* 썸네일 */}
                  <img src={slide.thumb} alt={slide.label}
                    style={{width:54,height:54,objectFit:"cover",borderRadius:6,
                            border:`1px solid ${UI.border}`,flexShrink:0}}/>
                  {/* 라벨 */}
                  <div style={{flex:1,fontSize:12,fontWeight:600,color:UI.txt}}>{slide.label}</div>
                  {/* 업데이트 */}
                  <button onClick={()=>updateSlide(slide.id)}
                    title="현재 캔버스로 이 슬라이드 업데이트"
                    style={{...bS(false),fontSize:10,padding:"4px 8px",color:UI.teal,borderColor:UI.teal}}>
                    업데이트
                  </button>
                  {/* 순서 이동 */}
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    <button onClick={()=>moveCarouselSlide(slide.id,-1)} disabled={idx===0}
                      style={{...bS(false),padding:"2px 6px",opacity:idx===0?.3:1,fontSize:11}}>▲</button>
                    <button onClick={()=>moveCarouselSlide(slide.id,1)} disabled={idx===carouselSlides.length-1}
                      style={{...bS(false),padding:"2px 6px",opacity:idx===carouselSlides.length-1?.3:1,fontSize:11}}>▼</button>
                  </div>
                  {/* 삭제 */}
                  <button onClick={()=>removeCarouselSlide(slide.id)}
                    style={{...bS(false),padding:"4px 8px",color:"#C04020",borderColor:"#FACCB8",fontSize:11}}>
                    삭제
                  </button>
                </div>
              ))}
            </div>

            {/* 하단 액션 */}
            {carouselSlides.length>0&&(
              <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${UI.border}`,
                           display:"flex",gap:8,justifyContent:"flex-end",alignItems:"center"}}>
                <div style={{fontSize:11,color:UI.muted,flex:1}}>
                  {carouselSlides.length}장 · {ratio} · JPG 2배 해상도
                </div>
                <button onClick={()=>setCarouselSlides([])}
                  style={{...bS(false),color:"#C04020",borderColor:"#FACCB8",fontSize:11}}>
                  전체 삭제
                </button>
                <button onClick={downloadAllSlides}
                  style={{padding:"9px 20px",background:UI.accent,color:"#fff",border:"none",
                          borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  ⬇ 전체 다운로드
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 토스트 */}
      <div style={{position:"fixed",bottom:20,left:"50%",
                   transform:`translateX(-50%) translateY(${toast?"0":"70px"})`,
                   background:UI.teal,color:"#fff",fontSize:12,padding:"9px 18px",
                   borderRadius:20,transition:"transform .3s",pointerEvents:"none",
                   zIndex:999,fontWeight:600,whiteSpace:"nowrap"}}>
        {toast}
      </div>
    </div>
  );
}

function Sec({label,children,accent}:{label:string;children:React.ReactNode;accent:string}){
  return(
    <div style={{marginBottom:17,paddingBottom:15,borderBottom:`1px solid ${UI.border}`}}>
      <div style={{fontSize:9,fontWeight:800,color:UI.muted,textTransform:"uppercase",
                   letterSpacing:".09em",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
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
