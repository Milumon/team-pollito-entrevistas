import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// DELETE /api/regresar/:id — eliminar solicitud
export async function DELETE(request, { params }) {
    const { id } = await params;
    const { error } = await supabaseAdmin
        .from('pollitos_regresar')
        .delete()
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
