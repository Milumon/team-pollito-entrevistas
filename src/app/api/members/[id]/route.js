import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// DELETE /api/members/[id] — eliminar miembro oficial
export async function DELETE(_request, { params }) {
    const { id } = await params;

    const { error } = await supabaseAdmin
        .from('members')
        .delete()
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
