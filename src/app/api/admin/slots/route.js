import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/admin/slots — todos los slots (incluyendo reservados) para el panel admin
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('slots')
    .select('id, date, time, is_booked, moderator')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
