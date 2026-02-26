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

  // Insertar pollito y marcar el slot como reservado en una transacción
  const { data, error } = await supabaseAdmin
    .from('pollitos')
    .insert({ roblox_user, tiktok_user, slot_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Marcar slot como reservado
  await supabaseAdmin
    .from('slots')
    .update({ is_booked: true })
    .eq('id', slot_id);

  return NextResponse.json(data, { status: 201 });
}
