'use client';

import { useEffect, useState } from 'react';
import { formatFull, formatMedium } from '@/lib/dates';

export default function Landing() {
  const [slots, setSlots] = useState([]);
  const [pollitos, setPollitos] = useState([]);
  const [formData, setFormData] = useState({ roblox_user: '', tiktok_user: '', slot_id: '', website: '' });
  const [lastSubmittedSlot, setLastSubmittedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadTimestamp, setLoadTimestamp] = useState(0);
  const [success, setSuccess] = useState(false);
  const [watchedLive, setWatchedLive] = useState(false);
  const [hasEmoji, setHasEmoji] = useState(false);
  const [showTiktokExample, setShowTiktokExample] = useState(false);
  const [showEmojiHelp, setShowEmojiHelp] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    fetchData();
    fetchMembers();
    setLoadTimestamp(Date.now());
  }, []);

  async function fetchMembers() {
    const res = await fetch('/api/members');
    const data = await res.json();
    setMembers(Array.isArray(data) ? data : []);
  }

  async function fetchData() {
    try {
      setLoadingData(true);
      const [slotsRes, pollitosRes] = await Promise.all([
        fetch('/api/slots'),
        fetch('/api/pollitos'),
      ]);
      const slotsData = await slotsRes.json();
      const pollitosData = await pollitosRes.json();
      setSlots(Array.isArray(slotsData) ? slotsData : []);
      setPollitos(Array.isArray(pollitosData) ? pollitosData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/pollitos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slot_id: Number(formData.slot_id),
          ts: loadTimestamp
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error desconocido');
      }
      const selectedSlot = slots.find(s => String(s.id) === String(formData.slot_id));
      setLastSubmittedSlot(selectedSlot);
      setSuccess(true);
      setFormData({ roblox_user: '', tiktok_user: '', slot_id: '', website: '' });
      setWatchedLive(false);
      setHasEmoji(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Hubo un error al agendar la entrevista. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const pendingPollitos = pollitos.filter(p =>
    p.status === 'pending' && (p.date ? p.date >= todayStr : true)
  );
  const officialPollitos = pollitos.filter(p =>
    p.status === 'official' && (p.date ? p.date >= todayStr : true)
  );

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
              padding: '24px 20px',
              textAlign: 'center',
              marginTop: 12,
              boxShadow: '0 8px 0 rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 12, color: 'var(--ink)' }}>
                📩 ¡PASO FINAL OBLIGATORIO!
              </p>

              <p style={{ fontSize: '1rem', lineHeight: 1.5, marginBottom: 16, color: 'var(--ink-soft)' }}>
                Para confirmar tu cita, debes enviarle un mensaje por TikTok a la moderadora de tu horario:
              </p>

              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: 12,
                border: '2px dashed var(--orange)',
                marginBottom: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10
              }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--orange)' }}>
                  @{lastSubmittedSlot?.moderator || 'camvsssx'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(lastSubmittedSlot?.moderator || 'camvsssx');
                    alert('¡Nombre de la moderadora copiado! 📋');
                  }}
                  className="btn-help"
                  style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                >
                  📋 Copiar Usuario
                </button>
              </div>

              <div style={{
                textAlign: 'left',
                background: 'rgba(0,0,0,0.03)',
                padding: '12px',
                borderRadius: 10,
                fontSize: '0.88rem',
                lineHeight: 1.4
              }}>
                <p style={{ marginBottom: 8 }}><strong>¿Qué pasa ahora?</strong></p>
                <p style={{ marginBottom: 6 }}>1. Tu nombre aparecerá abajo en la sección de <strong style={{ color: 'var(--orange)' }}>🕒 Entrevistas por confirmar</strong>.</p>
                <p>2. Una vez que la moderadora reciba tu mensaje y valide tus datos, te pasará a la lista de <strong style={{ color: 'var(--blue)' }}>✅ Entrevistas confirmadas</strong>.</p>
              </div>

              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="btn-submit"
                style={{ marginTop: 24, width: '100%', background: 'var(--ink)', color: 'white' }}
              >
                Entendido, ir a ver mi estado 🐣
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Honeypot field - hidden from users */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                tabIndex="-1"
                autoComplete="off"
              />
            </div>

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
              <div className="form-help-row">
                <label className="form-label">Tu Usuario de TikTok</label>
                <button
                  type="button"
                  className="btn-help"
                  onClick={() => setShowTiktokExample(!showTiktokExample)}
                >
                  {showTiktokExample ? 'Cerrar' : '(?) Ver ejemplo'}
                </button>
              </div>

              {showTiktokExample && (
                <div className="help-card-v2">
                  <div className="help-status-badge">Tutorial</div>
                  <div className="example-img-container">
                    <img
                      src="/tiktok_user_example.png"
                      alt="Donde encontrar tu usuario"
                    />
                  </div>
                  <div className="help-caption">
                    <p>Mira la flecha amarilla: el usuario es el que empieza con <strong>@</strong> (ej: @milumon_gaming).</p>
                    <p style={{ marginTop: 4, fontSize: '0.75rem', opacity: 0.7 }}>⚠️ No pongas tu nombre, pon tu usuario.</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>@</span>
                <input
                  type="text"
                  placeholder="milumon_gaming"
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
                {loadingData ? (
                  <option disabled>Cargando horarios...</option>
                ) : (
                  slots.map(slot => {
                    const slotDate = new Date(`${slot.date}T${slot.time}Z`);
                    const localTime = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                    return (
                      <option key={slot.id} value={slot.id}>
                        {formatFull(slot.date)} — {localTime} (hora local)
                      </option>
                    );
                  })
                )}
              </select>
              {!loadingData && slots.length === 0 && (
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

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, background: 'var(--sky-light)', padding: '14px', borderRadius: '14px', border: '2px solid var(--sky)' }}>
              <input
                type="checkbox"
                id="watchedLive"
                required
                checked={watchedLive}
                onChange={e => setWatchedLive(e.target.checked)}
                style={{ width: '28px', height: '28px', cursor: 'pointer', flexShrink: 0 }}
              />
              <label htmlFor="watchedLive" style={{ fontSize: '0.92rem', color: 'var(--ink)', fontWeight: 800, cursor: 'pointer', lineHeight: 1.3 }}>
                Confirmo que he visto el live por más de 3 días 📺
              </label>
            </div>

            <div className="form-group" style={{ marginTop: 24, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 20 }}>
              <div className="form-help-row">
                <label className="form-label" style={{ marginBottom: 0 }}>Paso Final: El Pollito 🐣</label>
                <button
                  type="button"
                  className="btn-help"
                  onClick={() => setShowEmojiHelp(!showEmojiHelp)}
                >
                  {showEmojiHelp ? 'Ocultar guía' : '(?) Ver cómo ponerlo'}
                </button>
              </div>

              {showEmojiHelp && (
                <div className="help-card-v2" style={{ marginTop: 12, border: '2px solid var(--orange)', background: '#fffcf5' }}>
                  <div className="help-status-badge" style={{ background: 'var(--orange)' }}>Guía Rápida</div>

                  <div className="example-img-container" style={{ marginBottom: 16, border: '1px solid var(--ink)', borderRadius: 8, overflow: 'hidden' }}>
                    <img
                      src="/tiktok_emoji_example.png"
                      alt="Ejemplo de nombre con pollito"
                      style={{ width: '100%', display: 'block' }}
                    />
                  </div>

                  <div className="steps-list" style={{ textAlign: 'left', marginBottom: 16 }}>
                    <div className="step-item" style={{ marginBottom: 8 }}>
                      <span className="step-number" style={{ width: 22, height: 22, fontSize: '0.75rem' }}>1</span>
                      <span style={{ fontSize: '0.85rem' }}>Copia el emoji con el botón de abajo</span>
                    </div>
                    <div className="step-item" style={{ marginBottom: 8 }}>
                      <span className="step-number" style={{ width: 22, height: 22, fontSize: '0.75rem' }}>2</span>
                      <span style={{ fontSize: '0.85rem' }}>Ve a "Editar perfil" en TikTok</span>
                    </div>
                    <div className="step-item">
                      <span className="step-number" style={{ width: 22, height: 22, fontSize: '0.75rem' }}>3</span>
                      <span style={{ fontSize: '0.85rem' }}>Pégalo al final de tu <b>Nombre</b></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn-copy-v2 ${copySuccess ? 'success' : ''}`}
                    style={{ width: '100%', minHeight: 44, fontSize: '0.9rem' }}
                    onClick={() => {
                      navigator.clipboard.writeText('🐣');
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                  >
                    {copySuccess ? '¡COPIADO! ✅' : 'COPIAR EMOJI 🐣'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, background: 'var(--yellow-light)', padding: '14px', borderRadius: '14px', border: '2px solid var(--yellow)' }}>
                <input
                  type="checkbox"
                  id="hasEmoji"
                  required
                  checked={hasEmoji}
                  onChange={e => setHasEmoji(e.target.checked)}
                  style={{ width: '28px', height: '28px', cursor: 'pointer', flexShrink: 0 }}
                />
                <label htmlFor="hasEmoji" style={{ fontSize: '0.92rem', color: 'var(--ink)', fontWeight: 800, cursor: 'pointer', lineHeight: 1.3 }}>
                  Confirmo que YA TENGO el pollito 🐣 en mi nombre de TikTok
                </label>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', opacity: 0.6, marginTop: 8, textAlign: 'center' }}>
                * Este paso es obligatorio para ser Pollito Oficial.
              </p>
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
        {loadingData ? (
          <>
            <div className="skeleton-card skeleton" />
            <div className="skeleton-card skeleton" />
          </>
        ) : pendingPollitos.length === 0 ? (
          <p className="empty-text">No hay entrevistas por confirmar.</p>
        ) : (
          pendingPollitos.map(p => {
            const slotDate = p.date && p.time ? new Date(`${p.date}T${p.time}Z`) : null;
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
        {loadingData ? (
          <>
            <div className="skeleton-card skeleton" />
            <div className="skeleton-card skeleton" />
          </>
        ) : officialPollitos.length === 0 ? (
          <p className="empty-text">Aún no hay entrevistas confirmadas.</p>
        ) : (
          officialPollitos.map(p => {
            const slotDate = p.date && p.time ? new Date(`${p.date}T${p.time}Z`) : null;
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

