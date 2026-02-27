import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// DELETE /api/pollitos/[id] — eliminar candidato
export async function DELETE(_request, { params }) {
  const { id } = await params;

  // Obtenemos el slot_id antes de borrar
  const { data: pollito } = await supabaseAdmin
    .from('pollitos')
    .select('slot_id')
    .eq('id', id)
    .single();

  const { error } = await supabaseAdmin
    .from('pollitos')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Si se borró con éxito, verificamos si quedan más pollitos para ese slot
  if (pollito?.slot_id) {
    const { count } = await supabaseAdmin
      .from('pollitos')
      .select('*', { count: 'exact', head: true })
      .eq('slot_id', pollito.slot_id);

    if (count === 0) {
      // Si ya no hay pollitos, marcamos el slot como no reservado
      await supabaseAdmin
        .from('slots')
        .update({ is_booked: false })
        .eq('id', pollito.slot_id);
    }
  }

  return NextResponse.json({ ok: true });
}
