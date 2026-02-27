import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/members — obtener todos los miembros oficiales
export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/members — añadir miembro manualmente o por promoción
export async function POST(request) {
    const body = await request.json();
    console.log('API Members POST Body:', body);
    const { roblox_user, tiktok_user } = body;

    if (!roblox_user || !tiktok_user) {
        console.error('API Members POST Missing fields:', { roblox_user, tiktok_user });
        return NextResponse.json({ error: 'Faltan campos (roblox_user o tiktok_user)' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('members')
        .insert({ roblox_user, tiktok_user })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
