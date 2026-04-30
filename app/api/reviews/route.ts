import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to save review';
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const { name, rating, comment } = await req.json();

    const { error } = await supabaseAdmin
      .from('reviews')
      .insert({ name, rating, comment });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
