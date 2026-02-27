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

  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => { fetchData(); fetchMembers(); }, []);

  async function fetchMembers() {
    const res = await fetch('/api/members');
    const data = await res.json();
    setMembers(Array.isArray(data) ? data : []);
  }

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>@</span>
                <input
                  type="text"
                  placeholder="RobloxUser"
                  required
                  value={formData.roblox_user}
                  onChange={e => setFormData({ ...formData, roblox_user: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tu Usuario de TikTok</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>@</span>
                <input
                  type="text"
                  placeholder="TikTokFan"
                  required
                  value={formData.tiktok_user}
                  onChange={e => setFormData({ ...formData, tiktok_user: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Elige un Horario</label>
              <select
                required
                value={formData.slot_id}
                onChange={e => setFormData({ ...formData, slot_id: e.target.value })}
              >
                <option value="">Selecciona una fecha...</option>
                {slots.map(slot => {
                  // Convertir hora del slot a local en formato AM/PM
                  const slotDate = new Date(`${slot.date}T${slot.time}`);
                  const localTime = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                  return (
                    <option key={slot.id} value={slot.id}>
                      {formatFull(slot.date)} — {localTime} (hora local)
                    </option>
                  );
                })}
              </select>
              {slots.length === 0 && (
                <p className="no-slots-warning">No hay horarios disponibles por ahora.</p>
              )}
              {/* Mostrar moderadora del horario seleccionado */}
              {formData.slot_id && slots.length > 0 && (() => {
                const slot = slots.find(s => String(s.id) === String(formData.slot_id));
                if (!slot || !slot.moderator) return null;
                return (
                  <div style={{ marginTop: 8, fontSize: '0.98rem', color: 'var(--ink-soft)' }}>
                    <span>Este horario es con la moderadora <strong>@{slot.moderator}</strong>. Recuerda escribirle por TikTok para confirmar tu entrevista.</span>
                  </div>
                );
              })()}
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

            <button type="submit" className="btn-primary" disabled={loading || slots.length === 0 || !watchedLive || !hasEmoji || !formData.roblox_user.trim() || !formData.tiktok_user.trim()}>
              {loading ? 'ENVIANDO...' : '¡QUIERO SER POLLITO! 🐣'}
            </button>
          </form>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setShowMembers(true)}
            className="btn-primary"
            style={{
              background: 'var(--yellow)',
              color: 'var(--ink)',
              border: '4px solid var(--ink)',
              fontSize: '1.1rem',
              padding: '14px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10
            }}
          >
            👑 Ver Pollitos Oficiales ({members.length})
          </button>
        </div>
      </section>

      {/* ── Modal Pollitos Oficiales ── */}
      {showMembers && (
        <div className="modal-overlay" onClick={() => setShowMembers(false)}>
          <div className="modal-card-v3" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header-v3">
              <h3>👑 Team Pollito Oficial</h3>
              <button onClick={() => setShowMembers(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body-v3" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
              <p style={{ textAlign: 'center', marginBottom: 20, color: 'var(--ink-soft)' }}>
                ¡Estos son los pollitos que ya forman parte oficial del Team! 🐣✨
              </p>
              {members.length === 0 ? (
                <p className="empty-text">Aún no hay pollitos oficiales agregados.</p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 16,
                  justifyContent: 'center'
                }}>
                  {members.map(m => (
                    <div key={m.id} className="pollito-card" style={{ transform: `rotate(${rot()})`, border: '3px solid var(--yellow)', margin: 0, minWidth: 180, flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                      <span className="pollito-name">Roblox: @{(m.roblox_user || '').replace(/^@+/, '')}</span>
                      <div className="pollito-name" style={{ marginTop: -4 }}>
                        TikTok: <a
                          href={`https://www.tiktok.com/search/user?q=${(m.tiktok_user || '').replace(/^@+/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--ink)', textDecoration: 'underline' }}
                        >
                          @{(m.tiktok_user || '').replace(/^@+/, '')}
                        </a>
                      </div>
                      <span className="badge-official" style={{ fontSize: '0.75rem' }}>POLLITO OFICIAL</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer-v3">
              <button onClick={() => setShowMembers(false)} className="btn-primary-v3">CERRAR</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Entrevistas por confirmar ── */}
      <div style={{ marginTop: 32 }}>
        <div className="section-heading">
          🕒 Entrevistas por confirmar
          {pendingPollitos.length > 0 && (
            <span className="chip-count" style={{ background: 'var(--ink)', color: 'white' }}>{pendingPollitos.length}</span>
          )}
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 12, opacity: 0.8 }}>
          Aquí aparecen quienes han llenado el formulario y están pendientes de confirmar su entrevista.
        </p>
        {pendingPollitos.length === 0 ? (
          <p className="empty-text">No hay entrevistas por confirmar.</p>
        ) : (
          pendingPollitos.slice(0, 5).map(p => {
            const slotDate = p.date && p.time ? new Date(`${p.date}T${p.time}`) : null;
            const localTime = slotDate ? slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
            return (
              <div key={p.id} className="pollito-card" style={{ transform: `rotate(${rot()})`, flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <span className="pollito-name">Roblox: @{(p.roblox_user || '').replace(/^@+/, '')}</span>
                <div className="pollito-name" style={{ marginTop: -4 }}>
                  TikTok: <a
                    href={`https://www.tiktok.com/search/user?q=${(p.tiktok_user || '').replace(/^@+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--ink)', textDecoration: 'underline' }}
                  >
                    @{(p.tiktok_user || '').replace(/^@+/, '')}
                  </a>
                </div>
                <div className="interview-info-v4" style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.04)',
                  borderRadius: '16px',
                  border: '1px dashed rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '100%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--ink)' }}>
                    <span style={{ fontSize: '1.2rem' }}>📅</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {p.date ? formatMedium(p.date) : 'Fecha Pendiente'}
                      </span>
                      {p.time && (
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                          {localTime || p.time?.slice(0, 5)} <small>(hora local)</small>
                        </span>
                      )}
                    </div>
                  </div>
                  {p.moderator && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(0,0,0,0.08)',
                      color: 'var(--ink)'
                    }}>
                      <span style={{ fontSize: '1rem' }}>👑</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        Moderadora: <strong style={{ color: 'var(--orange)', fontWeight: 800 }}>@{p.moderator}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Entrevistas confirmadas ── */}
      <div style={{ marginTop: 28 }}>
        <div className="section-heading">
          👑 Entrevistas confirmadas
          {officialPollitos.length > 0 && (
            <span className="chip-count">{officialPollitos.length}</span>
          )}
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 8 }}>
          Aquí aparecen solo quienes ya han realizado el paso de escribir a las moderadoras <strong>@delfii.x0</strong> o <strong>@camvsssx</strong> y han confirmado su entrevista.
        </p>
        {officialPollitos.length === 0 ? (
          <p className="empty-text">Aún no hay entrevistas confirmadas.</p>
        ) : (
          officialPollitos.map(p => {
            const slotDate = p.date && p.time ? new Date(`${p.date}T${p.time}`) : null;
            const localTime = slotDate ? slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
            return (
              <div key={p.id} className="pollito-card" style={{ transform: `rotate(${rot()})`, flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className="pollito-name">Roblox: @{(p.roblox_user || '').replace(/^@+/, '')}</span>
                  <span className="badge-official">CONFIRMADA</span>
                </div>
                <div className="pollito-name" style={{ marginTop: -4 }}>
                  TikTok: <a
                    href={`https://www.tiktok.com/search/user?q=${(p.tiktok_user || '').replace(/^@+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--ink)', textDecoration: 'underline' }}
                  >
                    @{(p.tiktok_user || '').replace(/^@+/, '')}
                  </a>
                </div>
                {p.date && p.time && (
                  <div className="interview-info-v4" style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.04)',
                    borderRadius: '16px',
                    border: '1px dashed rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    width: '100%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--ink)' }}>
                      <span style={{ fontSize: '1.2rem' }}>📅</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                          {formatMedium(p.date)}
                        </span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                          {localTime || p.time?.slice(0, 5)} <small>(hora local)</small>
                        </span>
                      </div>
                    </div>
                    {p.moderator && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(0,0,0,0.08)',
                        color: 'var(--ink)'
                      }}>
                        <span style={{ fontSize: '1rem' }}>👑</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          Moderadora: <strong style={{ color: 'var(--orange)', fontWeight: 800 }}>@{p.moderator}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <a href="/admin" className="footer-link">Panel Admin</a>
    </div>
  );
}

