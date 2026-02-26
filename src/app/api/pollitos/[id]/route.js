import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// DELETE /api/pollitos/[id] — eliminar candidato
export async function DELETE(_request, { params }) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('pollitos')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
