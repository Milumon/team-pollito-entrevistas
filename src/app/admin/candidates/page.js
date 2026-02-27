'use client';

import { useEffect, useState } from 'react';
import { formatDayMonth, formatTime12h, rot } from '@/lib/dates';

export default function CandidatesPage() {
    const [pollitos, setPollitos] = useState([]);
    const [fetchError, setFetchError] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setFetchError(null);
            const res = await fetch('/api/pollitos');
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
            setPollitos(Array.isArray(data) ? data : []);
        } catch (err) {
            setFetchError(err.message);
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

    const today = new Date().toISOString().split('T')[0];
    const rotHelper = () => `${(Math.random() * 1.5 - 0.75).toFixed(1)}deg`;

    const activeCandidates = pollitos.filter(p => !p.date || p.date >= today);
    const historyCandidates = pollitos.filter(p => p.date && p.date < today);
    const currentCandidates = showHistory ? historyCandidates : activeCandidates;

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
                // Opcionalmente podrías marcarlo como ya promovido localmente
                // Para simplificar, solo quitamos el estado de carga
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
                    {showHistory ? 'Historial de Entrevistas' : 'Postulantes Pendientes'}
                    {currentCandidates.length > 0 && <span className="chip-count-v4">{currentCandidates.length}</span>}
                </h2>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`btn-history-toggle ${showHistory ? 'active' : ''}`}
                >
                    {showHistory ? '👁️ Ver Pendientes' : '📜 Ver Historial'}
                </button>
            </div>

            {fetchError && <div className="error-banner">Error: {fetchError}</div>}

            {/* ── Modal de confirmación individual ── */}
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
                {currentCandidates.length === 0 && !fetchError ? (
                    <div className="empty-state-v3" style={{ padding: '40px 20px' }}>
                        <span className="empty-icon-v3">{showHistory ? '🏜️' : '🐣'}</span>
                        <p>{showHistory ? 'No hay historial de entrevistas pasadas.' : 'No hay candidatos pendientes por ahora.'}</p>
                    </div>
                ) : (
                    currentCandidates.map(p => (
                        <div key={p.id} className="candidate-card-v2" style={{ transform: `rotate(${rotHelper()})` }}>
                            <div className="candidate-info-v2">
                                <div className="candidate-primary-v2" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                    <span className="candidate-roblox">Roblox: @{(p.roblox_user || '').replace(/^@+/, '')}</span>
                                    <span className="candidate-tiktok">
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
                                <div className="candidate-schedule-v3" style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    background: 'rgba(0,0,0,0.03)',
                                    borderRadius: '12px',
                                    border: '1px dashed var(--ink-soft)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>📅</span>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.1, color: 'var(--ink)' }}>{formatDayMonth(p.date)}</div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{formatTime12h(p.time)} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>(Hora Local)</span></div>
                                        </div>
                                    </div>

                                    {p.moderator && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            paddingTop: '8px',
                                            borderTop: '1px solid rgba(0,0,0,0.06)'
                                        }}>
                                            <span style={{ fontSize: '1rem' }}>👑</span>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                                                Moderación: <span style={{ color: 'var(--orange)', fontWeight: 800 }}>@{p.moderator}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="candidate-footer-v2">
                                <div className="candidate-status-area-v2">
                                    {p.status === 'pending' && (
                                        <div className="pending-actions-v2">
                                            <button onClick={() => handleUpdateStatus(p.id, 'official')} className="btn-approve-v2">Entrevista Confirmada ✅</button>
                                            <button onClick={() => handleUpdateStatus(p.id, 'rejected')} className="btn-reject-v2">Rechazar ❌</button>
                                        </div>
                                    )}
                                    {p.status === 'official' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div className="status-official-v2">ENTREVISTA CONFIRMADA ✨</div>
                                            <button
                                                onClick={() => handlePromoteToMember(p.id, p.roblox_user, p.tiktok_user)}
                                                className="btn-approve-v2"
                                                disabled={promotingIds.has(p.id)}
                                                style={{
                                                    background: 'var(--yellow)',
                                                    color: 'var(--ink)',
                                                    border: '2px solid var(--ink)',
                                                    cursor: promotingIds.has(p.id) ? 'not-allowed' : 'pointer',
                                                    opacity: promotingIds.has(p.id) ? 0.7 : 1
                                                }}
                                            >
                                                {promotingIds.has(p.id) ? 'Promoviendo...' : '¡Convertir en Miembro! 🐣'}
                                            </button>
                                        </div>
                                    )}
                                    {p.status === 'rejected' && (
                                        <div className="status-rejected-v2">RECHAZADO</div>
                                    )}
                                </div>

                                <div className="candidate-meta-actions-v2">
                                    {p.status !== 'pending' && (
                                        <button onClick={() => handleUpdateStatus(p.id, 'pending')} className="btn-undo-v2">Deshacer</button>
                                    )}
                                    <button onClick={() => openDeleteModal(p.id)} className="btn-delete-pollito-v2">🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
