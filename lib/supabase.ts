import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;

// Supabase 히스토리 저장
export async function saveDesign(data: {
  hospitalName?: string;
  ratio: string;
  template: string;
  caption: string;
  hashtags: string;
  imageDataUrl: string;   // 썸네일 (다운사이즈)
}) {
  if (!supabase) return null;
  const { data: row, error } = await supabase
    .from("insta_designs")
    .insert({
      hospital_name: data.hospitalName || null,
      ratio:         data.ratio,
      template:      data.template,
      caption:       data.caption,
      hashtags:      data.hashtags,
      thumbnail:     data.imageDataUrl,
      created_at:    new Date().toISOString(),
    })
    .select()
    .single();
  if (error) { console.error("[saveDesign]", error); return null; }
  return row;
}

export async function getHistory(limit = 20) {
  if (!supabase) return [];
  const { data } = await supabase
    .from("insta_designs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}
