-- ==============================================================================
-- SCHEMA SUPABASE: SISTEMA DE CAPTACIÓN, SCORING Y CRM PARA AGENTES DE VENTA
-- ==============================================================================

-- 1. Crear tabla de Prospectos (Leads)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    company TEXT,
    qualification_answers JSONB DEFAULT '{}'::jsonb, -- Respuestas del formulario
    score INTEGER NOT NULL DEFAULT 0,                 -- Puntuación (ej. 0 a 100)
    temperature TEXT NOT NULL DEFAULT 'WARM' CHECK (temperature IN ('HOT', 'WARM', 'COLD')),
    status TEXT NOT NULL DEFAULT 'NO_CONTACTADO' CHECK (status IN ('NO_CONTACTADO', 'CONTACTADO', 'DESCARTADO', 'CERRADO')),
    notes TEXT DEFAULT '',
    contacted_at TIMESTAMP WITH TIME ZONE,
    privacy_accepted BOOLEAN NOT NULL DEFAULT true,
    privacy_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    privacy_version TEXT DEFAULT 'v1.0-2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices de alto rendimiento para el ordenamiento del panel de ventas
-- Ordena los más calientes (HOT) con mayor puntuación arriba
CREATE INDEX IF NOT EXISTS idx_leads_priority 
ON public.leads (temperature, score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_status 
ON public.leads (status);

-- 3. Trigger para actualizar automáticamente 'updated_at' y 'contacted_at'
CREATE OR REPLACE FUNCTION update_lead_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.status = 'CONTACTADO' AND OLD.status != 'CONTACTADO' AND NEW.contacted_at IS NULL THEN
        NEW.contacted_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_update ON public.leads;
CREATE TRIGGER trg_lead_update
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_timestamp();

-- 4. Seguridad de Nivel de Fila (Row Level Security - RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política A: Inserción pública (Anon) - El formulario del Landing Page puede registrar prospectos
CREATE POLICY "Permitir insercion publica desde el landing" 
ON public.leads 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Política B: Lectura de prospectos (Permite sincronizar con el panel CRM)
CREATE POLICY "Permitir lectura para el CRM" 
ON public.leads 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Política C: Actualización de notas y estado (Contactado / No contactado)
CREATE POLICY "Permitir actualizacion desde el CRM" 
ON public.leads 
FOR UPDATE 
TO anon, authenticated 
USING (true);
