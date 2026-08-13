-- ============================================================
-- SCRIPT DE MIGRACIÓN SUPABASE PARA MESTIZO POS
-- Copia y pega todo este código en el "SQL Editor" de tu proyecto Supabase
-- ============================================================

-- 1. Tabla de Insumos (Ingredientes / Materia Prima)
CREATE TABLE IF NOT EXISTS public.insumos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  yield_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Productos (Platillos, Bebidas y Recetas)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  recipe JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Ventas (Histórico de comanda y cobranza)
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  tip_percent NUMERIC NOT NULL DEFAULT 0,
  tip_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  shift_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Turnos (Cortes de Caja y Arqueos)
CREATE TABLE IF NOT EXISTS public.shifts (
  id TEXT PRIMARY KEY,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  cashier_name TEXT NOT NULL DEFAULT 'Cajero Turno',
  initial_cash NUMERIC NOT NULL DEFAULT 0,
  is_open BOOLEAN NOT NULL DEFAULT true,
  sales_count NUMERIC NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_cash NUMERIC NOT NULL DEFAULT 0,
  total_card NUMERIC NOT NULL DEFAULT 0,
  total_transfer NUMERIC NOT NULL DEFAULT 0,
  sales JSONB DEFAULT '[]'::jsonb,
  actual_physical_cash NUMERIC,
  expected_cash NUMERIC,
  discrepancy NUMERIC,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Configuración de Impresora
CREATE TABLE IF NOT EXISTS public.printer_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  paper_width TEXT NOT NULL DEFAULT '80mm',
  header_title TEXT NOT NULL DEFAULT 'MESTIZO COMEDOR & BAR',
  header_subtitle TEXT NOT NULL DEFAULT 'Tacos, Tortas, Chelas & Cocteles',
  footer_message TEXT NOT NULL DEFAULT '¡Gracias por tu visita! Vuelve pronto.',
  auto_print BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) y Políticas de Acceso Público para el POS
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to insumos" ON public.insumos;
CREATE POLICY "Allow public access to insumos" ON public.insumos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to products" ON public.products;
CREATE POLICY "Allow public access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to sales" ON public.sales;
CREATE POLICY "Allow public access to sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to shifts" ON public.shifts;
CREATE POLICY "Allow public access to shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to printer_settings" ON public.printer_settings;
CREATE POLICY "Allow public access to printer_settings" ON public.printer_settings FOR ALL USING (true) WITH CHECK (true);

-- Notificar activación de publicaciones en tiempo real para Supabase Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.insumos, public.products, public.sales, public.shifts;
COMMIT;
