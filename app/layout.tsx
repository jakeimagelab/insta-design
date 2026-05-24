import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "포토클리닉 AI 도구",
  description: "포토클리닉 병원 사진 AI 도구 모음",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=DM+Serif+Display&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Gothic:wght@400;700&family=Do+Hyeon&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-thumb { background: #DCE8E5; border-radius: 3px; }
          input[type=range] { accent-color: #155855; }
        `}</style>
        {children}
      </body>
    </html>
  );
}
