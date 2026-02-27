import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// PUT /api/slots/[id] — actualizar horario (moderadora)
export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { moderator } = body;

  const { error } = await supabaseAdmin
    .from('slots')
    .update({ moderator })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/slots/[id] — eliminar horario (solo admin)
export async function DELETE(request, { params }) {
  const { id } = await params;

  // Primero eliminamos candidatos asociados para evitar error de FK (si no hay cascade)
  await supabaseAdmin
    .from('pollitos')
    .delete()
    .eq('slot_id', id);

  const { error } = await supabaseAdmin
    .from('slots')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
