import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'ingresar' or 'regresar'

    const ip = request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        'unknown';

    if (ip === 'unknown') {
        return NextResponse.json({ allowed: true });
    }

    const table = type === 'regresar' ? 'pollitos_regresar' : 'pollitos';
    const limit = type === 'regresar' ? 1 : 2;

    const { data: existingRecords, error } = await supabaseAdmin
        .from(table)
        .select('created_at')
        .eq('ip', ip);

    if (error) {
        console.error('Error checking status:', error);
        return NextResponse.json({ allowed: true });
    }

    if (existingRecords && existingRecords.length >= limit) {
        // Find the most recent date
        const lastDate = new Date(Math.max(...existingRecords.map(r => new Date(r.created_at))));

        return NextResponse.json({
            allowed: false,
            count: existingRecords.length,
            limit,
            lastDate: lastDate.toISOString(),
            // Suggesting 7 days later for kids as a 'cooldown' or just a friendly message
            retryDate: new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    return NextResponse.json({ allowed: true });
}
