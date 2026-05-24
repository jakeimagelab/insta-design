import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabase) return NextResponse.json([]);
  const { data } = await supabase
    .from("insta_designs")
    .select("id,hospital_name,ratio,template,caption,thumbnail,created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase not configured" });
  const body = await req.json();
  const { error } = await supabase.from("insta_designs").insert({
    hospital_name: body.hospitalName || null,
    ratio:         body.ratio,
    template:      body.template,
    caption:       body.caption,
    hashtags:      body.hashtags,
    thumbnail:     body.thumbnail,
    created_at:    new Date().toISOString(),
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
