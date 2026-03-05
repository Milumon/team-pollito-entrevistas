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

// PATCH /api/members/[id] — actualizar miembro oficial
export async function PATCH(request, context) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { roblox_user, tiktok_user } = body;

        if (!roblox_user && !tiktok_user) {
            return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
        }

        const updateData = {};
        if (roblox_user) updateData.roblox_user = roblox_user;
        if (tiktok_user) updateData.tiktok_user = tiktok_user;

        // Si cambio el roblox_user, refrescamos el avatar
        if (roblox_user) {
            try {
                const { getRobloxAvatar } = await import('@/lib/roblox');
                const newAvatar = await getRobloxAvatar(roblox_user);
                if (newAvatar) updateData.avatar_url = newAvatar;
            } catch (e) {
                console.error('Error refreshing avatar on PATCH:', e);
            }
        }

        const { data, error } = await supabaseAdmin
            .from('members')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error PATCH members:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error('Critical Error PATCH members:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
