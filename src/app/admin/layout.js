'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const pathname = usePathname();

    // Simple auth persistence in session (optional, but good for local dev)
    useEffect(() => {
        const auth = sessionStorage.getItem('admin_auth');
        if (auth === 'true') setIsAuthenticated(true);
    }, []);

    async function handleLogin(e) {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setIsAuthenticated(true);
                sessionStorage.setItem('admin_auth', 'true');
            } else {
                alert(data.error || 'Credenciales incorrectas');
            }
        } catch (err) {
            alert('Error al conectar con el servidor');
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="login-wrapper">
                <div className="login-card">
                    <h2 className="login-title">Acceso Admin 👑</h2>
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Usuario</label>
                            <input
                                type="text"
                                placeholder="admin"
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contraseña</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-primary">ENTRAR</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <header className="admin-header-v5">
                <div className="header-top-v5">
                    <h1 className="header-logo-v5">Gallinero Admin 🐓</h1>
                    <button
                        onClick={() => {
                            setIsAuthenticated(false);
                            sessionStorage.removeItem('admin_auth');
                        }}
                        className="btn-logout-v5"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                <nav className="admin-tabs-v5">
                    <Link
                        href="/admin/slots"
                        className={`tab-link-v5 ${pathname.includes('/slots') ? 'active' : ''}`}
                    >
                        📅 Entrevistas
                    </Link>
                    <Link
                        href="/admin/candidates"
                        className={`tab-link-v5 ${pathname.includes('/candidates') ? 'active' : ''}`}
                    >
                        🐣 Candidatos
                    </Link>
                    <Link
                        href="/admin/members"
                        className={`tab-link-v5 ${pathname.includes('/members') ? 'active' : ''}`}
                    >
                        👑 Oficiales
                    </Link>
                </nav>
            </header>

            <main className="admin-main-content-v5">
                {children}
            </main>

            <div style={{ textAlign: 'center', padding: '20px' }}>
                <Link href="/" className="footer-link">← Volver a la landing</Link>
            </div>
        </div>
    );
}
