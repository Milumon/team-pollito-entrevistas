import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// DELETE /api/slots/[id] — eliminar horario (solo admin)
export async function DELETE(request, { params }) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('slots')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
