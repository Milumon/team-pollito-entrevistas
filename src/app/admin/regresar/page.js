'use client';

import { useEffect, useState } from 'react';
import { formatDayMonth } from '@/lib/dates';

export default function RegresarPage() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoadingData(true);
            setFetchError(null);
            const res = await fetch('/api/regresar');
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
            setSolicitudes(Array.isArray(data) ? data : []);
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setLoadingData(false);
        }
    }

    async function handleUpdateStatus(id, status) {
        await fetch(`/api/regresar/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        fetchData();
    }

    function openDeleteModal(id) {
        setToDeleteId(id);
        setShowDeleteModal(true);
    }

    function closeDeleteModal() {
        setShowDeleteModal(false);
        setToDeleteId(null);
    }

    async function handleDeleteConfirmed() {
        setShowDeleteModal(false);
        if (toDeleteId) {
            await fetch(`/api/regresar/${toDeleteId}`, { method: 'DELETE' });
            setToDeleteId(null);
            fetchData();
        }
    }

    const sortChronologically = (a, b) => {
        const dateA = a.preferred_date || '9999-12-31';
        const dateB = b.preferred_date || '9999-12-31';
        return dateA.localeCompare(dateB);
    };

    const filteredByTab = solicitudes
        .filter(s => s.status === activeTab)
        .sort(sortChronologically);

    const counts = {
        pending: solicitudes.filter(s => s.status === 'pending').length,
        approved: solicitudes.filter(s => s.status === 'approved').length,
        rejected: solicitudes.filter(s => s.status === 'rejected').length,
    };

    const [promotingIds, setPromotingIds] = useState(new Set());

    async function handlePromoteToMember(candidateId, roblox_user, tiktok_user) {
        if (!confirm(`¿Convertir a @${roblox_user} en Pollito Oficial (Team)?`)) return;

        setPromotingIds(prev => new Set(prev).add(candidateId));
        try {
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roblox_user, tiktok_user }),
            });
            if (res.ok) {
                alert('¡Nuevo miembro oficial añadido! ✨');
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error desconocido');
            }
        } catch (err) {
            alert(`Error al promover: ${err.message}`);
        } finally {
            setPromotingIds(prev => {
                const next = new Set(prev);
                next.delete(candidateId);
                return next;
            });
        }
    }

    return (
        <div className="section-container">
            <div className="section-header-v3">
                <h2 className="section-title-v3">
                    Solicitudes de Regreso
                </h2>
            </div>

            <div className="admin-tabs-v6">
                <button
                    className={`tab-btn-v6 ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pendientes {counts.pending > 0 && <span className="tab-badge-v6">{counts.pending}</span>}
                </button>
                <button
                    className={`tab-btn-v6 ${activeTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                >
                    Calificados {counts.approved > 0 && <span className="tab-badge-v6 blue">{counts.approved}</span>}
                </button>
                <button
                    className={`tab-btn-v6 ${activeTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    Rechazados {counts.rejected > 0 && <span className="tab-badge-v6 red">{counts.rejected}</span>}
                </button>
            </div>

            {fetchError && <div className="error-banner">Error: {fetchError}</div>}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-card" style={{ minWidth: 320, border: '4px solid var(--red)', borderRadius: 20 }}>
                        <h3 style={{ marginBottom: 16, fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)' }}>¿Eliminar esta solicitud?</h3>
                        <p style={{ marginBottom: 22, color: 'var(--ink-soft)' }}>Esta acción no se puede deshacer.</p>
                        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                            <button className="btn-action reject" style={{ fontSize: '1.1rem', padding: '12px 32px', borderRadius: 12 }} onClick={handleDeleteConfirmed}>Eliminar</button>
                            <button className="btn-action" style={{ fontSize: '1.1rem', padding: '12px 32px', borderRadius: 12 }} onClick={closeDeleteModal}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
                justifyContent: 'center',
                padding: '20px 0'
            }}>
                {loadingData ? (
                    <>
                        <div className="skeleton-card skeleton" />
                        <div className="skeleton-card skeleton" />
                        <div className="skeleton-card skeleton" />
                    </>
                ) : filteredByTab.length === 0 && !fetchError ? (
                    <div className="empty-state-v3" style={{ padding: '60px 20px', gridColumn: '1 / -1' }}>
                        <span className="empty-icon-v3">
                            {activeTab === 'pending' ? '🐣' : activeTab === 'approved' ? '✅' : '🚫'}
                        </span>
                        <p>No hay solicitudes en esta sección.</p>
                    </div>
                ) : (
                    filteredByTab.map(s => {
                        const rUser = (s.roblox_user || '').replace(/^@+/, '');
                        
                        return (
                            <div key={s.id} className="pollito-card" style={{ 
                                transform: `rotate(${(Math.random() * 1.5 - 0.75).toFixed(1)}deg)`, 
                                border: '3px solid var(--ink)', 
                                margin: 0, 
                                minWidth: 280, 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                textAlign: 'center', 
                                gap: '12px',
                                position: 'relative'
                            }}>
                                {/* Meta actions top-right */}
                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px', zIndex: 10 }}>
                                    {s.status !== 'pending' && (
                                        <button onClick={() => handleUpdateStatus(s.id, 'pending')} className="btn-icon-v3" title="Deshacer" style={{ border: '1px solid rgba(0,0,0,0.1)', background: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↩️</button>
                                    )}
                                    <button onClick={() => openDeleteModal(s.id)} className="btn-icon-v3" title="Eliminar definitivamente" style={{ border: '1px solid rgba(0,0,0,0.1)', background: 'var(--red)', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                                </div>

                                <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid var(--ink)`, background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginTop: 12 }}>
                                    🐣
                                </div>
                                
                                <span className="pollito-name" style={{ alignSelf: 'stretch', textAlign: 'center' }}>Roblox: @{rUser}</span>
                                <div className="pollito-name" style={{ marginTop: -8, alignSelf: 'stretch', textAlign: 'center' }}>
                                    TikTok: <a
                                        href={`https://www.tiktok.com/search/user?q=${(s.tiktok_user || '').replace(/^@+/, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--ink)', textDecoration: 'underline' }}
                                    >
                                        @{(s.tiktok_user || '').replace(/^@+/, '')}
                                    </a>
                                </div>

                                <div style={{
                                    width: '100%',
                                    background: 'var(--cream)',
                                    border: '1.5px solid var(--ink)',
                                    borderRadius: 12,
                                    padding: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                    boxShadow: 'var(--shadow-sm)',
                                    textAlign: 'left'
                                }}>
                                    <div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                                            fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 800,
                                            textTransform: 'uppercase', color: 'var(--red)'
                                        }}>
                                            🚫 Motivo Baneo
                                        </div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
                                            {s.ban_reason}
                                        </p>
                                    </div>
                                    <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: 10 }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                                            fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 800,
                                            textTransform: 'uppercase', color: 'var(--mint)'
                                        }}>
                                            💚 Motivo Regreso
                                        </div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
                                            {s.return_reason}
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.04)',
                                    borderRadius: '12px',
                                    border: '1px dashed rgba(0,0,0,0.1)',
                                    padding: '8px',
                                    marginTop: '4px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--ink)' }}>
                                        <span>📅 {s.preferred_date ? formatDayMonth(s.preferred_date) : 'No especificada'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: 'auto' }}>
                                    {s.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(s.id, 'approved')} className="btn-v3 approve" style={{ width: '100%' }}>Asignar Entrevista ✅</button>
                                            <button onClick={() => handleUpdateStatus(s.id, 'rejected')} className="btn-v3 reject" style={{ width: '100%' }}>Rechazar ❌</button>
                                        </>
                                    )}
                                    {s.status === 'approved' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(s.id, 'rejected')}
                                                className="btn-v3 reject"
                                                style={{ width: '100%', fontSize: '0.85rem' }}
                                            >
                                                No pasó entrevista ❌
                                            </button>
                                            <button
                                                onClick={() => handlePromoteToMember(s.id, s.roblox_user, s.tiktok_user)}
                                                className="btn-v3 approve"
                                                disabled={promotingIds.has(s.id)}
                                                style={{ width: '100%', fontSize: '0.85rem', padding: '10px 8px' }}
                                            >
                                                {promotingIds.has(s.id) ? '⏳ Promoviendo...' : '🐣 Convertir en Oficial'}
                                            </button>
                                        </>
                                    )}
                                    {s.status === 'rejected' && (
                                        <div className="status-badge-v3" style={{ padding: '10px', fontSize: '0.85rem' }}>🚫 RECHAZADA</div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
