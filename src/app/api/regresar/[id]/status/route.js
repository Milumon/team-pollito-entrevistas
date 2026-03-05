import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// PUT /api/regresar/:id/status — actualizar estado
export async function PUT(request, { params }) {
    const { id } = await params;
    const { status } = await request.json();

    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('pollitos_regresar')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
