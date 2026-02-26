import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/pollitos — todos los pollitos con info del slot (via la vista)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('pollitos_with_slot')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/pollitos — registrar nuevo candidato
export async function POST(request) {
  const body = await request.json();
  const { roblox_user, tiktok_user, slot_id } = body;

  if (!roblox_user || !tiktok_user || !slot_id) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
  }

  // 1. Reservar el slot atómicamente (solo si aún no está reservado)
  const { data: updatedSlot, error: slotError } = await supabaseAdmin
    .from('slots')
    .update({ is_booked: true })
    .eq('id', slot_id)
    .eq('is_booked', false)
    .select()
    .single();

  if (slotError || !updatedSlot) {
    return NextResponse.json(
      { error: 'Este horario ya fue reservado. Por favor elige otro.' },
      { status: 409 }
    );
  }

  // 2. Insertar el pollito (el slot ya está marcado como reservado)
  const { data, error } = await supabaseAdmin
    .from('pollitos')
    .insert({ roblox_user, tiktok_user, slot_id })
    .select()
    .single();

  if (error) {
    // Revertir la reserva si falla la inserción
    await supabaseAdmin
      .from('slots')
      .update({ is_booked: false })
      .eq('id', slot_id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
