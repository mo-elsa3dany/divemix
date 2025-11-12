import { NextResponse } from 'next/server';
import { supa } from '../../../lib/supabase';

function code(n = 7) {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join(
    '',
  );
}

export async function GET() {
  const { data, error } = await supa
    .from('plans')
    .select('id,created_at,units,tech,gf_lo,gf_hi,code')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const payload = {
    units: body.units ?? 'm',
    tech: !!body.tech,
    gf_lo: body.gfLo ?? 30,
    gf_hi: body.gfHi ?? 85,
    dives_json: body.dives ?? [],
    code: code(),
  };
  const { data, error } = await supa
    .from('plans')
    .insert(payload)
    .select('id,code')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
