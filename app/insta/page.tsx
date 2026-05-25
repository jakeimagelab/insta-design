"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { PANTONE_PALETTES, FONT_PAIRS, PC_STYLE } from "@/lib/photoclinic-style";

type Ratio       = "1:1"|"4:5"|"9:16";
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
  const [photoPct,    setPhotoPct]   = useState(60);
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
  const [activeTool,setActiveTool]=useState<"layout"|"text"|"filter">("layout");

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

  const canvasRef=useRef<HTMLCanvasElement>(null);
  const fabricRef=useRef<any>(null);
  const imgRef=useRef<any>(null);
  const fileRef=useRef<HTMLInputElement>(null);

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

  useEffect(()=>{ if(imageLoaded) applyFilter(); },[brightness,contrast,saturation,warmth]); // eslint-disable-line

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
    fabricRef.current=new Fab.Canvas(canvasRef.current,{width:w,height:h,backgroundColor:canvasBg});

    // 더블클릭 텍스트 편집
    fabricRef.current.on("mouse:dblclick",(opt:any)=>{
      if(opt.target?.type==="i-text") opt.target.enterEditing();
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
      let angle=((obj.angle%360)+360)%360;
      // 90도 스내핑 (±5도 범위)
      const snaps=[0,90,180,270,360];
      for(const s of snaps){
        if(Math.abs(angle-s)<5){ angle=s%360; obj.set({angle}); break; }
      }
      setRotAngle(Math.round(angle));
    });
    fabricRef.current.on("mouse:up",()=>{ setRotAngle(null); });
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
      fabricRef.current.renderAll();
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
      fabricRef.current.renderAll();
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
    if(imgRef.current) applyLayout(imgRef.current,template,w,h,true);
    fabricRef.current.renderAll();
  };

  // ── 이미지 스케일 (핵심 수정) ───────────────────────
  // clipPath 방식 대신 오프스크린 렌더링: top/left로 영역 밖 숨김
  function fillArea(img:any, cw:number, areaTop:number, areaH:number){
    // new Fab.Image(el) 방식: img.width/height = el.naturalWidth/Height (원본 픽셀)
    // scaleX/Y가 1일 때 기준
    const iw = img.width  || 1;
    const ih = img.height || 1;
    // cover: 지정 영역을 꽉 채우는 최소 스케일
    const scale = Math.max(cw / iw, areaH / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    img.set({
      scaleX: scale,
      scaleY: scale,
      left:  (cw - sw) / 2,              // 가로 중앙
      top:   areaTop + (areaH - sh) / 2, // 세로 중앙 (영역 기준)
      selectable: true,
      evented: true,
    });
  }

  // ── 레이아웃 적용 ────────────────────────────────────
  // clipPath 없이 배경 rect로 사진 영역 외부를 덮는 방식
  function applyLayout(img:any, tmpl:Template, cw:number, ch:number, keepLogo?:boolean){
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const fc=fabricRef.current;

    // 로고 보존
    const logoObjs=keepLogo ? fc.getObjects().filter((o:any)=>o.name==="logo") : [];

    // 클리어 후 배경 설정
    fc.clear();
    fc.setBackgroundColor(canvasBg,()=>{});

    if(tmpl==="photo-bottom"){
      const photoH=Math.round(ch*(photoPct/100));
      const textH=ch-photoH;
      fillArea(img,cw,0,photoH);
      fc.add(img);
      // 하단 크림 배경 (사진 영역 외부를 덮음)
      fc.add(new Fab.Rect({left:0,top:photoH,width:cw,height:textH,
        fill:canvasBg,selectable:false,evented:false,name:"layout-bg"}));
      // 세로 초과 부분 마스킹 (사진이 photoH 아래로 삐져나오지 않도록)
      fc.add(new Fab.Rect({left:0,top:photoH,width:cw,height:textH,
        fill:canvasBg,selectable:false,evented:false,name:"layout-mask"}));

    } else if(tmpl==="photo-top"){
      const photoH=Math.round(ch*(photoPct/100));
      const textH=ch-photoH;
      fillArea(img,cw,textH,photoH);
      fc.add(img);
      // 상단 크림 배경
      fc.add(new Fab.Rect({left:0,top:0,width:cw,height:textH,
        fill:canvasBg,selectable:false,evented:false,name:"layout-bg"}));
      // 하단 초과 마스킹
      if(photoH+textH<ch){
        fc.add(new Fab.Rect({left:0,top:ch,width:cw,height:ch,
          fill:canvasBg,selectable:false,evented:false,name:"layout-mask"}));
      }

    } else if(tmpl==="photo-overlay"){
      // cover: 캔버스 전체를 채움
      const scale = Math.max(cw / (img.width||1), ch / (img.height||1));
      img.set({ scaleX:scale, scaleY:scale,
                left:(cw - img.width*scale)/2, top:(ch - img.height*scale)/2,
                selectable:true, evented:true });
      fc.add(img);

    } else if(tmpl==="text-only"){
      // 사진 없이 텍스트만 — img는 추가하지 않음

    } else if(tmpl==="split-v"){
      const scale = Math.max(cw / (img.width||1), ch / (img.height||1));
      img.set({ scaleX:scale, scaleY:scale,
                left:(cw - img.width*scale)/2, top:(ch - img.height*scale)/2,
                selectable:true, evented:true });
      fc.add(img);
      // 하단 크림 오버레이
      fc.add(new Fab.Rect({left:0,top:ch*0.58,width:cw,height:ch*0.42,
        fill:hexToRgba(canvasBg,0.92),selectable:false,evented:false,name:"layout-bg"}));
      // 세로 구분선 — selectable:true 로 이동 가능
      fc.add(new Fab.Rect({left:28,top:ch*0.64,width:2.5,height:ch*0.22,
        fill:dividerColor,selectable:true,evented:true,name:"divider",
        hasControls:true,hasBorders:false,lockScalingX:true}));

    } else if(tmpl==="frame"){
      const scale = Math.max(cw / (img.width||1), ch / (img.height||1));
      img.set({ scaleX:scale, scaleY:scale,
                left:(cw - img.width*scale)/2, top:(ch - img.height*scale)/2,
                selectable:true, evented:true });
      fc.add(img);
      const pad=10;
      // 사진 위에 프레임(배경색) 테두리
      fc.add(new Fab.Rect({left:0,top:0,width:cw,height:pad,fill:canvasBg,selectable:false,evented:false,name:"layout-bg"}));
      fc.add(new Fab.Rect({left:0,top:ch-pad,width:cw,height:pad,fill:canvasBg,selectable:false,evented:false,name:"layout-bg"}));
      fc.add(new Fab.Rect({left:0,top:0,width:pad,height:ch,fill:canvasBg,selectable:false,evented:false,name:"layout-bg"}));
      fc.add(new Fab.Rect({left:cw-pad,top:0,width:pad,height:ch,fill:canvasBg,selectable:false,evented:false,name:"layout-bg"}));
    }

    // 로고 심볼 복원 또는 새로 추가
    if(showSymbol) addSymbol(cw,ch);
  }

  const handleTemplate=(tmpl:Template)=>{
    setTemplate(tmpl);
    if(!fabricRef.current) return;
    const {w,h}=getDims();
    if(tmpl==="text-only"){
      fabricRef.current.clear();
      fabricRef.current.setBackgroundColor(canvasBg,()=>{});
      if(showSymbol) addSymbol(w,h);
      fabricRef.current.renderAll();
    } else if(imgRef.current){
      applyLayout(imgRef.current,tmpl,w,h);
      fabricRef.current.renderAll();
    } else {
      fabricRef.current.clear();
      fabricRef.current.setBackgroundColor(canvasBg,()=>{});
      if(showSymbol) addSymbol(w,h);
      fabricRef.current.renderAll();
    }
  };

  // ── 이미지 업로드 ────────────────────────────────────
  // fromURL 대신 HTMLImageElement 직접 생성 → new Fab.Image(el) 방식
  // 이렇게 해야 naturalWidth/Height가 100% 보장됨
  const loadImage=useCallback((file:File)=>{
    if(file.size>10*1024*1024){showToast("10MB 이하만 가능");return;}
    if(!fabricReady){showToast("에디터 초기화 중...");return;}
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;

    const reader=new FileReader();
    reader.onload=e=>{
      const url=e.target!.result as string;
      const el=new window.Image();
      el.onload=()=>{
        // naturalWidth/Height가 확정된 시점에 Fabric 이미지 객체 생성
        const img=new Fab.Image(el);
        const {w,h}=getDims();
        applyLayout(img,template,w,h);
        imgRef.current=img;
        setImageLoaded(true);
        applyFilter(img);
        fabricRef.current.renderAll();
        showToast("이미지 업로드 완료 ✓");
      };
      el.onerror=()=>showToast("이미지 로드 실패 — 다른 파일로 시도해주세요");
      el.src=url;
    };
    reader.readAsDataURL(file);
  },[fabricReady,template,ratio,photoPct,showSymbol,canvasBg,dividerColor]); // eslint-disable-line

  // ── 포토클리닉 심볼 ──────────────────────────────────
  function addSymbol(cw:number,ch:number){
    removeByName("logo");
    const Fab=getFab(); if(!Fab||!fabricRef.current) return;
    const fc=fabricRef.current;
    const r1=14,r2=9,r3=4;
    const cx=cw/2, cy=ch-38;
    fc.add(new Fab.Path(`M ${cx} ${cy-r1} A ${r1} ${r1} 0 0 0 ${cx} ${cy+r1} Z`,
      {fill:"#E85D2C",selectable:false,evented:false,name:"logo"}));
    fc.add(new Fab.Path(`M ${cx} ${cy-r1} A ${r1} ${r1} 0 0 1 ${cx} ${cy+r1} Z`,
      {fill:"#155855",selectable:false,evented:false,name:"logo"}));
    fc.add(new Fab.Path(`M ${cx} ${cy-r2} A ${r2} ${r2} 0 0 0 ${cx} ${cy+r2} Z`,
      {fill:"#EB8F22",selectable:false,evented:false,name:"logo"}));
    fc.add(new Fab.Path(`M ${cx} ${cy-r2} A ${r2} ${r2} 0 0 1 ${cx} ${cy+r2} Z`,
      {fill:"#569082",selectable:false,evented:false,name:"logo"}));
    fc.add(new Fab.Circle({left:cx,top:cy,radius:r3,fill:"rgba(255,255,255,0.95)",
      originX:"center",originY:"center",selectable:false,evented:false,name:"logo"}));
  }

  const handleToggleSymbol=()=>{
    const next=!showSymbol; setShowSymbol(next);
    if(next){const{w,h}=getDims();addSymbol(w,h);}
    else removeByName("logo");
    fabricRef.current?.renderAll();
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
    fabricRef.current.renderAll();
    showToast("텍스트 적용 ✓ · 더블클릭으로 편집");
  }

  // ── 도형 삽입 ────────────────────────────────────────
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
    if(obj){
      fabricRef.current.add(obj);
      fabricRef.current.setActiveObject(obj);
      fabricRef.current.renderAll();
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
    fabricRef.current.renderAll();
    obj.enterEditing();
  };
  const removeSelected=()=>{
    if(!fabricRef.current) return;
    const active=fabricRef.current.getActiveObjects();
    if(!active.length){showToast("삭제할 객체 선택");return;}
    active.forEach((o:any)=>fabricRef.current.remove(o));
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();
  };
  const bringFwd=()=>{const o=fabricRef.current?.getActiveObject();if(o){fabricRef.current.bringForward(o);fabricRef.current.renderAll();}};
  const sendBwd =()=>{const o=fabricRef.current?.getActiveObject();if(o){fabricRef.current.sendBackwards(o);fabricRef.current.renderAll();}};
  const duplicate=()=>{
    const o=fabricRef.current?.getActiveObject();if(!o) return;
    o.clone((c:any)=>{c.set({left:o.left+18,top:o.top+18});fabricRef.current.add(c);fabricRef.current.renderAll();});
  };
  const rotate90=()=>{
    const o=fabricRef.current?.getActiveObject();if(!o) return;
    o.set({angle:(o.angle+90)%360});fabricRef.current.renderAll();
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
    fabricRef.current.discardActiveObject();fabricRef.current.renderAll();
    const url=fabricRef.current.toDataURL({format:fmt,quality:0.95,multiplier:2});
    const a=document.createElement("a");a.href=url;
    a.download=`photoclinic_${ratio.replace(":","x")}_${Date.now()}.${fmt==="jpeg"?"jpg":"png"}`;
    a.click();showToast("다운로드 완료 ✓");
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
          <button onClick={addFreeText}              style={bS(false)}>+ 텍스트</button>
          <button onClick={()=>addShape("rect")}     style={bS(false)}>□</button>
          <button onClick={()=>addShape("circle")}   style={bS(false)}>○</button>
          <button onClick={()=>addShape("triangle")} style={bS(false)}>△</button>
          <button onClick={()=>addShape("line")}     style={bS(false)}>—</button>
          <button onClick={duplicate}                style={bS(false)}>복제</button>
          <button onClick={rotate90}                 style={bS(false)}>↻90°</button>
          <button onClick={bringFwd}                 style={bS(false)}>앞</button>
          <button onClick={sendBwd}                  style={bS(false)}>뒤</button>
          <button onClick={removeSelected}           style={{...bS(false),color:"#C04020",borderColor:"#FACCB8"}}>삭제</button>
          <div style={{width:1,height:18,background:UI.border}}/>
          <button onClick={handleToggleSymbol} style={bS(showSymbol,UI.teal)}>심볼{showSymbol?" ✓":""}</button>
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

          <div style={{padding:"13px 12px"}}>

          {/* ── 레이아웃 탭 ── */}
          {activeTool==="layout"&&<>
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
                <div style={{marginTop:10}}>
                  <div style={{fontSize:10,color:UI.muted,marginBottom:5,display:"flex",justifyContent:"space-between"}}>
                    <span>사진 비율</span><span style={{color:UI.teal,fontWeight:700}}>{photoPct}%</span>
                  </div>
                  <input type="range" min={30} max={80} value={photoPct} style={{width:"100%",accentColor:UI.teal}}
                    onChange={e=>{
                      setPhotoPct(+e.target.value);
                      if(imgRef.current&&fabricRef.current){
                        const{w,h}=getDims();
                        applyLayout(imgRef.current,template,w,h);
                        fabricRef.current.renderAll();
                      }
                    }}/>
                </div>
              )}
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
                  <div style={{fontSize:9,color:UI.hint,lineHeight:1.5}}>구분선을 드래그해서 위치를 이동할 수 있어요</div>
                </div>
              )}
            </Sec>

            <Sec label="배경 색상" accent={UI.accent}>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                {[CANVAS_BG,"#FFFFFF","#1C2B28","#E5F0EE","#F0EBE0","#2A1A0A"].map(hex=>(
                  <div key={hex} onClick={()=>{setCanvasBg(hex);fabricRef.current?.setBackgroundColor(hex,()=>fabricRef.current.renderAll());}}
                    style={{width:24,height:24,borderRadius:6,background:hex,cursor:"pointer",
                            border:`2px solid ${canvasBg===hex?UI.teal:"rgba(0,0,0,.1)"}`,
                            transform:canvasBg===hex?"scale(1.12)":"scale(1)",transition:"all .15s",
                            boxShadow:hex==="#FFFFFF"?"inset 0 0 0 1px #ddd":"none"}}/>
                ))}
                <input type="color" value={canvasBg} onChange={e=>{setCanvasBg(e.target.value);fabricRef.current?.setBackgroundColor(e.target.value,()=>fabricRef.current.renderAll());}}
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
          <div style={{fontSize:10,color:UI.hint,marginTop:10,textAlign:"center"}}>
            {cw}×{ch}px · {ratio} · 다운로드 2배 · ⌘Z 취소 / ⌘Y 다시실행
          </div>
        </main>
      </div>

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
