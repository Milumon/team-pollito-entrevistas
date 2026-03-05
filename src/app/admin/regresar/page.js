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

            <div className="candidates-container-v4">
                {loadingData ? (
                    <>
                        <div className="skeleton-card skeleton" />
                        <div className="skeleton-card skeleton" />
                        <div className="skeleton-card skeleton" />
                    </>
                ) : filteredByTab.length === 0 && !fetchError ? (
                    <div className="empty-state-v3" style={{ padding: '60px 20px' }}>
                        <span className="empty-icon-v3">
                            {activeTab === 'pending' ? '🐣' : activeTab === 'approved' ? '✅' : '🚫'}
                        </span>
                        <p>No hay solicitudes en esta sección.</p>
                    </div>
                ) : (
                    filteredByTab.map(s => (
                        <div key={s.id} className="candidate-card-v3">
                            <div className="candidate-info-row-v3">
                                <div className="candidate-main-v3">
                                    <span className="candidate-roblox-v3">{s.roblox_user}</span>
                                    <span className="candidate-tiktok-v3">
                                        TikTok: <a
                                            href={`https://www.tiktok.com/search/user?q=${s.tiktok_user}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'inherit', textDecoration: 'underline' }}
                                        >
                                            {s.tiktok_user}
                                        </a>
                                    </span>
                                </div>

                                <div className="candidate-schedule-v3">
                                    <div className="schedule-item-v3">
                                        <span className="schedule-icon-v3">📅</span>
                                        <div className="schedule-text-v3">
                                            <strong>{formatDayMonth(s.preferred_date)}</strong>
                                            <span>Fecha Deseada</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Razones — visibles solo en admin */}
                            <div style={{
                                background: 'var(--cream)',
                                border: '2.5px solid var(--ink)',
                                borderRadius: 16,
                                padding: '16px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 14,
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <div>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                                        fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 800,
                                        textTransform: 'uppercase', color: 'var(--red)'
                                    }}>
                                        🚫 Razón del Baneo
                                    </div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                                        {s.ban_reason}
                                    </p>
                                </div>
                                <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: 12 }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                                        fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 800,
                                        textTransform: 'uppercase', color: 'var(--mint)'
                                    }}>
                                        💚 Razón para Volver
                                    </div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                                        {s.return_reason}
                                    </p>
                                </div>
                            </div>

                            <div className="candidate-footer-v3">
                                <div className="candidate-actions-v3">
                                    {s.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(s.id, 'approved')} className="btn-v3 approve">Asignar Entrevista ✅</button>
                                            <button onClick={() => handleUpdateStatus(s.id, 'rejected')} className="btn-v3 reject">Rechazar ❌</button>
                                        </>
                                    )}
                                    {s.status === 'approved' && (
                                        <div className="status-badge-v3" style={{ padding: '12px 20px', fontSize: '0.9rem', background: 'var(--mint-light)', color: '#0e5c3a', border: '2px solid #0e5c3a', borderRadius: 12, textAlign: 'center', fontWeight: 800 }}>
                                            ✅ ENTREVISTA ASIGNADA
                                        </div>
                                    )}
                                    {s.status === 'rejected' && (
                                        <div className="status-badge-v3" style={{ padding: '12px 20px', fontSize: '0.9rem' }}>🚫 SOLICITUD RECHAZADA</div>
                                    )}
                                </div>

                                <div className="candidate-meta-v3">
                                    {s.status !== 'pending' && (
                                        <button onClick={() => handleUpdateStatus(s.id, 'pending')} className="btn-icon-v3" title="Deshacer">↩️</button>
                                    )}
                                    <button onClick={() => openDeleteModal(s.id)} className="btn-icon-v3" title="Eliminar definitivamente">🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
