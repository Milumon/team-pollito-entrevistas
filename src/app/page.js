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
  const [avatars, setAvatars] = useState({});
  const [showMembers, setShowMembers] = useState(false);

  // ── View mode: null = welcome, 'ingresar', 'regresar' ──
  const [viewMode, setViewMode] = useState(null);

  // ── Regresar state ──
  const [regresarList, setRegresarList] = useState([]);
  const [loadingRegresar, setLoadingRegresar] = useState(true);
  const [regresarFormData, setRegresarFormData] = useState({
    roblox_user: '', tiktok_user: '', ban_reason: '', return_reason: '', preferred_date: '', website: ''
  });
  const [regresarLoading, setRegresarLoading] = useState(false);
  const [regresarSuccess, setRegresarSuccess] = useState(false);
  const [regresarHasEmoji, setRegresarHasEmoji] = useState(false);
  const [regresarLoadTimestamp, setRegresarLoadTimestamp] = useState(0);
  const [showRegresarTiktokExample, setShowRegresarTiktokExample] = useState(false);
  const [showRegresarEmojiHelp, setShowRegresarEmojiHelp] = useState(false);
  const [regresarCopySuccess, setRegresarCopySuccess] = useState(false);
  const [lastSubmittedRegresarMod, setLastSubmittedRegresarMod] = useState('');

  // ── Step tracking for forms ──
  const [ingresarStep, setIngresarStep] = useState(1);
  const [regresarStep, setRegresarStep] = useState(1);

  // ── Blocking status ──
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  async function checkUserStatus(type) {
    try {
      setCheckingStatus(true);
      const res = await fetch(`/api/check-status?type=${type}`);
      const data = await res.json();
      if (data && data.allowed === false) {
        setIsBlocked(true);
        setBlockInfo(data);
      } else {
        setIsBlocked(false);
        setBlockInfo(null);
      }
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setCheckingStatus(false);
    }
  }

  useEffect(() => {
    fetchData();
    fetchMembers();
    fetchRegresar();
    setLoadTimestamp(Date.now());
    setRegresarLoadTimestamp(Date.now());
  }, []);

  async function fetchMembers() {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      const membersList = Array.isArray(data) ? data : [];
      setMembers(membersList);

      // Si hay miembros sin avatar_url en la DB, los buscamos en batch para completar (fallback)
      const missingAvatars = membersList.filter(m => !m.avatar_url).map(m => m.roblox_user);

      if (missingAvatars.length > 0) {
        const avRes = await fetch('/api/roblox-avatars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames: missingAvatars })
        });
        if (avRes.ok) {
          const avData = await avRes.json();
          setAvatars(prev => ({ ...prev, ...avData }));
        }
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  }

  async function fetchRegresar() {
    try {
      setLoadingRegresar(true);
      const res = await fetch('/api/regresar');
      const data = await res.json();
      setRegresarList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching regresar:', err);
    } finally {
      setLoadingRegresar(false);
    }
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

  async function handleRegresarSubmit(e) {
    e.preventDefault();
    setRegresarLoading(true);
    try {
      // Encontrar el slot para extraer la fecha pura (YYYY-MM-DD) y evitar errores de sintaxis en DB
      const selectedSlot = slots.find(s => {
        const localT = new Date(`${s.date}T${s.time}Z`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${formatFull(s.date)} — ${localT}` === regresarFormData.preferred_date;
      });

      const res = await fetch('/api/regresar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...regresarFormData,
          preferred_date: selectedSlot ? selectedSlot.date : regresarFormData.preferred_date,
          ts: regresarLoadTimestamp
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error desconocido');
      }
      // Determinar moderadora para el mensaje de éxito
      const selDate = regresarFormData.preferred_date;
      const mod = slots.find(s => {
        const localT = new Date(`${s.date}T${s.time}Z`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${formatFull(s.date)} — ${localT}` === selDate;
      })?.moderator;

      setLastSubmittedRegresarMod(mod || '');
      setRegresarSuccess(true);
      setRegresarFormData({ roblox_user: '', tiktok_user: '', ban_reason: '', return_reason: '', preferred_date: '', website: '' });
      setRegresarHasEmoji(false);
      fetchRegresar();
    } catch (err) {
      alert(err.message || 'Hubo un error al enviar tu solicitud. Por favor intenta de nuevo.');
    } finally {
      setRegresarLoading(false);
    }
  }

  // ── Keyboard shortcuts for steps ──
  const handleIngresarKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Don't prevent default if we're on the last step (let the form submit)
      if (ingresarStep < 4) {
        e.preventDefault();
        if (ingresarStep === 1 && formData.roblox_user.trim()) setIngresarStep(2);
        else if (ingresarStep === 2 && formData.tiktok_user.trim()) setIngresarStep(3);
        else if (ingresarStep === 3 && formData.slot_id) setIngresarStep(4);
      }
    }
  };

  const handleRegresarKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (regresarStep < 4) {
        e.preventDefault();
        if (regresarStep === 1 && regresarFormData.roblox_user.trim() && regresarFormData.tiktok_user.trim()) setRegresarStep(2);
        else if (regresarStep === 2 && regresarFormData.ban_reason.trim()) setRegresarStep(3);
        else if (regresarStep === 3 && regresarFormData.return_reason.trim()) setRegresarStep(4);
      }
    }
  };

  function censorRoblox(username) {
    const clean = (username || '').replace(/^@+/, '');
    if (clean.length <= 3) return clean + '***';
    return clean.slice(0, 3) + '***';
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const pendingPollitos = pollitos.filter(p =>
    p.status === 'pending' && (p.date ? p.date >= todayStr : true)
  );
  const officialPollitos = pollitos.filter(p =>
    p.status === 'official' && (p.date ? p.date >= todayStr : true)
  );

  const pendingRegresar = regresarList.filter(r => r.status === 'pending');
  const approvedRegresar = regresarList.filter(r => r.status === 'approved');

  const rot = () => `${(Math.random() * 2.5 - 1.25).toFixed(1)}deg`;

  function handleBackToWelcome() {
    setViewMode(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page-wrapper">

      {/* ══════════════════════════════════════════════
          WELCOME SCREEN (viewMode === null)
         ══════════════════════════════════════════════ */}
      {viewMode === null && (
        <>
          {/* ── Hero Rediseñado ── */}
          <header className="hero-v2">
            <h1 className="hero-title-v2">
              Team Pollito<br />
              <span className="hero-highlight">
                Entrevistas
                <span className="hero-chick" aria-hidden="true">🐣</span>
              </span>
            </h1>
            <p className="hero-sub-v2">Portal oficial de admisiones</p>
          </header>

          {/* ── Sección de Trámites ── */}
          <div className="welcome-section">
            <h3 className="section-label">Elige tu trámite</h3>
            <div className="pathway-grid">

              {/* Card: INGRESAR */}
              <button
                onClick={() => {
                  setViewMode('ingresar');
                  setLoadTimestamp(Date.now());
                  checkUserStatus('ingresar');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="pathway-card"
                style={{ '--pathway-color': 'var(--yellow)', '--pathway-accent': 'var(--orange)' }}
              >
                <div className="pathway-emoji">🐣</div>
                <div className="pathway-content">
                  <h2 className="pathway-title">Quiero Ingresar</h2>
                  <p className="pathway-desc">Soy nuevo y quiero ser parte del Team Pollito. Agenda tu entrevista de ingreso.</p>
                </div>
                <span className="pathway-arrow">→</span>
              </button>

              {/* Card: REGRESAR */}
              <button
                onClick={() => {
                  setViewMode('regresar');
                  setRegresarLoadTimestamp(Date.now());
                  checkUserStatus('regresar');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="pathway-card"
                style={{ '--pathway-color': 'var(--pink-light)', '--pathway-accent': 'var(--pink)' }}
              >
                <div className="pathway-emoji">🔄</div>
                <div className="pathway-content">
                  <h2 className="pathway-title">Quiero Regresar</h2>
                  <p className="pathway-desc">Fui baneado/a y quiero una segunda oportunidad. Solicita tu entrevista de regreso.</p>
                </div>
                <span className="pathway-arrow">→</span>
              </button>

            </div>
          </div>

          {/* ── Sección de Extras ── */}
          <div className="welcome-section secondary">
            <h3 className="section-label">Explorar</h3>
            <div className="secondary-actions-grid">

              {/* Ver Pollitos Oficiales */}
              <button
                onClick={() => setShowMembers(true)}
                className="btn-secondary-v2 btn-members-v2"
              >
                👑 Ver Pollitos Oficiales ({members.length})
              </button>

              {/* Comprar Camiseta */}
              <a
                href="https://www.roblox.com/es/catalog/75919610314518/Camiseta-Team-Pollito"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary-v2 btn-store-v2"
              >
                👕 Comprar Camiseta Oficial
              </a>

            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          INGRESAR VIEW (viewMode === 'ingresar')
         ══════════════════════════════════════════════ */}
      {
        viewMode === 'ingresar' && (
          <>
            {/* ── Back button ── */}
            <button onClick={handleBackToWelcome} className="btn-back-welcome">
              ← Volver al inicio
            </button>

            {/* ── Hero Rediseñado ── */}
            <header className="hero-v2" style={{ marginTop: 20 }}>
              <h1 className="hero-title-v2" style={{ fontSize: 'clamp(1.8rem, 8vw, 2.4rem)' }}>
                Conviértete en<br />
                <span className="hero-highlight">
                  Pollito Oficial
                </span>
              </h1>
              <p className="hero-sub-v2" style={{ marginTop: 12 }}>Agenda tu entrevista para ser parte del Team</p>
            </header>

            {checkingStatus ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ fontWeight: 800, color: 'var(--ink)' }}>Verificando tu estado... 🐥</p>
              </div>
            ) : isBlocked ? (
              <div className="card" style={{ textAlign: 'center', borderColor: 'var(--orange-soft)', padding: '40px 20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: 20 }}>🛑</div>
                <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', fontSize: '1.8rem', marginBottom: 12 }}>
                  ¡Límite Alcanzado!
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 24, maxWidth: 400, marginInline: 'auto' }}>
                  Parece que ya has enviado el máximo de solicitudes permitidas desde tu conexión.
                </p>

                <div style={{ background: 'var(--orange-light)', border: '2.5px solid var(--orange)', borderRadius: 16, padding: '20px', textAlign: 'left', marginBottom: 24 }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: 8 }}><strong>Motivo:</strong> Ya tienes {blockInfo?.count} solicitudes registradas.</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 700 }}>
                    📅 Podrás intentar de nuevo después de:
                    <br />
                    <span style={{ fontSize: '1.1rem', color: 'var(--orange)', display: 'block', marginTop: 4 }}>
                      {blockInfo?.retryDate ? new Date(blockInfo.retryDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Próximamente'}
                    </span>
                  </p>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: 20 }}>
                  Mira abajo el "Tracker" para ver el estado de tus solicitudes actuales.
                </p>

                <button onClick={handleBackToWelcome} className="btn-primary" style={{ background: 'var(--ink)', maxWidth: 300, margin: '0 auto' }}>
                  Entendido, volver
                </button>
              </div>
            ) : (
              /* ── Booking form ── */
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
                        onClick={() => {
                          setSuccess(false);
                          setIngresarStep(1);
                        }}
                        className="btn-submit"
                        style={{ marginTop: 24, width: '100%', background: 'var(--ink)', color: 'white' }}
                      >
                        Entendido, ir a ver mi estado 🐣
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="step-form">
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

                    {/* ── Progress Bar ── */}
                    <div className="progress-container">
                      <div className="progress-fill" style={{ width: `${(ingresarStep / 4) * 100}%` }}>
                        <span className="progress-emoji">🐣</span>
                      </div>
                    </div>
                    <p className="step-indicator">Paso {ingresarStep} de 4</p>

                    {/* ── STEP 1: Roblox ── */}
                    {ingresarStep === 1 && (
                      <div className="form-step">
                        <h3 style={{ fontSize: '1.4rem', marginBottom: 16, color: 'var(--ink)' }}>1. ¿Quién eres en Roblox? 🎮</h3>
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
                              onKeyDown={handleIngresarKeyDown}
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                        <div className="step-buttons">
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!formData.roblox_user.trim()}
                            onClick={() => setIngresarStep(2)}
                          >
                            Siguiente 🐣
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 2: TikTok ── */}
                    {ingresarStep === 2 && (
                      <div className="form-step">
                        <h3 style={{ fontSize: '1.4rem', marginBottom: 16, color: 'var(--ink)' }}>2. ¿Y en TikTok? 📱</h3>
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
                                <img src="/tiktok_user_example.png" alt="Donde encontrar tu usuario" />
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
                              onKeyDown={handleIngresarKeyDown}
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                        <div className="step-buttons">
                          <button type="button" className="btn-secondary" onClick={() => setIngresarStep(1)}>
                            Atrás
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!formData.tiktok_user.trim()}
                            onClick={() => setIngresarStep(3)}
                          >
                            Siguiente 🐣
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 3: Slot ── */}
                    {ingresarStep === 3 && (
                      <div className="form-step">
                        <h3 style={{ fontSize: '1.4rem', marginBottom: 16, color: 'var(--ink)' }}>3. ¡Elige tu horario! ⏰</h3>
                        <div className="form-group">
                          <label className="form-label">Elige un Horario</label>
                          <select
                            required
                            value={formData.slot_id}
                            onChange={e => setFormData({ ...formData, slot_id: e.target.value })}
                            onKeyDown={handleIngresarKeyDown}
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
                        <div className="step-buttons">
                          <button type="button" className="btn-secondary" onClick={() => setIngresarStep(2)}>
                            Atrás
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!formData.slot_id}
                            onClick={() => setIngresarStep(4)}
                          >
                            Siguiente 🐣
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 4: Misiones ── */}
                    {ingresarStep === 4 && (
                      <div className="form-step">
                        <h3 style={{ fontSize: '1.4rem', marginBottom: 16, color: 'var(--ink)' }}>4. ¡Misiones Finales! 🎯</h3>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--sky-light)', padding: '14px', borderRadius: '14px', border: '2px solid var(--sky)' }}>
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

                        <div className="form-group" style={{ marginTop: 20 }}>
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
                                <img src="/tiktok_emoji_example.png" alt="Ejemplo de nombre con pollito" style={{ width: '100%', display: 'block' }} />
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

                        <div className="step-buttons">
                          <button type="button" className="btn-secondary" onClick={() => setIngresarStep(3)}>
                            Atrás
                          </button>
                          <button type="submit" className="btn-primary" style={{ background: 'var(--mint)' }} disabled={loading || slots.length === 0 || !watchedLive || !hasEmoji || !formData.roblox_user.trim() || !formData.tiktok_user.trim()}>
                            {loading ? 'ENVIANDO...' : '¡QUIERO SER POLLITO! 🐣'}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </section>
            )}

            {/* ── Entrevistas Tracker ── */}
            <div className="welcome-section" style={{ marginTop: 32 }}>
              <h3 className="section-label" style={{ background: 'var(--sky)', color: 'white' }}>Tracker</h3>

              {/* ── Entrevistas por confirmar ── */}
              <div>
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
              <div style={{ marginTop: 28, paddingTop: 28, borderTop: '2px dashed rgba(0,0,0,0.1)' }}>
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
            </div>
          </>
        )}

      {/* ══════════════════════════════════════════════
          REGRESAR VIEW (viewMode === 'regresar')
         ══════════════════════════════════════════════ */}
      {
        viewMode === 'regresar' && (
          <>
            {/* ── Back button ── */}
            <button onClick={handleBackToWelcome} className="btn-back-welcome">
              ← Volver al inicio
            </button>
            {/* ── Hero Rediseñado ── */}
            <header className="hero-v2" style={{ marginTop: 20 }}>
              <h1 className="hero-title-v2" style={{ fontSize: 'clamp(1.6rem, 7vw, 2.2rem)' }}>
                ¿Quieres Regresar?<br />
                <span className="hero-highlight" style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>
                  Solicita tu Entrevista
                </span>
              </h1>
              <p className="hero-sub-v2" style={{ marginTop: 12 }}>Para pollitos baneados que desean volver al Team</p>
            </header>

            {checkingStatus ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ fontWeight: 800, color: 'var(--ink)' }}>Verificando tu estado... 🔄</p>
              </div>
            ) : isBlocked ? (
              <div className="card" style={{ textAlign: 'center', borderColor: 'var(--pink)', padding: '40px 20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: 20 }}>🚫</div>
                <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', fontSize: '1.8rem', marginBottom: 12 }}>
                  Solicitud no disponible
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 24, maxWidth: 400, marginInline: 'auto' }}>
                  Solo se permite una solicitud de regreso por conexión. El equipo ya tiene tu información.
                </p>

                <div style={{ background: 'var(--pink-light)', border: '2.5px solid var(--pink)', borderRadius: 16, padding: '20px', textAlign: 'left', marginBottom: 24 }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: 8 }}><strong>Estado:</strong> Solicitud ya registrada anteriormente.</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 700 }}>
                    📅 Podrás intentar de nuevo después de:
                    <br />
                    <span style={{ fontSize: '1.1rem', color: 'var(--pink)', display: 'block', marginTop: 4 }}>
                      {blockInfo?.retryDate ? new Date(blockInfo.retryDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Próximamente'}
                    </span>
                  </p>
                </div>

                <button onClick={handleBackToWelcome} className="btn-primary" style={{ background: 'var(--ink)', maxWidth: 300, margin: '0 auto' }}>
                  Entendido, volver
                </button>
              </div>
            ) : (
              /* ── Regresar Form ── */
              <section className="card pulse" style={{ borderColor: 'var(--pink)' }}>
                {regresarSuccess ? (
                  <div className="success-box">
                    <div className="success-icon">🫶</div>
                    <p className="success-title">¡Solicitud enviada!</p>
                    <p className="success-sub" style={{ marginBottom: 16 }}>
                      Tu solicitud de regreso ha sido registrada. Espera la revisión del equipo.
                    </p>
                    <div style={{
                      background: 'var(--cream)',
                      border: '3px solid var(--ink-black)',
                      borderRadius: 16,
                      padding: '20px',
                      textAlign: 'left',
                      marginTop: 12,
                      boxShadow: '0 8px 0 rgba(0,0,0,0.1)'
                    }}>
                      <p style={{ marginBottom: 8, fontSize: '0.88rem', lineHeight: 1.4 }}>
                        <strong>¿Qué sigue?</strong>
                      </p>
                      <p style={{ fontSize: '0.85rem', marginBottom: 6, lineHeight: 1.4 }}>
                        1. Tu solicitud aparecerá abajo en la sección de <strong style={{ color: 'var(--pink)' }}>🕒 Solicitudes por revisar</strong>.
                      </p>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 6 }}>
                        2. <strong>¡MUY IMPORTANTE!</strong> Para agilizar el proceso, envía un mensaje por TikTok a la moderadora:
                      </p>
                      {lastSubmittedRegresarMod ? (
                        <div style={{
                          background: 'white',
                          padding: '16px',
                          borderRadius: 12,
                          border: '2px dashed var(--pink)',
                          marginBottom: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 10
                        }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--pink)' }}>
                            @{lastSubmittedRegresarMod}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(lastSubmittedRegresarMod);
                              alert('¡Nombre de la moderadora copiado! 📋');
                            }}
                            className="btn-help"
                            style={{ padding: '6px 16px', fontSize: '0.85rem', color: 'var(--pink)', borderColor: 'var(--pink)' }}
                          >
                            📋 Copiar Usuario
                          </button>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem' }}>3. El equipo revisará tu caso pronto.</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRegresarSuccess(false);
                        setRegresarStep(1);
                        checkUserStatus('regresar');
                      }}
                      className="btn-submit"
                      style={{ marginTop: 24, width: '100%', background: 'var(--ink)', color: 'white', border: '3px solid var(--ink)', borderRadius: 'var(--radius-md)', padding: '14px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: 'var(--shadow)' }}
                    >
                      Entendido, ver mi solicitud 🐣
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegresarSubmit} className="step-form">
                    {/* Honeypot */}
                    <div style={{ display: 'none' }} aria-hidden="true">
                      <input
                        type="text"
                        name="website"
                        value={regresarFormData.website}
                        onChange={e => setRegresarFormData({ ...regresarFormData, website: e.target.value })}
                        tabIndex="-1"
                        autoComplete="off"
                      />
                    </div>

                    {/* ── Progress Bar ── */}
                    <div className="progress-container">
                      <div className="progress-fill" style={{ width: `${(regresarStep / 4) * 100}%` }}>
                        <span className="progress-emoji">🐣</span>
                      </div>
                    </div>
                    <p className="step-indicator">Paso {regresarStep} de 4</p>

                    {/* ── STEP 1: Identidad ── */}
                    {regresarStep === 1 && (
                      <div className="form-step">
                        <h3 style={{ fontSize: '1.4rem', marginBottom: 16, color: 'var(--ink)' }}>1. Confirma tu Identidad 🕵️</h3>
                        <div className="form-group">
                          <label className="form-label">Tu Usuario de Roblox</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>@</span>
                            <input
                              type="text"
                              placeholder="RobloxUser"
                              required
                              value={regresarFormData.roblox_user}
                              onChange={e => setRegresarFormData({ ...regresarFormData, roblox_user: e.target.value })}
                              onKeyDown={handleRegresarKeyDown}
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <div className="form-help-row">
                            <label className="form-label">Tu Usuario de TikTok (del que fuiste baneado/a)</label>
                            <button
                              type="button"
                              className="btn-help"
                              onClick={() => setShowRegresarTiktokExample(!showRegresarTiktokExample)}
                            >
                              {showRegresarTiktokExample ? 'Cerrar' : '(?) Ver ejemplo'}
                            </button>
                          </div>

                          {showRegresarTiktokExample && (
                            <div className="help-card-v2">
                              <div className="help-status-badge">Tutorial</div>
                              <div className="example-img-container">
                                <img src="/tiktok_user_example.png" alt="Donde encontrar tu usuario" />
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
                              value={regresarFormData.tiktok_user}
                              onChange={e => setRegresarFormData({ ...regresarFormData, tiktok_user: e.target.value })}
                              onKeyDown={handleRegresarKeyDown}
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>

                        <div className="step-buttons">
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!regresarFormData.roblox_user.trim() || !regresarFormData.tiktok_user.trim()}
                            onClick={() => setRegresarStep(2)}
                          >
                            Siguiente 🐣
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 2: Razón de baneo ── */}
                    {regresarStep === 2 && (
                      <div className="form-step">
                        <h3 style={{ fontSize: '1.4rem', marginBottom: 16, color: 'var(--ink)' }}>2. ¿Qué pasó? 🌧️</h3>
                        <div className="form-group">
                          <label className="form-label">¿Por qué fuiste baneado/a?</label>
                          <textarea
                            placeholder="Explica brevemente la razón de tu baneo..."
                            required
                            value={regresarFormData.ban_reason}
                            onChange={e => setRegresarFormData({ ...regresarFormData, ban_reason: e.target.value })}
                            onKeyDown={handleRegresarKeyDown}
                            rows={4}
                            style={{
                              width: '100%',
                              minHeight: 100,
                              background: 'var(--cream)',
                              border: '2.5px solid var(--ink)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '12px 16px',
                              fontFamily: 'var(--font-body)',
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: 'var(--ink)',
                              resize: 'vertical',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div className="step-buttons">
                          <button type="button" className="btn-secondary" onClick={() => setRegresarStep(1)}>
                            Atrás
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!regresarFormData.ban_reason.trim()}
                            onClick={() => setRegresarStep(3)}
                          >
                            Siguiente 🐣
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 3: Razón de regreso ── */}
                    {regresarStep === 3 && (
                      <div className="form-step">
                        <h3 style={{ fontSize: '1.4rem', marginBottom: 16, color: 'var(--ink)' }}>3. Segunda Oportunidad 🌱</h3>
                        <div className="form-group">
                          <label className="form-label">¿Por qué quieres volver?</label>
                          <textarea
                            placeholder="Cuéntanos por qué mereces una segunda oportunidad..."
                            required
                            value={regresarFormData.return_reason}
                            onChange={e => setRegresarFormData({ ...regresarFormData, return_reason: e.target.value })}
                            onKeyDown={handleRegresarKeyDown}
                            rows={4}
                            style={{
                              width: '100%',
                              minHeight: 100,
                              background: 'var(--cream)',
                              border: '2.5px solid var(--ink)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '12px 16px',
                              fontFamily: 'var(--font-body)',
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: 'var(--ink)',
                              resize: 'vertical',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div className="step-buttons">
                          <button type="button" className="btn-secondary" onClick={() => setRegresarStep(2)}>
                            Atrás
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!regresarFormData.return_reason.trim()}
                            onClick={() => setRegresarStep(4)}
                          >
                            Siguiente 🐣
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 4: Fecha y Misiones ── */}
                    {regresarStep === 4 && (
                      <div className="form-step">
                        <h3 style={{ fontSize: '1.4rem', marginBottom: 16, color: 'var(--ink)' }}>4. Detalles Finales 🎯</h3>

                        <div className="form-group">
                          <label className="form-label">¿Cuándo te gustaría pasar por entrevista?</label>
                          <select
                            required
                            value={regresarFormData.preferred_date}
                            onChange={e => setRegresarFormData({ ...regresarFormData, preferred_date: e.target.value })}
                            onKeyDown={handleRegresarKeyDown}
                          >
                            <option value="">Selecciona una fecha...</option>
                            {loadingData ? (
                              <option disabled>Cargando horarios...</option>
                            ) : (
                              slots.map(slot => {
                                const slotDate = new Date(`${slot.date}T${slot.time}Z`);
                                const localTime = slotDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
                                const displayVal = `${formatFull(slot.date)} — ${localTime}`;
                                return (
                                  <option key={slot.id} value={displayVal}>
                                    {displayVal} (hora local)
                                  </option>
                                );
                              })
                            )}
                          </select>
                          {regresarFormData.preferred_date && slots.length > 0 && (() => {
                            const slot = slots.find(s => {
                              const localT = new Date(`${s.date}T${s.time}Z`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                              return `${formatFull(s.date)} — ${localT}` === regresarFormData.preferred_date;
                            });
                            if (!slot || !slot.moderator) return null;
                            return (
                              <div style={{ marginTop: 8, fontSize: '0.98rem', color: 'var(--pink)', fontWeight: 700 }}>
                                <span>Moderadora: <strong>@{slot.moderator}</strong></span>
                              </div>
                            );
                          })()}
                          {!loadingData && slots.length === 0 && (
                            <p className="no-slots-warning">No hay horarios disponibles por ahora.</p>
                          )}
                        </div>

                        <div className="form-group" style={{ marginTop: 24, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 20 }}>
                          <div className="form-help-row">
                            <label className="form-label" style={{ marginBottom: 0 }}>Paso Obligatorio: El Pollito 🐣</label>
                            <button
                              type="button"
                              className="btn-help"
                              onClick={() => setShowRegresarEmojiHelp(!showRegresarEmojiHelp)}
                            >
                              {showRegresarEmojiHelp ? 'Ocultar guía' : '(?) Ver cómo ponerlo'}
                            </button>
                          </div>

                          {showRegresarEmojiHelp && (
                            <div className="help-card-v2" style={{ marginTop: 12, border: '2px solid var(--pink)', background: '#fff5f7' }}>
                              <div className="help-status-badge" style={{ background: 'var(--pink)' }}>Guía Rápida</div>
                              <div className="example-img-container" style={{ marginBottom: 16, border: '1px solid var(--ink)', borderRadius: 8, overflow: 'hidden' }}>
                                <img src="/tiktok_emoji_example.png" alt="Ejemplo de nombre con pollito" style={{ width: '100%', display: 'block' }} />
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
                                className={`btn-copy-v2 ${regresarCopySuccess ? 'success' : ''}`}
                                style={{ width: '100%', minHeight: 44, fontSize: '0.9rem' }}
                                onClick={() => {
                                  navigator.clipboard.writeText('🐣');
                                  setRegresarCopySuccess(true);
                                  setTimeout(() => setRegresarCopySuccess(false), 2000);
                                }}
                              >
                                {regresarCopySuccess ? '¡COPIADO! ✅' : 'COPIAR EMOJI 🐣'}
                              </button>
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, background: 'var(--pink-light)', padding: '14px', borderRadius: '14px', border: '2px solid var(--pink)' }}>
                            <input
                              type="checkbox"
                              id="regresarHasEmoji"
                              required
                              checked={regresarHasEmoji}
                              onChange={e => setRegresarHasEmoji(e.target.checked)}
                              style={{ width: '28px', height: '28px', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <label htmlFor="regresarHasEmoji" style={{ fontSize: '0.92rem', color: 'var(--ink)', fontWeight: 800, cursor: 'pointer', lineHeight: 1.3 }}>
                              Confirmo que YA TENGO el pollito 🐣 en mi nombre de TikTok
                            </label>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', opacity: 0.6, marginTop: 8, textAlign: 'center' }}>
                            * Este paso es obligatorio para solicitar el regreso.
                          </p>
                        </div>

                        <div className="step-buttons">
                          <button type="button" className="btn-secondary" onClick={() => setRegresarStep(3)}>
                            Atrás
                          </button>
                          <button
                            type="submit"
                            className="btn-primary"
                            style={{ background: 'var(--pink)' }}
                            disabled={regresarLoading || !regresarHasEmoji || !regresarFormData.roblox_user.trim() || !regresarFormData.tiktok_user.trim() || !regresarFormData.ban_reason.trim() || !regresarFormData.return_reason.trim() || !regresarFormData.preferred_date}
                          >
                            {regresarLoading ? 'ENVIANDO...' : 'SOLICITAR REGRESO 🐣'}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </section>
            )}

            {/* ── Tracker de Regresos ── */}
            <div className="welcome-section" style={{ marginTop: 32 }}>
              <h3 className="section-label" style={{ background: 'var(--sky)', color: 'white' }}>Tracker</h3>

              {/* ── Solicitudes de regreso por revisar ── */}
              <div>
                <div className="section-heading">
                  🕒 Solicitudes de Regreso Pendientes
                  {pendingRegresar.length > 0 && (
                    <span className="chip-count" style={{ background: 'var(--pink)' }}>{pendingRegresar.length}</span>
                  )}
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 12, opacity: 0.8 }}>
                  Pollitos baneados que han solicitado regresar y están pendientes de revisión.
                </p>
                {loadingRegresar ? (
                  <>
                    <div className="skeleton-card skeleton" />
                    <div className="skeleton-card skeleton" />
                  </>
                ) : pendingRegresar.length === 0 ? (
                  <p className="empty-text">No hay solicitudes de regreso pendientes.</p>
                ) : (
                  pendingRegresar.map(r => (
                    <div key={r.id} className="pollito-card" style={{ transform: `rotate(${rot()})`, flexDirection: 'column', alignItems: 'flex-start', gap: '8px', borderColor: 'var(--pink)' }}>
                      <span className="pollito-name">Roblox: @{censorRoblox(r.roblox_user)}</span>
                      <div className="pollito-name" style={{ marginTop: -4, color: 'var(--ink-soft)', opacity: 0.5 }}>
                        TikTok: <span style={{ fontStyle: 'italic' }}>oculto por privacidad</span>
                      </div>
                      <div style={{
                        marginTop: 8,
                        padding: '10px 14px',
                        background: 'rgba(255,143,171,0.1)',
                        borderRadius: '12px',
                        border: '1px dashed var(--pink)',
                        width: '100%'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
                          <span style={{ fontSize: '1rem' }}>📅</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                            Fecha deseada: {r.preferred_date ? formatMedium(r.preferred_date) : 'No especificada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ── Solicitudes de regreso aprobadas ── */}
              <div style={{ marginTop: 28, paddingTop: 28, borderTop: '2px dashed rgba(0,0,0,0.1)' }}>
                <div className="section-heading">
                  ✅ Entrevistas de Regreso Confirmadas
                  {approvedRegresar.length > 0 && (
                    <span className="chip-count" style={{ background: 'var(--mint)' }}>{approvedRegresar.length}</span>
                  )}
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 8 }}>
                  Pollitos calificados para una entrevista de regreso y con horario asignado.
                </p>
                {loadingRegresar ? (
                  <>
                    <div className="skeleton-card skeleton" />
                    <div className="skeleton-card skeleton" />
                  </>
                ) : approvedRegresar.length === 0 ? (
                  <p className="empty-text">Aún no hay regresos aprobados.</p>
                ) : (
                  approvedRegresar.map(r => (
                    <div key={r.id} className="pollito-card" style={{ transform: `rotate(${rot()})`, flexDirection: 'column', alignItems: 'flex-start', gap: '8px', borderColor: 'var(--mint)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span className="pollito-name">Roblox: @{censorRoblox(r.roblox_user)}</span>
                        <span className="badge-official" style={{ background: 'var(--mint)', color: '#fff' }}>ENTREVISTA ASIGNADA</span>
                      </div>
                      <div className="pollito-name" style={{ marginTop: -4, color: 'var(--ink-soft)', opacity: 0.5 }}>
                        TikTok: <span style={{ fontStyle: 'italic' }}>oculto por privacidad</span>
                      </div>
                      {r.preferred_date && (
                        <div style={{
                          marginTop: 8,
                          padding: '10px 14px',
                          background: 'rgba(78,205,196,0.1)',
                          borderRadius: '12px',
                          border: '1px dashed var(--mint)',
                          width: '100%'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
                            <span style={{ fontSize: '1rem' }}>📅</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                              Fecha de entrevista: {formatMedium(r.preferred_date)}
                            </span>
                          </div>
                          {(() => {
                            // Intentar encontrar la moderadora buscando en los slots por fecha
                            const assignedSlot = slots.find(s => s.date === r.preferred_date);
                            const modName = assignedSlot?.moderator;
                            if (!modName) return (
                              <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--ink-soft)', background: 'rgba(0,0,0,0.03)', padding: '8px', borderRadius: '8px', width: '100%' }}>
                                🔔 Recuerda escribir a la moderadora que te asignó el horario.
                              </p>
                            );

                            return (
                              <div style={{
                                marginTop: 10,
                                paddingTop: 8,
                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4
                              }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-soft)' }}>
                                  📩 Debes escribirle por TikTok a:
                                </span>
                                <a
                                  href={`https://www.tiktok.com/@${modName}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 800,
                                    color: 'var(--mint)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    textDecoration: 'none',
                                    padding: '4px 8px',
                                    background: 'var(--mint-light)',
                                    borderRadius: '8px',
                                    width: 'fit-content'
                                  }}
                                >
                                  <span>👤 @{modName}</span>
                                  <span style={{ fontSize: '0.7rem' }}>↗️</span>
                                </a>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

      {/* ── Modal Pollitos Oficiales (shared) ── */}
      {
        showMembers && (
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
                    {members.map(m => {
                      const rUser = (m.roblox_user || '').replace(/^@+/, '');
                      // Prioridad 1: Avatar guardado en DB. Prioridad 2: Avatar obtenido de cache/API fallback.
                      const avatarUrl = m.avatar_url || avatars[rUser] || avatars[m.roblox_user];
                      return (
                        <div key={m.id} className="pollito-card" style={{ transform: `rotate(${rot()})`, border: '3px solid var(--yellow)', margin: 0, minWidth: 180, flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={rUser}
                              style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--ink)', background: 'var(--cream)', marginBottom: 4 }}
                            />
                          ) : (
                            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--ink)', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: 4 }}>
                              🐣
                            </div>
                          )}
                          <span className="pollito-name" style={{ alignSelf: 'stretch', textAlign: 'start' }}>Roblox: @{rUser}</span>
                          <div className="pollito-name" style={{ marginTop: -4, alignSelf: 'stretch', textAlign: 'start' }}>
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
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="modal-footer-v3">
                <button onClick={() => setShowMembers(false)} className="btn-primary-v3">CERRAR</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Admin Link */}
      <a href="/admin" className="footer-link">Panel Admin</a>
    </div>
  );
}
