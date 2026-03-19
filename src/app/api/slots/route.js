import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/slots — todos los slots disponibles para el formulario público
export async function GET() {
  // Los usuarios deben poder escoger hasta 5 horas antes de la entrevista
  const targetDate = new Date();
  targetDate.setHours(targetDate.getHours() + 5);
  
  const limitIso = targetDate.toISOString();
  const dateStr = limitIso.split('T')[0];
  const timeStr = limitIso.split('T')[1].slice(0, 8);

  const { data, error } = await supabaseAdmin
    .from('slots')
    .select('id, date, time, moderator')
    .or(`date.gt.${dateStr},and(date.eq.${dateStr},time.gte.${timeStr})`)
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
