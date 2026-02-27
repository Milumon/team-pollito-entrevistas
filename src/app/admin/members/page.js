'use client';

import { useEffect, useState } from 'react';

export default function MembersPage() {
    const [members, setMembers] = useState([]);
    const [robloxUser, setRobloxUser] = useState('');
    const [tiktokUser, setTiktokUser] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setFetchError(null);
            const res = await fetch('/api/members');
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
            setMembers(Array.isArray(data) ? data : []);
        } catch (err) {
            setFetchError(err.message);
        }
    }

    async function handleAddMember(e) {
        e.preventDefault();
        if (!robloxUser || !tiktokUser) return;
        setLoading(true);
        try {
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roblox_user: robloxUser, tiktok_user: tiktokUser }),
            });
            if (!res.ok) throw new Error();
            setRobloxUser('');
            setTiktokUser('');
            fetchData();
        } catch {
            alert('Error al agregar miembro oficial');
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteMember(id) {
        if (!confirm('¿Seguro que deseas eliminar este miembro del Team Oficial?')) return;
        await fetch(`/api/members/${id}`, { method: 'DELETE' });
        fetchData();
    }

    const rot = () => `${(Math.random() * 1.5 - 0.75).toFixed(1)}deg`;

    return (
        <div className="section-container">
            <div className="section-header-v3">
                <h2 className="section-title-v3">Pollitos Oficiales (Team) 👑</h2>
            </div>

            <div className="card" style={{ marginBottom: 32, border: '4px solid var(--ink)' }}>
                <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-display)' }}>Añadir Miembro Manualmente</h3>
                <form onSubmit={handleAddMember} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Roblox User</label>
                        <input
                            type="text"
                            placeholder="Ej: RobloxPlayer"
                            required
                            value={robloxUser}
                            onChange={e => setRobloxUser(e.target.value)}
                            style={{ width: '100%', padding: '10px' }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>TikTok User</label>
                        <input
                            type="text"
                            placeholder="Ej: TikTokFan"
                            required
                            value={tiktokUser}
                            onChange={e => setTiktokUser(e.target.value)}
                            style={{ width: '100%', padding: '10px' }}
                        />
                    </div>
                    <div style={{ alignSelf: 'flex-end' }}>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px 24px' }}>
                            {loading ? 'AGREGANDO...' : 'AGREGAR 🐣'}
                        </button>
                    </div>
                </form>
            </div>

            {fetchError && <div className="error-banner">Error: {fetchError}</div>}

            <div className="candidates-container-v4">
                {members.length === 0 && !fetchError ? (
                    <div className="empty-state-v3" style={{ padding: '40px 20px' }}>
                        <span className="empty-icon-v3">🏜️</span>
                        <p>Aún no hay miembros oficiales en la lista.</p>
                    </div>
                ) : (
                    members.map(m => (
                        <div key={m.id} className="candidate-card-v2" style={{ transform: `rotate(${rot()})`, border: '3px solid var(--yellow)' }}>
                            <div className="candidate-info-v2">
                                <div className="candidate-primary-v2" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                    <span className="candidate-roblox">Roblox: @{(m.roblox_user || '').replace(/^@+/, '')}</span>
                                    <span className="candidate-tiktok">
                                        TikTok: <a
                                            href={`https://www.tiktok.com/search/user?q=${(m.tiktok_user || '').replace(/^@+/, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'inherit', textDecoration: 'underline' }}
                                        >
                                            @{(m.tiktok_user || '').replace(/^@+/, '')}
                                        </a>
                                    </span>
                                </div>
                                <div className="candidate-schedule-v2" style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }}>
                                    Miembro desde: {new Date(m.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="candidate-footer-v2">
                                <div className="candidate-status-area-v2">
                                    <span className="badge-official" style={{ background: 'var(--yellow)', color: 'var(--ink)' }}>POLLITO OFICIAL</span>
                                </div>
                                <div className="candidate-meta-actions-v2">
                                    <button onClick={() => handleDeleteMember(m.id)} className="btn-delete-pollito-v2">🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
