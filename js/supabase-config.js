// js/supabase-config.js
// Manejo de conexión con Supabase con fallback local resiliente

// Variables por defecto (conectado a Supabase Cloud con fallback local resiliente)
const CONFIG = {
  SUPABASE_URL: window.ENV_SUPABASE_URL || localStorage.getItem('BLUE_SHINE_SUPABASE_URL') || 'https://dcatufozlsymqgeznvpk.supabase.co',
  SUPABASE_ANON_KEY: window.ENV_SUPABASE_ANON_KEY || localStorage.getItem('BLUE_SHINE_SUPABASE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjYXR1Zm96bHN5bXFnZXpudnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjI5MjksImV4cCI6MjEwODA5ODkyOX0.7_QSFm3ronOa54oXx2SS35qijXgz8b9HSRu3MmWj1L4',
  ADMIN_PIN: 'blueshine2026' // PIN de acceso rápido para demostración / agente de ventas
};

let supabaseClient = null;

// Inicializar cliente si hay credenciales disponibles
if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    console.log('[BLUE SHINE] Conectado exitosamente con Supabase Cloud.');
  } catch (err) {
    console.warn('[BLUE SHINE] Error al inicializar Supabase, usando almacenamiento local:', err);
  }
}

// Repositorio de Prospectos (Abstracción unificada)
const LeadsDB = {
  // Guardar nuevo prospecto
  async insertLead(leadData) {
    // Si Supabase está conectado, guardar en la nube
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('leads')
          .insert([leadData])
          .select();

        if (error) throw error;
        console.log('[Supabase Cloud] Prospecto guardado:', data);
        return { success: true, data: data[0], source: 'supabase' };
      } catch (err) {
        console.warn('[Supabase] Falló guardado remoto, respaldando en local:', err.message);
      }
    }

    // Fallback: Guardar en localStorage local
    const leads = this.getLocalLeads();
    const newLead = {
      id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contacted_at: null,
      status: 'NO_CONTACTADO',
      notes: '',
      ...leadData
    };
    leads.unshift(newLead);
    localStorage.setItem('blue_shine_leads', JSON.stringify(leads));
    console.log('[Local Storage] Prospecto guardado localmente:', newLead);
    return { success: true, data: newLead, source: 'local' };
  },

  // Obtener todos los prospectos ordenados por prioridad (HOT primero)
  async getLeads() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('leads')
          .select('*')
          .order('score', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('[Supabase] Error al leer de la nube, cargando locales:', err);
      }
    }

    // Retornar locales ordenados por score descendente
    const leads = this.getLocalLeads();
    return leads.sort((a, b) => (b.score || 0) - (a.score || 0));
  },

  // Actualizar estado o notas de un prospecto
  async updateLead(id, updates) {
    if (supabaseClient && !id.startsWith('local_')) {
      try {
        const { data, error } = await supabaseClient
          .from('leads')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
            ...(updates.status === 'CONTACTADO' ? { contacted_at: new Date().toISOString() } : {})
          })
          .eq('id', id)
          .select();

        if (!error) return { success: true, data };
      } catch (err) {
        console.warn('[Supabase] Error al actualizar remoto:', err);
      }
    }

    // Actualizar en localStorage
    const leads = this.getLocalLeads();
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index] = {
        ...leads[index],
        ...updates,
        updated_at: new Date().toISOString(),
        ...(updates.status === 'CONTACTADO' && !leads[index].contacted_at ? { contacted_at: new Date().toISOString() } : {})
      };
      localStorage.setItem('blue_shine_leads', JSON.stringify(leads));
      return { success: true, data: leads[index] };
    }
    return { success: false, error: 'Prospecto no encontrado' };
  },

  // Obtener prospectos de almacenamiento local
  getLocalLeads() {
    try {
      const stored = localStorage.getItem('blue_shine_leads');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Sembrar prospectos de demostración si está vacío
  seedDemoLeadsIfEmpty() {
    const current = this.getLocalLeads();
    if (current.length === 0) {
      const demoLeads = [
        {
          id: 'demo_1',
          full_name: 'Camila Villavicencio',
          phone: '0991234567',
          email: 'camila.v@gmail.com',
          company: 'Samborondón, Guayas',
          score: 95,
          temperature: 'HOT',
          status: 'NO_CONTACTADO',
          qualification_answers: {
            ocasion: 'Entrevista de trabajo este viernes',
            prenda: 'Set Completo ($69.99)',
            metodo_pago: 'Transferencia Banco Pichincha / DeUna',
            duda_principal: 'Asegurar talla exacta de caderas'
          },
          notes: 'Interesada en color Azul Petróleo talla M. Enviar fotos.',
          created_at: new Date(Date.now() - 25 * 60000).toISOString()
        },
        {
          id: 'demo_2',
          full_name: 'Dra. Gabriela Mendoza',
          phone: '0987654321',
          email: 'gmendoza@clinica.ec',
          company: 'Quito, Cumbayá',
          score: 85,
          temperature: 'HOT',
          status: 'NO_CONTACTADO',
          qualification_answers: {
            ocasion: 'Outfit profesional para congreso médico',
            prenda: 'Set Completo ($69.99) + Top',
            metodo_pago: 'Tarjeta de Crédito',
            duda_principal: 'Tiempos de envío por Servientrega'
          },
          notes: 'Busca 2 sets si le queda el primero.',
          created_at: new Date(Date.now() - 70 * 60000).toISOString()
        },
        {
          id: 'demo_3',
          full_name: 'Andrea Saltos',
          phone: '0961122334',
          email: 'andrea.s@hotmail.com',
          company: 'Cuenca, Azuay',
          score: 55,
          temperature: 'WARM',
          status: 'NO_CONTACTADO',
          qualification_answers: {
            ocasion: 'Renovación de closet para fin de mes',
            prenda: 'Solo Blazer Icono ($42.99)',
            metodo_pago: 'Contraentrega Servientrega',
            duda_principal: 'Calidad de la tela anti-arrugas'
          },
          notes: '',
          created_at: new Date(Date.now() - 180 * 60000).toISOString()
        }
      ];
      localStorage.setItem('blue_shine_leads', JSON.stringify(demoLeads));
      console.log('[BLUE SHINE] Prospectos demo cargados en el CRM.');
    }
  }
};

// Cargar demos si está vacío para pruebas del usuario
LeadsDB.seedDemoLeadsIfEmpty();
