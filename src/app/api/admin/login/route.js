import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        const correctUser = process.env.ADMIN_USERNAME || process.env.ADMIN_USER;
        const correctPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS;

        if (!correctUser || !correctPass) {
            console.error('SERVER ERROR: Admin credentials not set in environment variables.');
            return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 });
        }

        if (username === correctUser && password === correctPass) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
