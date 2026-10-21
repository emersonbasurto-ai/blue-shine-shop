// js/admin-crm.js
// Lógica y Controlador del Panel de Ventas / CRM de BLUE SHINESHOP con Supabase Auth Oficial

const AdminCRM = {
  leads: [],
  currentFilter: 'all',
  searchQuery: '',
  currentUser: null,

  // Inicializar CRM y autenticación con Supabase
  async init() {
    await this.checkAuth();

    // Escuchar eventos de autenticación en tiempo real (login, logout, token refresh)
    if (supabaseClient) {
      supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth Event]', event);
        if (session && session.user) {
          this.currentUser = session.user;
          this.showCRM();
          await this.loadLeads();
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.leads = [];
          this.showLogin();
        }
      });
    }
  },

  // Validar si existe una sesión activa y válida con JWT
  async checkAuth() {
    try {
      const session = await AuthService.getSession();
      if (session && session.user) {
        this.currentUser = session.user;
        this.showCRM();
        await this.loadLeads();
        return true;
      }
    } catch (err) {
      console.warn('[AdminCRM] No hay sesión activa:', err.message);
    }

    this.currentUser = null;
    this.showLogin();
    return false;
  },

  // Mostrar el panel CRM para usuarios autenticados
  showCRM() {
    const authOverlay = document.getElementById('authOverlay');
    const crmContent = document.getElementById('crmContent');
    const emailDisplay = document.getElementById('adminUserEmailDisplay');

    if (authOverlay) authOverlay.classList.add('hidden');
    if (crmContent) crmContent.classList.remove('hidden');

    if (emailDisplay && this.currentUser) {
      emailDisplay.textContent = this.currentUser.email;
    }
    if (window.lucide) lucide.createIcons();
  },

  // Mostrar modal de login si no hay sesión
  showLogin() {
    const authOverlay = document.getElementById('authOverlay');
    const crmContent = document.getElementById('crmContent');

    if (authOverlay) authOverlay.classList.remove('hidden');
    if (crmContent) crmContent.classList.add('hidden');
    if (window.lucide) lucide.createIcons();
  },

  // Iniciar sesión con Supabase Auth (Email y Contraseña)
  async loginWithSupabase(email, password) {
    const res = await AuthService.signIn(email, password);
    if (!res.success) {
      return { success: false, error: res.error };
    }
    this.currentUser = res.user;
    this.showCRM();
    await this.loadLeads();
    return { success: true, user: res.user };
  },

  // Registrar nuevo agente en Supabase Auth
  async registerWithSupabase(email, password, fullName) {
    const res = await AuthService.signUp(email, password, fullName);
    if (!res.success) {
      return { success: false, error: res.error };
    }
    // Si autoconfirm inició la sesión inmediatamente
    if (res.session && res.user) {
      this.currentUser = res.user;
      this.showCRM();
      await this.loadLeads();
      return { success: true, autoLogged: true, user: res.user };
    }
    return { success: true, autoLogged: false, user: res.user };
  },

  // Cerrar sesión segura con Supabase Auth
  async logout() {
    await AuthService.signOut();
    this.currentUser = null;
    this.leads = [];
    this.showLogin();
  },

  // Cargar prospectos ordenados por prioridad (HOT arriba)
  async loadLeads() {
    try {
      this.leads = await LeadsDB.getLeads();
      // Garantizar orden descendente por Score
      this.leads.sort((a, b) => (b.score || 0) - (a.score || 0));
      this.renderStats();
      this.renderLeads();
    } catch (err) {
      console.error('Error al cargar prospectos:', err);
    }
  },

  // Alternar estado Contactado / No Contactado con 1 clic
  async toggleStatus(leadId) {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return;

    const newStatus = lead.status === 'CONTACTADO' ? 'NO_CONTACTADO' : 'CONTACTADO';
    lead.status = newStatus;

    await LeadsDB.updateLead(leadId, { status: newStatus });
    this.renderStats();
    this.renderLeads();
  },

  // Guardar notas del vendedor
  async saveNotes(leadId, notes) {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return;

    lead.notes = notes;
    await LeadsDB.updateLead(leadId, { notes });
  },

  // Precios oficiales de prendas de BLUE SHINESHOP para cálculo del Pipeline
  PRICES: {
    set_completo: 69.99,
    solo_blazer: 42.99,
    blusas: 24.99,
    default: 50.00
  },

  // Obtener valor económico en juego por prospecto
  getLeadValue(lead) {
    const raw = lead.qualification_answers?.prenda;
    if (!raw) return this.PRICES.default;
    
    if (this.PRICES[raw]) return this.PRICES[raw];

    const str = String(raw).toLowerCase();
    if (str.includes('set') || str.includes('69.99')) return this.PRICES.set_completo;
    if (str.includes('blazer') || str.includes('42.99')) return this.PRICES.solo_blazer;
    if (str.includes('blusa') || str.includes('top') || str.includes('24.99')) return this.PRICES.blusas;

    return this.PRICES.default;
  },

  // Formato de moneda USD
  formatUSD(amount) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
  },

  // Renderizar tarjetas de métricas y Pipeline de Ingresos
  renderStats() {
    const total = this.leads.length;
    const hotLeads = this.leads.filter(l => l.temperature === 'HOT');
    const warmLeads = this.leads.filter(l => l.temperature === 'WARM');
    const coldLeads = this.leads.filter(l => l.temperature === 'COLD');
    const pending = this.leads.filter(l => l.status === 'NO_CONTACTADO').length;
    const contacted = this.leads.filter(l => l.status === 'CONTACTADO').length;

    // Métricas de Pipeline Económico ($ en juego)
    let pipeTotal = 0;
    let pipeHot = 0;
    let pipeWarm = 0;
    let pipeCold = 0;

    // Desglose por Producto
    let valSet = 0;
    let countSet = 0;
    let valBlazer = 0;
    let countBlazer = 0;
    let valBlusas = 0;
    let countBlusas = 0;

    this.leads.forEach(lead => {
      const val = this.getLeadValue(lead);
      pipeTotal += val;

      if (lead.temperature === 'HOT') pipeHot += val;
      else if (lead.temperature === 'WARM') pipeWarm += val;
      else pipeCold += val;

      const pKey = lead.qualification_answers?.prenda || '';
      const pStr = String(pKey).toLowerCase();
      if (pStr.includes('set') || pStr.includes('69.99')) {
        valSet += val;
        countSet++;
      } else if (pStr.includes('blazer') || pStr.includes('42.99')) {
        valBlazer += val;
        countBlazer++;
      } else {
        valBlusas += val;
        countBlusas++;
      }
    });

    // Pronóstico Ponderado de Cierre: 80% HOT + 40% WARM + 15% COLD
    const expectedHot = pipeHot * 0.80;
    const expectedWarm = pipeWarm * 0.40;
    const expectedCold = pipeCold * 0.15;
    const pipeForecast = expectedHot + expectedWarm + expectedCold;

    // Porcentajes para barra visual
    const pctHot = pipeTotal > 0 ? ((pipeHot / pipeTotal) * 100).toFixed(0) : 0;
    const pctWarm = pipeTotal > 0 ? ((pipeWarm / pipeTotal) * 100).toFixed(0) : 0;
    const pctCold = pipeTotal > 0 ? ((pipeCold / pipeTotal) * 100).toFixed(0) : 0;

    // Actualizar elementos DOM tradicionales
    const elTotal = document.getElementById('statTotal');
    const elHot = document.getElementById('statHot');
    const elPending = document.getElementById('statPending');
    const elContacted = document.getElementById('statContacted');

    if (elTotal) elTotal.textContent = total;
    if (elHot) elHot.textContent = hotLeads.length;
    if (elPending) elPending.textContent = pending;
    if (elContacted) elContacted.textContent = contacted;

    // Actualizar elementos DOM del Pipeline Financiero
    const elPipeTotal = document.getElementById('pipeTotalVal');
    const elPipeHot = document.getElementById('pipeHotVal');
    const elPipeHotExpected = document.getElementById('pipeHotExpected');
    const elPipeWarm = document.getElementById('pipeWarmVal');
    const elPipeWarmExpected = document.getElementById('pipeWarmExpected');
    const elPipeCold = document.getElementById('pipeColdVal');
    const elPipeForecast = document.getElementById('pipeForecastVal');

    if (elPipeTotal) elPipeTotal.textContent = this.formatUSD(pipeTotal);
    if (elPipeHot) elPipeHot.textContent = this.formatUSD(pipeHot);
    if (elPipeHotExpected) elPipeHotExpected.textContent = `~$${expectedHot.toFixed(2)} USD proyectado (~80%)`;
    if (elPipeWarm) elPipeWarm.textContent = this.formatUSD(pipeWarm);
    if (elPipeWarmExpected) elPipeWarmExpected.textContent = `~$${expectedWarm.toFixed(2)} USD proyectado (~40%)`;
    if (elPipeCold) elPipeCold.textContent = this.formatUSD(pipeCold);
    if (elPipeForecast) elPipeForecast.textContent = this.formatUSD(pipeForecast);

    // Actualizar Barra Visual de Segmentos
    const barHot = document.getElementById('barSegmentHot');
    const barWarm = document.getElementById('barSegmentWarm');
    const barCold = document.getElementById('barSegmentCold');
    if (barHot) barHot.style.width = `${pctHot}%`;
    if (barWarm) barWarm.style.width = `${pctWarm}%`;
    if (barCold) barCold.style.width = `${pctCold}%`;

    const lblHot = document.getElementById('barLabelHot');
    const lblWarm = document.getElementById('barLabelWarm');
    const lblCold = document.getElementById('barLabelCold');
    if (lblHot) lblHot.textContent = `${pctHot}% ($${pipeHot.toFixed(2)})`;
    if (lblWarm) lblWarm.textContent = `${pctWarm}% ($${pipeWarm.toFixed(2)})`;
    if (lblCold) lblCold.textContent = `${pctCold}% ($${pipeCold.toFixed(2)})`;

    // Actualizar desglose por producto
    const elProdSet = document.getElementById('valProdSet');
    const elProdBlazer = document.getElementById('valProdBlazer');
    const elProdBlusa = document.getElementById('valProdBlusa');
    if (elProdSet) elProdSet.textContent = `$${valSet.toFixed(2)} (${countSet} interesadas)`;
    if (elProdBlazer) elProdBlazer.textContent = `$${valBlazer.toFixed(2)} (${countBlazer} interesadas)`;
    if (elProdBlusa) elProdBlusa.textContent = `$${valBlusas.toFixed(2)} (${countBlusas} interesadas)`;
  },

  // Renderizar la lista de prospectos filtrada
  renderLeads() {
    const container = document.getElementById('leadsContainer');
    container.innerHTML = '';

    // Filtrar según pestaña y búsqueda
    let filtered = this.leads.filter(lead => {
      // Filtro de estado / temperatura
      if (this.currentFilter === 'hot' && lead.temperature !== 'HOT') return false;
      if (this.currentFilter === 'warm' && lead.temperature !== 'WARM') return false;
      if (this.currentFilter === 'cold' && lead.temperature !== 'COLD') return false;
      if (this.currentFilter === 'pending' && lead.status !== 'NO_CONTACTADO') return false;
      if (this.currentFilter === 'contacted' && lead.status !== 'CONTACTADO') return false;

      // Filtro de búsqueda
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchName = lead.full_name?.toLowerCase().includes(query);
        const matchPhone = lead.phone?.toLowerCase().includes(query);
        const matchCity = lead.company?.toLowerCase().includes(query);
        return matchName || matchPhone || matchCity;
      }

      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center text-slate-400">
          <p class="text-base font-semibold">No se encontraron prospectos con este filtro.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(lead => {
      const isContacted = lead.status === 'CONTACTADO';
      const isHot = lead.temperature === 'HOT';
      const isWarm = lead.temperature === 'WARM';
      const leadValue = this.getLeadValue(lead);

      const tempBadgeClass = isHot ? 'badge-hot' : isWarm ? 'badge-warm' : 'badge-cold';
      const tempLabel = isHot ? '🔥 CALIENTE' : isWarm ? '⚡ TIBIO' : '❄️ FRÍO';

      const waUrl = ScoringEngine.generateSellerWhatsAppUrl(
        lead.phone,
        lead.full_name,
        lead.qualification_answers
      );

      const timeAgo = this.formatDate(lead.created_at);

      const card = document.createElement('div');
      card.className = `p-5 rounded-2xl border transition-all duration-200 ${
        isHot && !isContacted
          ? 'bg-amber-50/40 border-amber-300 shadow-sm'
          : isContacted
          ? 'bg-slate-50/70 border-slate-200 opacity-80'
          : 'bg-white border-slate-200 hover:border-brandNavy/30 shadow-sm'
      }`;

      card.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <!-- Información del Prospecto -->
          <div class="space-y-1.5 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${tempBadgeClass}">
                ${tempLabel} (${lead.score || 0} pts)
              </span>
              <span class="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <i data-lucide="dollar-sign" class="w-3.5 h-3.5 text-emerald-600"></i> $${leadValue.toFixed(2)} USD en juego
              </span>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${isContacted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                ${isContacted ? '✓ Contactado' : '⏳ Pendiente'}
              </span>
              ${lead.privacy_accepted ? '<span class="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">🛡️ LOPDP OK</span>' : ''}
              <span class="text-xs text-slate-400">&bull; ${timeAgo}</span>
            </div>

            <div class="flex items-baseline gap-2 pt-1">
              <h3 class="text-lg font-bold text-brandNavy">${lead.full_name}</h3>
              <span class="text-xs text-slate-500 font-medium">📍 ${lead.company || 'Ecuador'}</span>
            </div>

            <div class="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <div><strong>WhatsApp:</strong> <span class="font-mono text-slate-800">${lead.phone}</span></div>
              <div><strong>Prenda:</strong> <span class="text-brandCoral font-bold">${lead.qualification_answers?.prenda || 'Set Ejecutivo'}</span></div>
              <div><strong>Ocasión:</strong> ${lead.qualification_answers?.ocasion || 'General'}</div>
              <div><strong>Duda:</strong> ${lead.qualification_answers?.duda_principal || 'Talla'}</div>
            </div>
              <div><strong>Ocasión:</strong> ${lead.qualification_answers?.ocasion || 'General'}</div>
              <div><strong>Duda:</strong> ${lead.qualification_answers?.duda_principal || 'Talla'}</div>
            </div>

            <!-- Campo de Notas Rápidas -->
            <div class="pt-2">
              <input type="text" value="${lead.notes || ''}" placeholder="Agregar nota del vendedor (ej. llamarla a las 4pm)..." 
                class="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-brandNavy"
                onchange="AdminCRM.saveNotes('${lead.id}', this.value)" />
            </div>
          </div>

          <!-- Acciones de Venta Inmediatas -->
          <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 lg:pt-0">
            
            <!-- Botón 1-Click WhatsApp -->
            <a href="${waUrl}" target="_blank" 
               class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-sm transition">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
              <span>Abrir WhatsApp</span>
            </a>

            <!-- Botón Toggle Estado -->
            <button onclick="AdminCRM.toggleStatus('${lead.id}')" 
                    class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                      isContacted 
                        ? 'border-slate-300 text-slate-600 hover:bg-slate-100' 
                        : 'border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }">
              ${isContacted ? 'Marcar No Contactado' : 'Marcar Contactado ✓'}
            </button>

          </div>

        </div>
      `;

      container.appendChild(card);
    });
  },

  // Formato de tiempo relativo
  formatDate(isoString) {
    if (!isoString) return 'Reciente';
    try {
      const date = new Date(isoString);
      const diffMinutes = Math.floor((new Date() - date) / 60000);
      if (diffMinutes < 1) return 'Hace un momento';
      if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      return date.toLocaleDateString('es-EC');
    } catch {
      return 'Reciente';
    }
  },

  // Exportar lista a archivo CSV para Excel
  exportToCSV() {
    const headers = ['Nombre', 'WhatsApp', 'Ciudad', 'Score', 'Temperatura', 'Estado', 'Prenda', 'Ocasion', 'Duda', 'Notas', 'Fecha'];
    const rows = this.leads.map(l => [
      `"${l.full_name || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.company || ''}"`,
      l.score || 0,
      `"${l.temperature || ''}"`,
      `"${l.status || ''}"`,
      `"${l.qualification_answers?.prenda || ''}"`,
      `"${l.qualification_answers?.ocasion || ''}"`,
      `"${l.qualification_answers?.duda_principal || ''}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${l.created_at || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_blue_shineshop_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
};
