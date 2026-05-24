# 포토클리닉 인스타그램 디자인 생성기

Claude API + Fabric.js 기반 병원 인스타그램 콘텐츠 자동 생성 도구

## 기능
- 사진 업로드 → 1:1 / 4:5 / 9:16 자동 비율 적용
- 4가지 레이아웃 템플릿 (하단/오버레이/상단/미니멀)
- Claude API로 캡션 3종 + 해시태그 20개 자동 생성
- 직접 텍스트 입력 및 캔버스 편집 (더블클릭)
- 폰트 4종 + 텍스트 크기 슬라이더
- 포토클리닉 로고 자동 삽입
- PNG/JPG 2배 해상도 다운로드
- Supabase 히스토리 저장 (선택)

## 설치 & 실행
```bash
npm install
cp .env.example .env.local
# .env.local에 API 키 입력
npm run dev
```

## 접속
http://localhost:3000/insta

## Supabase 설정 (선택)
supabase/migrations.sql 을 Supabase SQL 에디터에서 실행

## 환경변수
| 변수 | 설명 | 필수 |
|------|------|------|
| ANTHROPIC_API_KEY | Claude API 키 | 캡션 생성 시 필요 |
| NEXT_PUBLIC_SUPABASE_URL | Supabase URL | 히스토리 저장 시 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Anon Key | 히스토리 저장 시 |

## AI 없이도 사용 가능
ANTHROPIC_API_KEY 없이도 샘플 캡션으로 동작합니다.
Supabase 없이도 다운로드 기능은 정상 작동합니다.
