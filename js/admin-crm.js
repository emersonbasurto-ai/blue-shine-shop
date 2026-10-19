// js/admin-crm.js
// Lógica y Controlador del Panel de Ventas / CRM de BLUE SHINESHOP

const AdminCRM = {
  leads: [],
  currentFilter: 'all',
  searchQuery: '',

  // Inicializar CRM
  async init() {
    this.checkAuth();
    await this.loadLeads();
    this.renderStats();
    this.renderLeads();
  },

  // Validar si el agente está autenticado
  checkAuth() {
    const isAuthed = sessionStorage.getItem('blue_shine_admin_auth') === 'true';
    const authOverlay = document.getElementById('authOverlay');
    const crmContent = document.getElementById('crmContent');

    if (!isAuthed) {
      authOverlay.classList.remove('hidden');
      crmContent.classList.add('hidden');
    } else {
      authOverlay.classList.add('hidden');
      crmContent.classList.remove('hidden');
    }
  },

  // Iniciar sesión
  login(pin) {
    if (pin === CONFIG.ADMIN_PIN) {
      sessionStorage.setItem('blue_shine_admin_auth', 'true');
      this.checkAuth();
      this.loadLeads();
      return true;
    }
    return false;
  },

  // Cerrar sesión
  logout() {
    sessionStorage.removeItem('blue_shine_admin_auth');
    this.checkAuth();
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

  // Renderizar tarjetas de métricas
  renderStats() {
    const total = this.leads.length;
    const hot = this.leads.filter(l => l.temperature === 'HOT').length;
    const pending = this.leads.filter(l => l.status === 'NO_CONTACTADO').length;
    const contacted = this.leads.filter(l => l.status === 'CONTACTADO').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statHot').textContent = hot;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statContacted').textContent = contacted;
  },

  // Renderizar la lista de prospectos filtrada
  renderLeads() {
    const container = document.getElementById('leadsContainer');
    container.innerHTML = '';

    // Filtrar según pestaña y búsqueda
    let filtered = this.leads.filter(lead => {
      // Filtro de estado / temperatura
      if (this.currentFilter === 'hot' && lead.temperature !== 'HOT') return false;
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
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${isContacted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                ${isContacted ? '✓ Contactado' : '⏳ Pendiente'}
              </span>
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
