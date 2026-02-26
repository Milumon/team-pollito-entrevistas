-- ============================================================
-- TEAM POLLITO — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ----------------------------
-- 1. Tabla de horarios (slots)
-- ----------------------------
CREATE TABLE IF NOT EXISTS slots (
  id         BIGSERIAL PRIMARY KEY,
  date       DATE        NOT NULL,
  time       TIME        NOT NULL,
  is_booked  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_slot UNIQUE (date, time)
);

-- ----------------------------
-- 2. Tabla de candidatos (pollitos)
-- ----------------------------
CREATE TABLE IF NOT EXISTS pollitos (
  id           BIGSERIAL PRIMARY KEY,
  roblox_user  TEXT        NOT NULL,
  tiktok_user  TEXT        NOT NULL,
  slot_id      BIGINT      UNIQUE REFERENCES slots(id) ON DELETE SET NULL,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'official', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 3. Vista para leer pollitos con fecha/hora del slot
--    (evita JOINs manuales en cada query)
-- ----------------------------
CREATE OR REPLACE VIEW pollitos_with_slot AS
  SELECT
    p.id,
    p.roblox_user,
    p.tiktok_user,
    p.status,
    p.created_at,
    s.date::TEXT   AS date,
    s.time::TEXT   AS time,
    p.slot_id
  FROM pollitos p
  LEFT JOIN slots s ON s.id = p.slot_id;

-- ----------------------------
-- 4. Row Level Security (RLS)
--    La API usa service_role, que salta RLS.
--    Activamos RLS de todas formas para seguridad
--    si en algún momento se usa el anon key directo.
-- ----------------------------
ALTER TABLE slots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pollitos ENABLE ROW LEVEL SECURITY;

-- Lectura pública de slots disponibles
CREATE POLICY "slots_read_public"
  ON slots FOR SELECT
  USING (true);

-- Lectura pública de pollitos (para mostrar la lista en landing)
CREATE POLICY "pollitos_read_public"
  ON pollitos FOR SELECT
  USING (true);

-- Inserción pública de pollitos (el formulario de la landing)
CREATE POLICY "pollitos_insert_public"
  ON pollitos FOR INSERT
  WITH CHECK (true);

-- Las operaciones de escritura en slots y actualización de pollitos
-- quedan restringidas al service_role (panel admin via API)
