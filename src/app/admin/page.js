'use client';

import { useEffect, useState } from 'react';
import { formatShort, formatDayMonth } from '@/lib/dates';

export default function Admin() {
  const [slots, setSlots] = useState([]);
  const [pollitos, setPollitos] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  async function fetchData() {
    try {
      setFetchError(null);
      const [slotsRes, pollitosRes] = await Promise.all([
        fetch('/api/admin/slots'),
        fetch('/api/pollitos'),
      ]);
      const slotsData    = await slotsRes.json();
      const pollitosData = await pollitosRes.json();

      if (!slotsRes.ok)    throw new Error(slotsData?.error    ?? `Error ${slotsRes.status} en /api/admin/slots`);
      if (!pollitosRes.ok) throw new Error(pollitosData?.error ?? `Error ${pollitosRes.status} en /api/pollitos`);

      setSlots(Array.isArray(slotsData) ? slotsData : []);
      setPollitos(Array.isArray(pollitosData) ? pollitosData : []);
    } catch (err) {
      console.error('fetchData error:', err);
      setFetchError(err.message);
    }
  }

  async function handleAddSlot(e) {
    e.preventDefault();
    if (!newDate || !newTime) return;
    setLoading(true);
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, time: newTime }),
      });
      if (!res.ok) throw new Error();
      setNewDate('');
      setNewTime('');
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

  async function handleUpdateStatus(id, status) {
    await fetch(`/api/pollitos/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
  }

  function handleLogin(e) {
    e.preventDefault();
    if (username === 'admin' && password === 'milustroki') {
      setIsAuthenticated(true);
    } else {
      alert('Credenciales incorrectas');
    }
  }

  const rot = () => `${(Math.random() * 1.5 - 0.75).toFixed(1)}deg`;

  /* ── Login screen ── */
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

  /* ── Admin panel ── */
  return (
    <div className="page-wrapper">
      {/* ── Header ── */}
      <header className="hero hero-dark">
        <h1 className="hero-title">Panel Admin</h1>
        <p className="hero-sub">Control del Gallinero 🐓</p>
      </header>

      {/* ── Error banner ── */}
      {fetchError && (
        <div className="error-banner">
          <strong>⚠️ Error al cargar datos:</strong> {fetchError}
          <br />
          <span>Verifica que las tablas existen en Supabase y que .env.local tiene las claves correctas.</span>
          <button onClick={fetchData} className="btn-action">Reintentar</button>
        </div>
      )}

      {/* ── Add slot ── */}
      <div className="card">
        <label className="form-label">➕ Crear Nuevo Horario</label>
        <form onSubmit={handleAddSlot} className="add-slot-form">
          <input
            type="date"
            required
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
          />
          <input
            type="time"
            required
            value={newTime}
            onChange={e => setNewTime(e.target.value)}
          />
          <button type="submit" disabled={loading} className="btn-add">
            {loading ? '...' : 'Añadir'}
          </button>
        </form>

        {slots.length > 0 && (
          <div className="slot-chip-row">
            {slots.map(slot => (
              <div key={slot.id} className="slot-chip">
                {formatShort(slot.date)} {slot.time.slice(0, 5)}
                {!slot.is_booked && (
                  <button onClick={() => handleDeleteSlot(slot.id)} className="delete-btn">
                    ×
                  </button>
                )}
                {slot.is_booked && (
                  <span className="booked-label">RESERVADO</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Candidates list ── */}
      <div className="section-heading">
        Gestionar Candidatos
        {pollitos.length > 0 && <span className="chip-count">{pollitos.length}</span>}
      </div>

      <div className="card">
        {pollitos.length === 0 && !fetchError ? (
          <p className="empty-text">No hay candidatos aún.</p>
        ) : (
          pollitos.map(p => (
            <div key={p.id} className="candidate-card" style={{ transform: `rotate(${rot()})` }}>
              <div className="candidate-header">
                <strong className="pollito-name">@{p.roblox_user}</strong>
                <span className="chip">TikTok: @{p.tiktok_user}</span>
              </div>

              {p.date && (
                <div className="candidate-date">
                  📅 {formatDayMonth(p.date)} a las {p.time?.slice(0, 5)}
                </div>
              )}

              <div className="candidate-actions">
                {p.status === 'pending' && (
                  <>
                    <button onClick={() => handleUpdateStatus(p.id, 'official')} className="btn-action approve">Aprobar 👑</button>
                    <button onClick={() => handleUpdateStatus(p.id, 'rejected')} className="btn-action reject">Rechazar ❌</button>
                  </>
                )}
                {p.status === 'official' && (
                  <div className="status-badge official">✅ ES OFICIAL</div>
                )}
                {p.status === 'rejected' && (
                  <div className="status-badge rejected">❌ RECHAZADO</div>
                )}
                {p.status !== 'pending' && (
                  <button onClick={() => handleUpdateStatus(p.id, 'pending')} className="btn-action">Deshacer</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <a href="/" className="footer-link">← Volver a la landing</a>
    </div>
  );
}
