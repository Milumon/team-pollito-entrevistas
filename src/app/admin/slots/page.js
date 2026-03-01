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
    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editModerator, setEditModerator] = useState('');

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
            // Convertimos la entrada (que asumimos es hora de Perú UTC-5) a UTC antes de guardar
            const peruDate = new Date(`${newDate}T${newTime}:00-05:00`);
            const utcISO = peruDate.toISOString();
            const utcDateStr = utcISO.split('T')[0];
            const utcTimeStr = utcISO.split('T')[1].slice(0, 8);

            const res = await fetch('/api/slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: utcDateStr, time: utcTimeStr, moderator }),
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

    async function handleStartEdit(slot) {
        const d = new Date(`${slot.date}T${slot.time}Z`);
        const lDate = d.toLocaleDateString('en-CA');
        const lTime = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        setEditingId(slot.id);
        setEditDate(lDate);
        setEditTime(lTime);
        setEditModerator(slot.moderator || '');
    }

    async function handleSaveEdit(id) {
        setLoading(true);
        try {
            // Convertimos la entrada local (Perú) a UTC
            const peruDate = new Date(`${editDate}T${editTime}:00-05:00`);
            const utcISO = peruDate.toISOString();
            const utcDateStr = utcISO.split('T')[0];
            const utcTimeStr = utcISO.split('T')[1].slice(0, 8);

            const res = await fetch(`/api/slots/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: utcDateStr, time: utcTimeStr, moderator: editModerator }),
            });
            if (!res.ok) throw new Error();
            setEditingId(null);
            fetchData();
        } catch {
            alert('Error al actualizar horario');
        } finally {
            setLoading(false);
        }
    }

    const today = new Date().toLocaleDateString('en-CA');
    const rot = () => `${(Math.random() * 1.5 - 0.75).toFixed(1)}deg`;

    const groupedSlots = slots.reduce((acc, slot) => {
        // Convertimos de UTC a local para el administrador
        const d = new Date(`${slot.date}T${slot.time}Z`);
        const localDate = d.toLocaleDateString('en-CA'); // YYYY-MM-DD local
        const lTime = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        if (!acc[localDate]) acc[localDate] = [];
        acc[localDate].push({ ...slot, displayTime: lTime });
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
                                <div key={slot.id} className={`slot-row-v4 ${slot.is_booked ? 'is-booked' : ''} ${editingId === slot.id ? 'is-editing' : ''}`}>
                                    {editingId === slot.id ? (
                                        <div className="edit-controls-v4">
                                            <div className="edit-inputs-group-v4">
                                                <input
                                                    type="date"
                                                    value={editDate}
                                                    onChange={e => setEditDate(e.target.value)}
                                                    className="edit-input-v4"
                                                    aria-label="Fecha"
                                                />
                                                <input
                                                    type="time"
                                                    value={editTime}
                                                    onChange={e => setEditTime(e.target.value)}
                                                    className="edit-input-v4"
                                                    aria-label="Hora"
                                                />
                                                <select
                                                    value={editModerator}
                                                    onChange={e => setEditModerator(e.target.value)}
                                                    className="edit-select-v4"
                                                    aria-label="Moderadora"
                                                >
                                                    <option value="">(Sin mod)</option>
                                                    <option value="delfii.x0">@delfii.x0</option>
                                                    <option value="camvsssx">@camvsssx</option>
                                                </select>
                                            </div>
                                            <div className="slot-actions-v4">
                                                <button onClick={() => handleSaveEdit(slot.id)} className="save-btn-v4" title="Guardar">💾</button>
                                                <button onClick={() => setEditingId(null)} className="cancel-btn-v4" title="Cancelar">✕</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="slot-time-v4">{formatTime12h(slot.displayTime)}</span>
                                            <span className="slot-mod-v4">@{slot.moderator || 'sin mod'}</span>
                                            <div className="slot-actions-v4">
                                                {slot.is_booked && <span className="booked-label-v4">RESERVADO</span>}
                                                <button onClick={() => handleStartEdit(slot)} className="edit-mini-btn-v4" title="Editar">✏️</button>
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
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
