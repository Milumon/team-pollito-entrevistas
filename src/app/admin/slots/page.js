'use client';

import { useEffect, useState } from 'react';
import { formatShort, formatTime12h } from '@/lib/dates';

export default function SlotsPage() {
    const [slots, setSlots] = useState([]);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [moderator, setModerator] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setFetchError(null);
            const res = await fetch('/api/admin/slots');
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
            setSlots(Array.isArray(data) ? data : []);
        } catch (err) {
            setFetchError(err.message);
        }
    }

    async function handleAddSlot(e) {
        e.preventDefault();
        if (!newDate || !newTime || !moderator) return;
        setLoading(true);
        try {
            const res = await fetch('/api/slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: newDate, time: newTime, moderator }),
            });
            if (!res.ok) throw new Error();
            setNewDate('');
            setNewTime('');
            setModerator('');
            setShowAddModal(false);
            fetchData();
        } catch {
            alert('Error al agregar horario');
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteSlot(id) {
        if (!confirm('¿Seguro que deseas eliminar este horario?')) return;
        await fetch(`/api/slots/${id}`, { method: 'DELETE' });
        fetchData();
    }

    async function handleEditModerator(slotId, newModerator) {
        try {
            await fetch(`/api/slots/${slotId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moderator: newModerator }),
            });
            fetchData();
        } catch {
            alert('Error al actualizar la moderadora.');
        }
    }

    const today = new Date().toISOString().split('T')[0];
    const rot = () => `${(Math.random() * 1.5 - 0.75).toFixed(1)}deg`;

    const groupedSlots = slots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedSlots)
        .filter(d => d >= today)
        .sort();

    return (
        <div className="section-container">
            <div className="section-header-v3">
                <h2 className="section-title-v3">Próximas Entrevistas</h2>
                <button onClick={() => setShowAddModal(true)} className="btn-add-trigger">
                    <span className="plus-icon">＋</span> Añadir Fecha
                </button>
            </div>

            {fetchError && <div className="error-banner">Error: {fetchError}</div>}

            {/* ── Add Slot Modal ── */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-card-v3">
                        <div className="modal-header-v3">
                            <h3>Nuevo Horario</h3>
                            <button onClick={() => setShowAddModal(false)} className="close-btn">×</button>
                        </div>
                        <form onSubmit={handleAddSlot} className="add-slot-form-v3">
                            <div className="modal-body-v3">
                                <div className="input-group-v3">
                                    <label>Fecha del evento</label>
                                    <input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} />
                                </div>
                                <div className="input-field-row-v3">
                                    <div className="input-group-v3">
                                        <label>Hora</label>
                                        <input type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} />
                                    </div>
                                    <div className="input-group-v3">
                                        <label>Moderadora</label>
                                        <select required value={moderator} onChange={e => setModerator(e.target.value)}>
                                            <option value="">Selecciona...</option>
                                            <option value="delfii.x0">@delfii.x0</option>
                                            <option value="camvsssx">@camvsssx</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer-v3">
                                <button type="submit" disabled={loading} className="btn-primary-v3">
                                    {loading ? 'Añadiendo...' : 'CREAR HORARIO ✨'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grouped-slots-container">
                {slots.length === 0 && !fetchError && (
                    <div className="empty-state-v3">
                        <span className="empty-icon-v3">📅</span>
                        <p>No hay horarios programados.</p>
                        <button onClick={() => setShowAddModal(true)} className="btn-secondary-v3">Crear el primero</button>
                    </div>
                )}

                {sortedDates.map(date => (
                    <div key={date} className="date-group-v4">
                        <div className="date-header-v4">
                            <span className="date-badge-v4">{formatShort(date)}</span>
                        </div>
                        <div className="slots-list-v4">
                            {groupedSlots[date].map(slot => (
                                <div key={slot.id} className={`slot-row-v4 ${slot.is_booked ? 'is-booked' : ''}`}>
                                    <span className="slot-time-v4">{formatTime12h(slot.time)}</span>
                                    <select
                                        value={slot.moderator || ''}
                                        onChange={e => handleEditModerator(slot.id, e.target.value)}
                                        className="moderator-select-v4"
                                    >
                                        <option value="">(Sin mod)</option>
                                        <option value="delfii.x0">@delfii.x0</option>
                                        <option value="camvsssx">@camvsssx</option>
                                    </select>
                                    <div className="slot-actions-v4">
                                        {slot.is_booked && <span className="booked-label-v4">RESERVADO</span>}
                                        <button
                                            onClick={() => {
                                                if (slot.is_booked && !confirm('Este horario está RESERVADO. ¿Seguro que quieres eliminarlo?')) return;
                                                handleDeleteSlot(slot.id);
                                            }}
                                            className="delete-mini-btn-v4"
                                            title="Eliminar"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
