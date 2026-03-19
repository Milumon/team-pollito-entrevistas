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
    
    // New states for Searching, Pagination and Sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState('latest_created'); // 'asc', 'desc', 'latest_created'
    const ITEMS_PER_PAGE = 10;

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

    // Sorting logic supporting 'asc' (oldest first), 'desc' (furthest first), and 'latest_created' (newest registered)
    const sortItems = (a, b) => {
        if (sortOrder === 'latest_created') {
             const cA = a.created_at ? new Date(a.created_at).getTime() : 0;
             const cB = b.created_at ? new Date(b.created_at).getTime() : 0;
             return cB - cA; // Descending by creation time
        }
        const dateA = a.date || (sortOrder === 'asc' ? '9999-12-31' : '0000-00-00');
        const dateB = b.date || (sortOrder === 'asc' ? '9999-12-31' : '0000-00-00');
        if (dateA !== dateB) {
            return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
        }
        const timeA = a.time || (sortOrder === 'asc' ? '23:59:59' : '00:00:00');
        const timeB = b.time || (sortOrder === 'asc' ? '23:59:59' : '00:00:00');
        return sortOrder === 'asc' ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
    };

    const activeCandidates = pollitos
        .filter(p => !p.date || p.date >= today)
        .sort(sortItems);

    const historyCandidates = pollitos
        .filter(p => p.date && p.date < today)
        .sort(sortItems);

    // Apply search filter
    const searchedCandidates = (showHistory ? historyCandidates : activeCandidates).filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return p.roblox_user?.toLowerCase().includes(term) || p.tiktok_user?.toLowerCase().includes(term);
    });

    const filteredByTab = searchedCandidates.filter(p => p.status === activeTab);

    // Counts for tabs based on searched results
    const counts = {
        pending: searchedCandidates.filter(p => p.status === 'pending').length,
        official: searchedCandidates.filter(p => p.status === 'official').length,
        rejected: searchedCandidates.filter(p => p.status === 'rejected').length,
    };

    // Calculate pagination slices
    const totalPages = Math.max(1, Math.ceil(filteredByTab.length / ITEMS_PER_PAGE));
    const paginatedCandidates = filteredByTab.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

    // Reset pagination when tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    return (
        <div className="section-container">
            <div className="section-header-v3">
                <h2 className="section-title-v3">
                    {showHistory ? 'Historial de Entrevistas' : 'Postulantes Administrativos'}
                </h2>
                <button
                    onClick={() => { setShowHistory(!showHistory); setCurrentPage(1); }}
                    className={`btn-history-toggle ${showHistory ? 'active' : ''}`}
                >
                    {showHistory ? '👁️ Ver Actuales' : '📜 Ver Historial'}
                </button>
            </div>

            {/* Search and Sort Toolbar */}
            <div className="filters-container" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                <input 
                    type="text" 
                    placeholder="🔍 Buscar por usuario de Roblox o TikTok..." 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '0.95rem', minWidth: '250px', background: 'white' }}
                />
                
                <select 
                    value={sortOrder} 
                    onChange={e => { setSortOrder(e.target.value); setCurrentPage(1); }} 
                    style={{ padding: '10px 16px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '0.95rem', background: 'white', cursor: 'pointer', outline: 'none' }}
                >
                    <option value="latest_created">Últimos Registrados (Nuevos)</option>
                    <option value="asc">Entrevista Cronológica (Cercana a Lejana)</option>
                    <option value="desc">Entrevista Inversa (Lejana a Cercana)</option>
                </select>
            </div>

            <div className="admin-tabs-v6">
                <button
                    className={`tab-btn-v6 ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => handleTabChange('pending')}
                >
                    Pendientes {counts.pending > 0 && <span className="tab-badge-v6">{counts.pending}</span>}
                </button>
                <button
                    className={`tab-btn-v6 ${activeTab === 'official' ? 'active' : ''}`}
                    onClick={() => handleTabChange('official')}
                >
                    Confirmados {counts.official > 0 && <span className="tab-badge-v6 blue">{counts.official}</span>}
                </button>
                <button
                    className={`tab-btn-v6 ${activeTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => handleTabChange('rejected')}
                >
                    Rechazados {counts.rejected > 0 && <span className="tab-badge-v6 red">{counts.rejected}</span>}
                </button>
            </div>

            {fetchError && <div className="error-banner">Error: {fetchError}</div>}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-card" style={{ minWidth: 320, border: '4px solid var(--red)', borderRadius: 20 }}>
                        <h3 style={{ marginBottom: 16, fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)' }}>¿Eliminar esta entrevista?</h3>
                        <p style={{ marginBottom: 22, color: 'var(--ink-soft)' }}>Esta acción no se puede deshacer.</p>
                        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                            <button className="btn-action reject" style={{ fontSize: '1.1rem', padding: '12px 32px', borderRadius: 12 }} onClick={handleDeletePollitoConfirmed}>Eliminar</button>
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
                ) : paginatedCandidates.length === 0 && !fetchError ? (
                    <div className="empty-state-v3" style={{ padding: '60px 20px', gridColumn: '1 / -1' }}>
                        <span className="empty-icon-v3">
                            {activeTab === 'pending' ? '🐣' : activeTab === 'official' ? '✅' : '🚫'}
                        </span>
                        <p>{searchTerm ? 'No hay resultados para tu búsqueda.' : 'No hay candidatos en esta sección.'}</p>
                    </div>
                ) : (
                    paginatedCandidates.map(p => {
                        const d = p.date && p.time ? new Date(`${p.date}T${p.time}Z`) : null;
                        const displayDate = d ? d.toLocaleDateString('en-CA') : p.date;
                        const displayTime = d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : p.time;
                        const rUser = (p.roblox_user || '').replace(/^@+/, '');

                        return (
                            <div key={p.id} className="pollito-card" style={{ 
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
                                    {p.status !== 'pending' && (
                                        <button onClick={() => handleUpdateStatus(p.id, 'pending')} className="btn-icon-v3" title="Deshacer" style={{ border: '1px solid rgba(0,0,0,0.1)', background: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↩️</button>
                                    )}
                                    <button onClick={() => openDeleteModal(p.id)} className="btn-icon-v3" title="Eliminar definitivamente" style={{ border: '1px solid rgba(0,0,0,0.1)', background: 'var(--red)', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                                </div>

                                <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid var(--ink)`, background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginTop: 12 }}>
                                    🐣
                                </div>
                                
                                <span className="pollito-name" style={{ alignSelf: 'stretch', textAlign: 'center' }}>Roblox: @{rUser}</span>
                                <div className="pollito-name" style={{ marginTop: -8, alignSelf: 'stretch', textAlign: 'center' }}>
                                    TikTok: <a
                                        href={`https://www.tiktok.com/search/user?q=${(p.tiktok_user || '').replace(/^@+/, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--ink)', textDecoration: 'underline' }}
                                    >
                                        @{(p.tiktok_user || '').replace(/^@+/, '')}
                                    </a>
                                </div>

                                <div style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.04)',
                                    borderRadius: '12px',
                                    border: '1px dashed rgba(0,0,0,0.1)',
                                    padding: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    marginTop: '4px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--ink)' }}>
                                        <span>📅 {formatDayMonth(displayDate)}</span>
                                        <span>|</span>
                                        <span>⌚ {formatTime12h(displayTime)}</span>
                                    </div>
                                    {p.moderator && (
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)' }}>
                                            👑 Mod: <span style={{ color: 'var(--orange)' }}>@{p.moderator}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: 'auto' }}>
                                    {p.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(p.id, 'official')} className="btn-v3 approve" style={{ width: '100%' }}>Asignar Entrevista ✅</button>
                                            <button onClick={() => handleUpdateStatus(p.id, 'rejected')} className="btn-v3 reject" style={{ width: '100%' }}>Rechazar ❌</button>
                                        </>
                                    )}
                                    {p.status === 'official' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(p.id, 'rejected')}
                                                className="btn-v3 reject"
                                                style={{ width: '100%', fontSize: '0.85rem' }}
                                            >
                                                No pasó entrevista ❌
                                            </button>
                                            <button
                                                onClick={() => handlePromoteToMember(p.id, p.roblox_user, p.tiktok_user)}
                                                className="btn-v3 approve"
                                                disabled={promotingIds.has(p.id)}
                                                style={{ width: '100%', fontSize: '0.85rem', padding: '10px 8px' }}
                                            >
                                                {promotingIds.has(p.id) ? '⏳ Promoviendo...' : '🐣 Convertir en Oficial'}
                                            </button>
                                        </>
                                    )}
                                    {p.status === 'rejected' && (
                                        <div className="status-badge-v3" style={{ padding: '10px', fontSize: '0.85rem' }}>🚫 RECHAZADO</div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {!loadingData && filteredByTab.length > ITEMS_PER_PAGE && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '30px 0', alignItems: 'center' }}>
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                        disabled={currentPage === 1}
                        className="btn-v3 secondary"
                        style={{ padding: '10px 20px', fontSize: '0.95rem', borderRadius: '12px', opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                        ← Anterior
                    </button>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                        Página {currentPage} de {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                        disabled={currentPage === totalPages}
                        className="btn-v3 secondary"
                        style={{ padding: '10px 20px', fontSize: '0.95rem', borderRadius: '12px', opacity: currentPage === totalPages ? 0.5 : 1 }}
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
}
