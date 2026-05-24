import type { Metadata } from "next";
export const metadata: Metadata = { title: "포토클리닉 인스타 디자이너" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=Noto+Serif+KR:wght@400;600&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Gothic:wght@400;700&family=Do+Hyeon&family=Black+Han+Sans&family=Gaegu&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin:0, padding:0, fontFamily:"'Noto Sans KR',sans-serif", background:"#111" }}>
        <style>{`
          @keyframes spin { to { transform:rotate(360deg); } }
          * { box-sizing:border-box; margin:0; padding:0; }
          ::-webkit-scrollbar { width:4px; }
          ::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }
          input[type=range] { accent-color:#E85D2C; }
          textarea { font-family: inherit; }
        `}</style>
        {children}
      </body>
    </html>
  );
}
