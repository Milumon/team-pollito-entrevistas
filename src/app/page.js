'use client';

import { useEffect, useState } from 'react';
import { formatFull, formatMedium } from '@/lib/dates';

export default function Landing() {
  const [slots, setSlots] = useState([]);
  const [pollitos, setPollitos] = useState([]);
  const [formData, setFormData] = useState({ roblox_user: '', tiktok_user: '', slot_id: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [watchedLive, setWatchedLive] = useState(false);
  const [hasEmoji, setHasEmoji] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [slotsRes, pollitosRes] = await Promise.all([
      fetch('/api/slots'),
      fetch('/api/pollitos'),
    ]);
    const slotsData = await slotsRes.json();
    const pollitosData = await pollitosRes.json();
    setSlots(Array.isArray(slotsData) ? slotsData : []);
    setPollitos(Array.isArray(pollitosData) ? pollitosData : []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/pollitos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, slot_id: Number(formData.slot_id) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error desconocido');
      }
      setSuccess(true);
      setFormData({ roblox_user: '', tiktok_user: '', slot_id: '' });
      setWatchedLive(false);
      setHasEmoji(false);
      fetchData();
    } catch {
      alert('Hubo un error al agendar la entrevista. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const pendingPollitos = pollitos.filter(p => p.status === 'pending');
  const officialPollitos = pollitos.filter(p => p.status === 'official');

  const rot = () => `${(Math.random() * 2.5 - 1.25).toFixed(1)}deg`;

  return (
    <div className="page-wrapper">
      {/* ── Hero ── */}
      <header className="hero">
        <span className="hero-chick" aria-hidden="true">🐣</span>
        <h1 className="hero-title">
          Conviértete en<br />Pollito Oficial
        </h1>
        <p className="hero-sub">Agenda tu entrevista para ser parte del Team</p>
      </header>

      {/* ── Booking form ── */}
      <section className="card pulse">
        {success ? (
          <div className="success-box">
            <div className="success-icon">🎉</div>
            <p className="success-title">¡Registro enviado!</p>
            <p className="success-sub" style={{ marginBottom: 16 }}>
              Prepárate para tu entrevista 🐣✨
            </p>
            <div style={{
              background: 'var(--cream)',
              border: '3px solid var(--ink-black)',
              borderRadius: 16,
              padding: '20px 16px',
              textAlign: 'center',
              marginTop: 8,
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
                📩 ¡Último paso importante!
              </p>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 14 }}>
                Escríbele un mensaje por TikTok a <strong>@camvsssx</strong> <b>y</b> <strong>@delfii.x0</strong> indicándoles que ya separaste tu cita para la entrevista.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <a
                  href="https://www.tiktok.com/@camvsssx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: 'inline-block', textDecoration: 'none', fontSize: '1rem', padding: '12px 24px' }}
                >
                  Ir a TikTok de @camvsssx 🎵
                </a>
                <a
                  href="https://www.tiktok.com/@delfii.x0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: 'inline-block', textDecoration: 'none', fontSize: '1rem', padding: '12px 24px', background: 'var(--pink)', borderColor: 'var(--pink)' }}
                >
                  Ir a TikTok de @delfii.x0 🎵
                </a>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tu Usuario de Roblox</label>
              <input
                type="text"
                placeholder="@RobloxUser"
                required
                value={formData.roblox_user}
                onChange={e => setFormData({ ...formData, roblox_user: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tu Usuario de TikTok</label>
              <input
                type="text"
                placeholder="@TikTokFan"
                required
                value={formData.tiktok_user}
                onChange={e => setFormData({ ...formData, tiktok_user: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Elige un Horario</label>
              <select
                required
                value={formData.slot_id}
                onChange={e => setFormData({ ...formData, slot_id: e.target.value })}
              >
                <option value="">Selecciona una fecha...</option>
                {slots.map(slot => (
                  <option key={slot.id} value={slot.id}>
                    {formatFull(slot.date)} — {slot.time.slice(0, 5)}
                  </option>
                ))}
              </select>
              {slots.length === 0 && (
                <p className="no-slots-warning">No hay horarios disponibles por ahora.</p>
              )}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <input
                type="checkbox"
                id="watchedLive"
                required
                checked={watchedLive}
                onChange={e => setWatchedLive(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0 }}
              />
              <label htmlFor="watchedLive" style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                Confirmo que he visto el live por más de 3 días 📺
              </label>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 20 }}>
              <input
                type="checkbox"
                id="hasEmoji"
                required
                checked={hasEmoji}
                onChange={e => setHasEmoji(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0 }}
              />
              <label htmlFor="hasEmoji" style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                Confirmo que tengo el emoji 🐣 en mi nombre de TikTok
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading || slots.length === 0}>
              {loading ? 'ENVIANDO...' : '¡QUIERO SER POLLITO! 🐣'}
            </button>
          </form>
        )}
      </section>

      {/* ── Pending ── */}
      <div style={{ marginTop: 32 }}>
        <div className="section-heading">
          🕒 Entrevistas Pendientes
          {pendingPollitos.length > 0 && (
            <span className="chip-count">{pendingPollitos.length}</span>
          )}
        </div>

        {pendingPollitos.length === 0 ? (
          <p className="empty-text">No hay entrevistas pendientes.</p>
        ) : (
          pendingPollitos.slice(0, 5).map(p => (
            <div key={p.id} className="pollito-card" style={{ transform: `rotate(${rot()})` }}>
              <span className="pollito-name">@{p.roblox_user}</span>
              <span className="chip">
                {p.date
                  ? `${formatMedium(p.date)} · ${p.time?.slice(0, 5)}`
                  : 'Pendiente'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* ── Oficiales ── */}
      <div style={{ marginTop: 28 }}>
        <div className="section-heading">
          👑 Pollitos Oficiales
          {officialPollitos.length > 0 && (
            <span className="chip-count">{officialPollitos.length}</span>
          )}
        </div>

        {officialPollitos.length === 0 ? (
          <p className="empty-text">Aún no hay pollitos oficiales.</p>
        ) : (
          officialPollitos.map(p => (
            <div key={p.id} className="pollito-card" style={{ transform: `rotate(${rot()})` }}>
              <span className="pollito-name">@{p.roblox_user}</span>
              <span className="badge-official">OFICIAL</span>
            </div>
          ))
        )}
      </div>

      <a href="/admin" className="footer-link">Panel Admin</a>
    </div>
  );
}

