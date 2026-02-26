import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// PUT /api/pollitos/[id]/status — actualizar estado (pending | official | rejected)
export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!['pending', 'official', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('pollitos')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
