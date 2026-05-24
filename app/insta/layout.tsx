import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "포토클리닉 — 인스타그램 디자인 생성기",
  description: "Claude AI + Fabric.js 기반 병원 인스타그램 콘텐츠 자동 생성",
};

export default function InstaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav style={{ background:"#fff", borderBottom:"1px solid #DCE8E5", height:60, padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <a href="/insta" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
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
            <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:15, color:"#1C2B28" }}>PHOTO CLINIC</div>
            <div style={{ fontSize:9, color:"#5A7470", letterSpacing:".08em" }}>인스타그램 디자인 생성기</div>
          </div>
        </a>
        <span style={{ fontSize:11, background:"#E5F0EE", color:"#155855", padding:"4px 12px", borderRadius:20, fontWeight:700 }}>Claude API + Fabric.js</span>
      </nav>
      {children}
    </>
  );
}
