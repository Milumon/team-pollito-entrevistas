'use client';

import { useEffect, useState } from 'react';

export default function MembersPage() {
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [robloxUser, setRobloxUser] = useState('');
    const [tiktokUser, setTiktokUser] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Edit state
    const [editingMember, setEditingMember] = useState(null);
    const [editRoblox, setEditRoblox] = useState('');
    const [editTiktok, setEditTiktok] = useState('');
    const [editCreatedAt, setEditCreatedAt] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

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

    function openEditModal(member) {
        setEditingMember(member);
        setEditRoblox(member.roblox_user || '');
        setEditTiktok(member.tiktok_user || '');
        if (member.created_at) {
            // Convierte a datetime-local format format "YYYY-MM-DDTHH:mm"
            const localDate = new Date(member.created_at);
            localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
            setEditCreatedAt(localDate.toISOString().slice(0, 16));
        } else {
            setEditCreatedAt('');
        }
    }

    async function handleUpdateMember(e) {
        e.preventDefault();
        if (!editingMember) return;
        setIsUpdating(true);
        try {
            const dtObj = new Date(editCreatedAt);
            
            const res = await fetch(`/api/members/${editingMember.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    roblox_user: editRoblox, 
                    tiktok_user: editTiktok,
                    created_at: dtObj.toISOString()
                }),
            });
            if (!res.ok) throw new Error();
            setEditingMember(null);
            fetchData();
        } catch {
            alert('Error al actualizar miembro');
        } finally {
            setIsUpdating(false);
        }
    }

    const rot = () => `${(Math.random() * 1.5 - 0.75).toFixed(1)}deg`;

    const searchedMembers = members.filter(m => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return m.roblox_user?.toLowerCase().includes(term) || m.tiktok_user?.toLowerCase().includes(term);
    });

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const isNew = (m) => m.created_at && new Date(m.created_at) >= twoDaysAgo;

    return (
        <div className="section-container">
            <div className="section-header-v3">
                <h2 className="section-title-v3">Pollitos Oficiales (Team) 👑</h2>
            </div>
            
            {/* Search Bar */}
            <div className="filters-container" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                <input 
                    type="text" 
                    placeholder="🔍 Buscar por usuario de Roblox o TikTok..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '0.95rem', minWidth: '250px', background: 'white' }}
                />
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

            {members.length === 0 && !fetchError ? (
                <div className="empty-state-v3" style={{ padding: '40px 20px' }}>
                    <span className="empty-icon-v3">🏜️</span>
                    <p>Aún no hay miembros oficiales en la lista.</p>
                </div>
            ) : searchedMembers.length === 0 ? (
                <div className="empty-state-v3" style={{ padding: '40px 20px' }}>
                    <span className="empty-icon-v3">🔍</span>
                    <p>No hay resultados para "{searchTerm}"</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 16,
                    justifyContent: 'center',
                    padding: '20px 0'
                  }}>
                    {searchedMembers.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(m => {
                        const rUser = (m.roblox_user || '').replace(/^@+/, '');
                        const avatarUrl = m.avatar_url;
                        const memberIsNew = isNew(m);
                        
                        return (
                            <div key={m.id} className={`pollito-card${memberIsNew ? ' member-card-new' : ''}`} style={{ transform: `rotate(${rot()})`, border: memberIsNew ? '3px solid var(--orange)' : '3px solid var(--yellow)', margin: 0, minWidth: 200, flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', position: 'relative' }}>
                              
                              {/* Edit & Delete Actions (Admin only) */}
                              <div style={{ position: 'absolute', top: '-10px', right: '-10px', display: 'flex', gap: '6px', zIndex: 10 }}>
                                  <button onClick={() => openEditModal(m)} className="btn-edit-v2" style={{ border: 'none', background: 'white', borderRadius: '50%', width: 36, height: 36, fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>✏️</button>
                                  <button onClick={() => handleDeleteMember(m.id)} className="btn-delete-pollito-v2" style={{ border: 'none', background: 'white', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🗑️</button>
                              </div>

                              {memberIsNew && <span className="new-member-sparkle" aria-hidden="true">✨</span>}
                              
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={rUser}
                                  style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid ${memberIsNew ? 'var(--orange)' : 'var(--ink)'}`, background: 'var(--cream)', marginBottom: 4 }}
                                />
                              ) : (
                                <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid ${memberIsNew ? 'var(--orange)' : 'var(--ink)'}`, background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: 4 }}>
                                  🐣
                                </div>
                              )}
                              
                              <span className="pollito-name" style={{ alignSelf: 'stretch', textAlign: 'start' }}>Roblox: @{rUser}</span>
                              <div className="pollito-name" style={{ marginTop: -4, alignSelf: 'stretch', textAlign: 'start' }}>
                                TikTok: <a
                                  href={`https://www.tiktok.com/search/user?q=${(m.tiktok_user || '').replace(/^@+/, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--ink)', textDecoration: 'underline' }}
                                >
                                  @{(m.tiktok_user || '').replace(/^@+/, '')}
                                </a>
                              </div>

                              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: 4 }}>
                                Unida el: {new Date(m.created_at).toLocaleDateString()}
                              </div>

                              {memberIsNew ? (
                                <span className="badge-new-member" style={{ marginTop: 4 }}>🎉 ¡NUEVO!</span>
                              ) : (
                                <span className="badge-official" style={{ fontSize: '0.75rem', marginTop: 4 }}>POLLITO OFICIAL</span>
                              )}

                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Editar */}
            {editingMember && (
                <div className="modal-overlay">
                    <div className="modal-card-v3" style={{ maxWidth: 450 }}>
                        <div className="modal-header-v3">
                            <h3>Editar Pollito Oficial 👑</h3>
                            <button onClick={() => setEditingMember(null)} className="close-btn">×</button>
                        </div>
                        <form onSubmit={handleUpdateMember}>
                            <div className="modal-body-v3">
                                <div className="input-group-v3">
                                    <label>Roblox User</label>
                                    <input
                                        type="text"
                                        value={editRoblox}
                                        onChange={e => setEditRoblox(e.target.value)}
                                        required
                                        placeholder="Ej: RobloxPlayer"
                                    />
                                </div>
                                <div className="input-group-v3" style={{ marginTop: 16 }}>
                                    <label>TikTok User</label>
                                    <input
                                        type="text"
                                        value={editTiktok}
                                        onChange={e => setEditTiktok(e.target.value)}
                                        required
                                        placeholder="Ej: TikTokFan"
                                    />
                                </div>
                                <div className="input-group-v3" style={{ marginTop: 16 }}>
                                    <label>Fecha de Ingreso</label>
                                    <input
                                        type="datetime-local"
                                        value={editCreatedAt}
                                        onChange={e => setEditCreatedAt(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer-v3">
                                <button type="submit" disabled={isUpdating} className="btn-primary-v3">
                                    {isUpdating ? 'GUARDANDO...' : 'GUARDAR CAMBIOS ✨'}
                                </button>
                                <button type="button" onClick={() => setEditingMember(null)} className="btn-secondary-v3">
                                    CANCELAR
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
