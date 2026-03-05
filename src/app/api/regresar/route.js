import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/regresar — todos los pollitos que solicitan regresar
export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('pollitos_regresar')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
}

// POST /api/regresar — nueva solicitud de regreso
export async function POST(request) {
    const ip = request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        'unknown';

    const body = await request.json();
    const { roblox_user, tiktok_user, ban_reason, return_reason, preferred_date, website, ts } = body;

    // 1. Honeypot check
    if (website) {
        return NextResponse.json({ error: '🤖 Bot detectado.' }, { status: 403 });
    }

    // 2. Timing check
    const now = Date.now();
    if (!ts || now - ts < 3000) {
        return NextResponse.json({ error: '⚡ Solicitud demasiado rápida. Por favor tómate tu tiempo.' }, { status: 403 });
    }

    if (!roblox_user || !tiktok_user || !ban_reason || !return_reason || !preferred_date) {
        return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const cleanRoblox = roblox_user.trim().toLowerCase().replace(/^@+/, '');
    const cleanTiktok = tiktok_user.trim().toLowerCase().replace(/^@+/, '');

    // Chequear duplicados
    const { data: existingRecords, error: countError } = await supabaseAdmin
        .from('pollitos_regresar')
        .select('id, roblox_user, tiktok_user, ip')
        .or(`ip.eq.${ip},roblox_user.ilike.${cleanRoblox},tiktok_user.ilike.${cleanTiktok}`);

    if (countError) {
        console.error('Error checking limits:', countError);
    } else if (existingRecords && existingRecords.length >= 1) {
        return NextResponse.json({
            error: 'Ya tienes una solicitud de regreso registrada. Solo se permite una por usuario. 🐣'
        }, { status: 429 });
    }

    const { data, error } = await supabaseAdmin
        .from('pollitos_regresar')
        .insert({
            roblox_user: cleanRoblox,
            tiktok_user: cleanTiktok,
            ban_reason: ban_reason.trim(),
            return_reason: return_reason.trim(),
            preferred_date,
            ip
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data, { status: 201 });
}
