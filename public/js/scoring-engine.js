// js/scoring-engine.js
// Motor de Calificación y Lead Scoring para BLUE SHINESHOP

const ScoringEngine = {
  // Ponderaciones de puntuación estratégica
  WEIGHTS: {
    ocasion: {
      'urgente_semana': { score: 35, label: 'Urgente esta semana (Entrevista/Evento)' },
      'este_mes': { score: 20, label: 'Renovación de closet para este mes' },
      'explorando': { score: 5, label: 'Solo explorando opciones' }
    },
    prenda: {
      'set_completo': { score: 30, label: 'Set Ejecutivo Shine ($69.99)' },
      'solo_blazer': { score: 20, label: 'Solo Blazer Icono ($42.99)' },
      'blusas': { score: 10, label: 'Blusa Satinada / Top ($24.99)' }
    },
    metodo_pago: {
      'transferencia': { score: 25, label: 'Transferencia Banco Pichincha, Guayaquil o DeUna' },
      'tarjeta': { score: 25, label: 'Tarjeta de Crédito o Débito' },
      'contraentrega': { score: 15, label: 'Contraentrega Servientrega' }
    },
    duda_principal: {
      'talla': { score: 10, label: 'Asegurar talla exacta / Calce' },
      'tela': { score: 10, label: 'Calidad de tela / Anti-arrugas' },
      'envio': { score: 10, label: 'Tiempos de entrega desde Manta' }
    }
  },

  // Calcular puntuación y temperatura
  calculate(answers) {
    let score = 0;

    // 1. Puntos por ocasión
    if (this.WEIGHTS.ocasion[answers.ocasion]) {
      score += this.WEIGHTS.ocasion[answers.ocasion].score;
    }

    // 2. Puntos por prenda de interés
    if (this.WEIGHTS.prenda[answers.prenda]) {
      score += this.WEIGHTS.prenda[answers.prenda].score;
    }

    // 3. Puntos por método de pago
    if (this.WEIGHTS.metodo_pago[answers.metodo_pago]) {
      score += this.WEIGHTS.metodo_pago[answers.metodo_pago].score;
    }

    // 4. Puntos por claridad de duda
    if (this.WEIGHTS.duda_principal[answers.duda_principal]) {
      score += this.WEIGHTS.duda_principal[answers.duda_principal].score;
    }

    // Clasificación de temperatura
    let temperature = 'COLD';
    let tempBadge = '❄️ Frío (Seguimiento general)';
    let priorityAction = 'Enviar catálogo por WhatsApp';

    if (score >= 75) {
      temperature = 'HOT';
      tempBadge = '🔥 CALIENTE (Prioridad Máxima)';
      priorityAction = 'Llamar o escribir en menos de 15 minutos';
    } else if (score >= 40) {
      temperature = 'WARM';
      tempBadge = '⚡ TIBIO (Interés Alto)';
      priorityAction = 'Enviar fotos reales y tabla de tallas';
    }

    return {
      score,
      temperature,
      tempBadge,
      priorityAction
    };
  },

  // Generar enlace directo a WhatsApp para que la clienta contacte a la tienda
  generateClientWhatsAppUrl(storePhone, leadName, answers) {
    const cleanPhone = storePhone.replace(/\D/g, '');
    const prendaLabel = this.WEIGHTS.prenda[answers.prenda]?.label || 'Set Ejecutivo';
    const dudaLabel = this.WEIGHTS.duda_principal[answers.duda_principal]?.label || 'mi talla ideal';

    const message = `¡Hola BLUE SHINESHOP! 👋 Soy ${leadName}. Acabo de completar el test en la página. Me interesa el *${prendaLabel}* y quisiera asesoría para *${dudaLabel}* antes de mi envío por Servientrega. ✨`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  },

  // Generar enlace para que el Vendedor contacte a la clienta desde el CRM
  generateSellerWhatsAppUrl(clientPhone, clientName, answers) {
    let cleanPhone = clientPhone.replace(/\D/g, '');
    // Si empieza por 09... convertir a formato internacional Ecuador 5939...
    if (cleanPhone.startsWith('09')) {
      cleanPhone = '593' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('593') && cleanPhone.length === 9) {
      cleanPhone = '593' + cleanPhone;
    }

    const prendaLabel = answers?.prenda ? (this.WEIGHTS.prenda[answers.prenda]?.label || answers.prenda) : 'Set de oficina';
    const dudaLabel = answers?.duda_principal ? (this.WEIGHTS.duda_principal[answers.duda_principal]?.label || '') : '';

    const message = `¡Hola ${clientName}! ✨ Te saluda tu asesora de estilo de *BLUE SHINESHOP* desde Manta. Vi que te gustó nuestro *${prendaLabel}* y querías validar ${dudaLabel}. ¿Te gustaría que te envíe las fotos reales de la tela y te asesore con tu talla antes de coordinar tu despacho por Servientrega? 🇪🇨`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
};
