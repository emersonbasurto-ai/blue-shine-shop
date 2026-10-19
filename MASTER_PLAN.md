# 🚀 MASTER PLAN: De Investigación de Mercado (Apify) a Landing Page con Despliegue Automático (GitHub + Vercel)

Este documento es la hoja de ruta maestra del proyecto dividida en **5 Fases**, incluyendo una fase dedicada exclusivamente a la conexión y despliegue continuo (CI/CD) entre **GitHub** y **Vercel**.

---

## 🛠️ Desglose Detallado por Fases y Entregables

### FASE 1: Configuración de Entorno y Seguridad
- [x] Crear archivo `.env` con las variables de Apify, GitHub, Vercel y Supabase.
- [x] Crear archivo `.gitignore` para impedir que `.env` se suba al repositorio.
- [x] Crear schema SQL de base de datos y políticas de seguridad RLS en `docs/supabase_schema.sql`.
- [x] Conexión y validación de API de **Apify** completada exitosamente.
- [ ] Completar tokens de GitHub, Vercel y Supabase en `.env`.
- [ ] Ejecutar script de validación de conexión para GitHub, Vercel y Supabase.

---

### FASE 2: Estudio de Mercado Automatizado con Apify (COMPLETADA)
- [x] **Brief de la Marca:** Nicho Smart Casual & Oficina Joven (*Desk-to-Dinner*), base Manta hacia todo Ecuador.
- [x] **Ejecución de Scraper en Apify:** Extracción de competidores (Zara, De Prati, H&M, Cocoa Boutique, TikTok shops), precios y canales de despacho Servientrega en Ecuador.
- [x] **Entregable Generado:** [docs/01_ESTUDIO_DE_MERCADO.md](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/docs/01_ESTUDIO_DE_MERCADO.md) + datos crudos en [data/raw_market_data.json](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/data/raw_market_data.json).
- [x] **Estudio Profundo VoC & TikTok:** [docs/03_ANALISIS_PROFUNDO_VOC_Y_TIKTOK.md](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/docs/03_ANALISIS_PROFUNDO_VOC_Y_TIKTOK.md) (75 videos virales mapeados, 50 comentarios de compradoras y 5 fricciones críticas en Ecuador).



---

### FASE 3: Estrategia de Marketing, Oferta y Copywriting (COMPLETADA)
- [x] **Posicionamiento y Oferta:** Buyer Persona "Camila", PUV (*Desk-to-Dinner*), Mecanismo Único (*Smart-Fit Latino 24/7*) y Value Stack con Set Ejecutivo a $69.99 USD.
- [x] **Copywriting Completo:** Redacción persuasiva de las 7 secciones para la Landing Page.
- [x] **Entregable Generado:** [docs/02_ESTRATEGIA_Y_COPY.md](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/docs/02_ESTRATEGIA_Y_COPY.md).

---


### FASE 4: Desarrollo de Landing Page, Lead Scoring y Panel CRM (COMPLETADA)
- [x] **Identidad Visual y Favicons Listos:** Extracción cromática del `LOGO.jpg`, recorte y generación de favicons (`favicon.svg`, `.ico`, 16px, 32px, 48px, Apple Touch Icon 180px, Logo 512px) y Manual en [docs/04_MANUAL_DE_IDENTIDAD_VISUAL.md](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/docs/04_MANUAL_DE_IDENTIDAD_VISUAL.md).
- [x] **Diseño UI/UX Mobile-First de la Landing ([index.html](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/index.html)):**
  - Paleta oficial Navy `#2B325E` y Coral `#EF8A56`.
  - Hero persuasivo Desk-to-Dinner con bundle destacado a $69.99 USD.
  - Catálogo de 3 productos con precios transparentes y sin "precio por DM".
  - Sección de fricciones resueltas (estatura ecuatoriana, telas anti-arrugas, flete transparente).
  - Testimonios reales de Quito, Guayaquil, Cuenca y Manta, FAQ y botón flotante de WhatsApp.
- [x] **Formulario de Calificación Interactivo & Lead Scoring Engine ([js/scoring-engine.js](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/js/scoring-engine.js)):**
  - Scoring de 0 a 100 con clasificación automática de temperatura: 🔥 HOT (>=75 pts), ⚡ WARM (40-74 pts), ❄️ COLD (<40 pts).
  - Detección de la objeción principal (talla, tela, tiempo de envío).
  - Redirección automática a WhatsApp personalizada.
- [x] **Panel Administrativo / CRM para Agente de Ventas ([admin.html](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/admin.html) y [js/admin-crm.js](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/js/admin-crm.js)):**
  - Acceso seguro con contraseña (PIN por defecto: `blueshine2026`).
  - **Priorización Automática:** Los prospectos más calientes (🔥) aparecen al tope de la lista.
  - **Botón 1-Click WhatsApp:** Abre el chat con guion personalizado prellenado respondiendo a la duda exacta de la clienta.
  - **Gestión Rápida de Estado:** Alternador `[No contactado]` ↔ `[Contactado ✓]`.
  - Notas del vendedor y exportación a Excel / CSV.
- [x] **Capa de Conexión y Resiliencia ([js/supabase-config.js](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/js/supabase-config.js)):**
  - Conexión directa a Supabase con fallback local automático (`localStorage`) para pruebas inmediatas offline.
- [x] **Configuración de Despliegue ([vercel.json](file:///c:/Users/emers/OneDrive/Escritorio/ANTIGRAVITY%20MACRO/vercel.json)):**
  - Rutas limpias (`/admin`), compresión de assets y compatibilidad total con Vercel.

---


### FASE 5: Conexión Automática GitHub ↔ Vercel y Despliegue Continuo (CI/CD)
1. **Creación y Conexión del Repositorio en GitHub (`GITHUB_TOKEN`):**
   - Inicialización de Git local (`git init`, rama `main`).
   - Creación automática del repositorio remoto mediante la API de GitHub (`POST /user/repos`).
   - Primer `git push` seguro (protegiendo `.env`).
2. **Creación y Vinculación del Proyecto en Vercel (`VERCEL_TOKEN`):**
   - Creación/vinculación automática del proyecto en Vercel vía API/CLI (`vercel link --yes`).
   - Inyección automática de las variables de entorno de Supabase en Vercel (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
   - Extracción automática de `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` y registro en `.env`.
3. **Pipeline de Despliegue Automático (CI/CD):**
   - Vinculación del repositorio GitHub con Vercel.
   - Cada `git push` a la rama `main` actualizará automáticamente la web en producción sin intervención manual.
4. **Verificación y Lanzamiento en Vivo:**
   - Despliegue inicial a producción (`vercel --prod`), verificación HTTP 200 y entrega de la **URL pública final (`.vercel.app`)**.

---

## 📋 Checklist de Credenciales en `.env`

| Variable | Dónde obtenerla | Permisos / Notas |
| :--- | :--- | :--- |
| `APIFY_API_TOKEN` | https://console.apify.com/settings/integrations | Personal API Token |
| `GITHUB_TOKEN` | https://github.com/settings/tokens | Permisos `repo` y `workflow` |
| `GITHUB_USERNAME` | Tu usuario de GitHub | N/A |
| `GITHUB_REPO_NAME` | Nombre para el repositorio (ej. `embudo-marca`) | Se creará automáticamente |
| `VERCEL_TOKEN` | https://vercel.com/account/tokens | Full Access Token |
| `VERCEL_ORG_ID` | *Dejar vacío* | Se autocompletará vía API/CLI |
| `VERCEL_PROJECT_ID` | *Dejar vacío* | Se autocompletará vía API/CLI |
| `SUPABASE_URL` | https://supabase.com/dashboard/project/_/settings/api | URL del proyecto (`https://xxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | https://supabase.com/dashboard/project/_/settings/api | Clave pública (`anon public`) para inserción |
| `SUPABASE_SERVICE_ROLE_KEY` | https://supabase.com/dashboard/project/_/settings/api | Clave secreta administrativa (opcional) |

