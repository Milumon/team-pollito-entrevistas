import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// PUT /api/slots/[id] — actualizar horario (moderadora)
export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { moderator, date, time } = body;

  const updateData = {};
  if (moderator !== undefined) updateData.moderator = moderator;
  if (date !== undefined) updateData.date = date;
  if (time !== undefined) updateData.time = time;

  const { error } = await supabaseAdmin
    .from('slots')
    .update(updateData)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/slots/[id] — eliminar horario (solo admin)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID de horario no proporcionado' }, { status: 400 });
    }

    // Primero eliminamos candidatos asociados para evitar error de FK (si no hay cascade)
    const { error: errorCandidates } = await supabaseAdmin
      .from('pollitos')
      .delete()
      .eq('slot_id', id);

    if (errorCandidates) {
      console.error('Error al eliminar candidatos del slot:', errorCandidates);
      return NextResponse.json({ error: `Error al limpiar candidatos: ${errorCandidates.message}` }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('slots')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar slot:', error);
      return NextResponse.json({ error: `Error al eliminar el horario: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error fatal en DELETE /api/slots/[id]:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
