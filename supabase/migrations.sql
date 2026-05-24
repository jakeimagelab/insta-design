-- 인스타그램 디자인 히스토리 테이블
create table if not exists insta_designs (
  id            uuid primary key default gen_random_uuid(),
  hospital_name text,
  ratio         text not null,
  template      text not null,
  caption       text,
  hashtags      text,
  thumbnail     text,     -- base64 소형 썸네일
  created_at    timestamptz default now()
);

-- RLS 비활성화 (내부 도구용, 필요시 활성화)
alter table insta_designs disable row level security;
