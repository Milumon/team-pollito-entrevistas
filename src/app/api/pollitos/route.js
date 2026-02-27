import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/pollitos — todos los pollitos con info del slot (via la vista)
// GET /api/pollitos — todos los pollitos con info del slot
export async function GET() {
  // Consultamos directamente con JOIN para evitar problemas si la vista de la DB está desactualizada
  const { data, error } = await supabaseAdmin
    .from('pollitos')
    .select(`
      *,
      slots (
        date,
        time,
        moderator
      )
    `)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aplanamos el resultado para que el frontend siga recibiendo date, time y moderator al mismo nivel
  const flattened = data.map(p => ({
    ...p,
    date: p.slots?.date,
    time: p.slots?.time,
    moderator: p.slots?.moderator,
    slot_id: p.slot_id
  }));

  return NextResponse.json(flattened);
}

// POST /api/pollitos — registrar nuevo candidato
export async function POST(request) {
  const body = await request.json();
  const { roblox_user, tiktok_user, slot_id } = body;

  if (!roblox_user || !tiktok_user || !slot_id) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
  }

  // Obtener IP del cliente (Next.js 13+ headers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

  // Limpiar nombres para consistencia en el chequeo
  const cleanRoblox = roblox_user.trim().toLowerCase().replace(/^@+/, '');
  const cleanTiktok = tiktok_user.trim().toLowerCase().replace(/^@+/, '');

  // 1. Chequear límites por IP o Nombre de Usuario
  // Permitimos máximo 2 postulaciones por IP o por usuario
  const { data: existingCount, error: countError } = await supabaseAdmin
    .from('pollitos')
    .select('id', { count: 'exact' })
    .or(`ip.eq.${ip},roblox_user.ilike.%${cleanRoblox}%,tiktok_user.ilike.%${cleanTiktok}%`);

  if (countError) {
    console.error('Error checking limits:', countError);
  } else if (existingCount && existingCount.length >= 2) {
    return NextResponse.json({
      error: 'Has alcanzado el límite máximo de 2 postulaciones. ¡Mucha suerte con las que ya enviaste! 🐣'
    }, { status: 429 });
  }

  // 2. Insertar el pollito con su IP
  const { data, error } = await supabaseAdmin
    .from('pollitos')
    .insert({
      roblox_user,
      tiktok_user,
      slot_id,
      ip
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
