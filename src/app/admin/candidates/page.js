'use client';

import { useEffect, useState } from 'react';
import { formatDayMonth, formatTime12h, rot } from '@/lib/dates';

export default function CandidatesPage() {
    const [pollitos, setPollitos] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'official', 'rejected'

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoadingData(true);
            setFetchError(null);
            const res = await fetch('/api/pollitos');
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
            setPollitos(Array.isArray(data) ? data : []);
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setLoadingData(false);
        }
    }

    async function handleUpdateStatus(id, status) {
        await fetch(`/api/pollitos/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        fetchData();
    }

    function openDeleteModal(id) {
        setToDeleteId(id);
        setShowAddModal ? setShowAddModal(false) : null; // Safety
        setShowDeleteModal(true);
    }

    function closeDeleteModal() {
        setShowDeleteModal(false);
        setToDeleteId(null);
    }

    async function handleDeletePollitoConfirmed() {
        setShowDeleteModal(false);
        if (toDeleteId) {
            await fetch(`/api/pollitos/${toDeleteId}`, { method: 'DELETE' });
            setToDeleteId(null);
            fetchData();
        }
    }

    const today = new Date().toLocaleDateString('en-CA');

    // Función para ordenar cronológicamente
    const sortChronologically = (a, b) => {
        const dateA = a.date || '9999-12-31';
        const dateB = b.date || '9999-12-31';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = a.time || '23:59:59';
        const timeB = b.time || '23:59:59';
        return timeA.localeCompare(timeB);
    };

    const activeCandidates = pollitos
        .filter(p => !p.date || p.date >= today)
        .sort(sortChronologically);

    const historyCandidates = pollitos
        .filter(p => p.date && p.date < today)
        .sort(sortChronologically);

    const filteredByTab = (showHistory ? historyCandidates : activeCandidates).filter(p => p.status === activeTab);

    // Contadores para las pestañas (basados en la vista actual: Activos o Historial)
    const counts = {
        pending: (showHistory ? historyCandidates : activeCandidates).filter(p => p.status === 'pending').length,
        official: (showHistory ? historyCandidates : activeCandidates).filter(p => p.status === 'official').length,
        rejected: (showHistory ? historyCandidates : activeCandidates).filter(p => p.status === 'rejected').length,
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
                    {showHistory ? 'Historial de Entrevistas' : 'Postulantes Administrativos'}
                </h2>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`btn-history-toggle ${showHistory ? 'active' : ''}`}
                >
                    {showHistory ? '👁️ Ver Actuales' : '📜 Ver Historial'}
                </button>
            </div>

            <div className="admin-tabs-v6">
                <button
                    className={`tab-btn-v6 ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pendientes {counts.pending > 0 && <span className="tab-badge-v6">{counts.pending}</span>}
                </button>
                <button
                    className={`tab-btn-v6 ${activeTab === 'official' ? 'active' : ''}`}
                    onClick={() => setActiveTab('official')}
                >
                    Confirmados {counts.official > 0 && <span className="tab-badge-v6 blue">{counts.official}</span>}
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
                        <h3 style={{ marginBottom: 16, fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)' }}>¿Eliminar esta cita?</h3>
                        <p style={{ marginBottom: 22, color: 'var(--ink-soft)' }}>Esta acción no se puede deshacer.</p>
                        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                            <button className="btn-action reject" style={{ fontSize: '1.1rem', padding: '12px 32px', borderRadius: 12 }} onClick={handleDeletePollitoConfirmed}>Eliminar</button>
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
                            {activeTab === 'pending' ? '🐣' : activeTab === 'official' ? '✅' : '🚫'}
                        </span>
                        <p>No hay candidatos en esta sección.</p>
                    </div>
                ) : (
                    filteredByTab.map(p => {
                        const d = p.date && p.time ? new Date(`${p.date}T${p.time}Z`) : null;
                        const displayDate = d ? d.toLocaleDateString('en-CA') : p.date;
                        const displayTime = d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : p.time;

                        return (
                            <div key={p.id} className="candidate-card-v3">
                                <div className="candidate-info-row-v3">
                                    <div className="candidate-main-v3">
                                        <span className="candidate-roblox-v3">@{(p.roblox_user || '').replace(/^@+/, '')}</span>
                                        <span className="candidate-tiktok-v3">
                                            TikTok: <a
                                                href={`https://www.tiktok.com/search/user?q=${(p.tiktok_user || '').replace(/^@+/, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: 'inherit', textDecoration: 'underline' }}
                                            >
                                                @{(p.tiktok_user || '').replace(/^@+/, '')}
                                            </a>
                                        </span>
                                    </div>

                                    <div className="candidate-schedule-v3">
                                        <div className="schedule-item-v3">
                                            <span className="schedule-icon-v3">📅</span>
                                            <div className="schedule-text-v3">
                                                <strong>{formatDayMonth(displayDate)}</strong>
                                                <span>Fecha de Entrevista</span>
                                            </div>
                                        </div>
                                        <div className="schedule-item-v3">
                                            <span className="schedule-icon-v3">⌚</span>
                                            <div className="schedule-text-v3">
                                                <strong>{formatTime12h(displayTime)}</strong>
                                                <span>Hora Local</span>
                                            </div>
                                        </div>
                                        {p.moderator && (
                                            <div className="schedule-item-v3">
                                                <span className="schedule-icon-v3">👑</span>
                                                <div className="schedule-text-v3">
                                                    <strong>@{p.moderator}</strong>
                                                    <span>Moderadora</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="candidate-footer-v3">
                                    <div className="candidate-actions-v3">
                                        {p.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(p.id, 'official')} className="btn-v3 approve">Confirmar Cita ✅</button>
                                                <button onClick={() => handleUpdateStatus(p.id, 'rejected')} className="btn-v3 reject">Rechazar ❌</button>
                                            </>
                                        )}
                                        {p.status === 'official' && (
                                            <button
                                                onClick={() => handlePromoteToMember(p.id, p.roblox_user, p.tiktok_user)}
                                                className="btn-v3 secondary"
                                                disabled={promotingIds.has(p.id)}
                                            >
                                                {promotingIds.has(p.id) ? '⏳ Promoviendo...' : '🐣 ¡Convertir en Miembro Oficial!'}
                                            </button>
                                        )}
                                        {p.status === 'rejected' && (
                                            <div className="status-badge-v3" style={{ padding: '12px 20px', fontSize: '0.9rem' }}>🚫 POSTULANTE RECHAZADO</div>
                                        )}
                                    </div>

                                    <div className="candidate-meta-v3">
                                        {p.status !== 'pending' && (
                                            <button onClick={() => handleUpdateStatus(p.id, 'pending')} className="btn-icon-v3" title="Deshacer">↩️</button>
                                        )}
                                        <button onClick={() => openDeleteModal(p.id)} className="btn-icon-v3" title="Eliminar definitivamente">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
