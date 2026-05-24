import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "포토클리닉 — 인스타그램 디자인 생성기",
  description: "Claude AI + Fabric.js 기반 병원 인스타그램 콘텐츠 자동 생성",
};

export default function InstaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=DM+Serif+Display&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Gothic:wght@400;700&family=Do+Hyeon&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Noto Sans KR', sans-serif; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #DCE8E5; border-radius: 3px; }
        input[type=range] { accent-color: #155855; }
      `}</style>

      {/* 공통 NAV */}
      <nav style={{ background:"#fff", borderBottom:"1px solid #DCE8E5", height:60, padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{ width:30, height:30, background:"#155855", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" fill="#E85D2C"/>
              <circle cx="9" cy="9" r="8" fill="#155855" clipPath="url(#nr)"/>
              <defs><clipPath id="nr"><rect x="9" y="0" width="9" height="18"/></clipPath></defs>
              <circle cx="9" cy="9" r="5.5" fill="#EB8F22"/>
              <circle cx="9" cy="9" r="5.5" fill="#569082" clipPath="url(#nr)"/>
              <circle cx="9" cy="9" r="3" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:"DM Serif Display, serif", fontSize:15, color:"#1C2B28" }}>PHOTO CLINIC</div>
            <div style={{ fontSize:9, color:"#5A7470", letterSpacing:".08em" }}>인스타그램 디자인 생성기</div>
          </div>
        </a>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:11, background:"#E5F0EE", color:"#155855", padding:"4px 12px", borderRadius:20, fontWeight:700 }}>Claude API + Fabric.js</span>
          <a href="/" style={{ fontSize:12, color:"#5A7470", textDecoration:"none", padding:"6px 14px", border:"1px solid #DCE8E5", borderRadius:8 }}>← 대시보드</a>
        </div>
      </nav>
      {children}
    </>
  );
}
