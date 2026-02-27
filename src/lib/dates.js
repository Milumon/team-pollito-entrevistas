// Formateo de fechas en español usando APIs nativas (sin date-fns)

/**
 * "lunes 3 de marzo"
 */
export function formatFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * "03 mar"
 */
export function formatShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

/**
 * "lun 3 mar"
 */
export function formatMedium(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * "03 de marzo"
 */
export function formatDayMonth(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });
}

/**
 * "08:00 PM"
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
