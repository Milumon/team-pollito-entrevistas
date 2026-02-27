import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/slots — todos los slots disponibles para el formulario público
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('slots')
    .select('id, date, time, moderator')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/slots — agregar nuevo horario (solo admin)
export async function POST(request) {
  const body = await request.json();
  const { date, time, moderator } = body;

  if (!date || !time) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('slots')
    .insert({ date, time, moderator })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
