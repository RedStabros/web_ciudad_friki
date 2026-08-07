const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, '../src/i18n/locales/es.json');
const enPath = path.join(__dirname, '../src/i18n/locales/en.json');

const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newKeysEs = {
  achievements: {
    title: "Vitrina de Logros",
    progress: "Desbloqueados {{unlocked}}/{{total}}",
    locked: "Logro Secreto",
    categories: {
      all: "Todos",
      trivia: "Trivia Clásica",
      vs: "Trivia VS",
      tavern: "La Taberna",
      events: "Eventos",
      economy: "Economía",
      special: "Especiales"
    },
    tiers: {
      bronze: "Bronce",
      silver: "Plata",
      gold: "Oro",
      diamond: "Diamante",
      special: "Especial"
    },
    unlocked_toast: "¡Logro Desbloqueado!",
    streak: {
      label: "Racha de conexión",
      days: "{{days}} días"
    }
  },
  frikimart: {
    ...(esData.frikimart || {}),
    emptyItems: "No hay artículos disponibles en este momento.",
    emptyOrders: "Aún no has realizado pedidos.",
    shippingNotice: "Los envíos corren por cuenta del comprador (por cobrar). También puedes coordinar la entrega en nuestra sede o en eventos con un administrador."
  },
  events: {
    ...(esData.events || {}),
    qrRequest: "¿Solicitar Código QR de recompensa para asistentes?",
    qrApproved: "QR Aprobado",
    qrReward: "🎁 +{{amount}} FC por asistencia",
    qrBanner: "🎁 ¡Este evento entrega {{amount}} Frikicoins por asistencia presencial!",
    viewQr: "Ver / Imprimir Código QR",
    launchEdition: "🔄 Lanzar Nueva Edición",
    edition: "Edición {{number}}"
  }
};

const newKeysEn = {
  achievements: {
    title: "Achievements Showcase",
    progress: "Unlocked {{unlocked}}/{{total}}",
    locked: "Secret Achievement",
    categories: {
      all: "All",
      trivia: "Classic Trivia",
      vs: "Trivia VS",
      tavern: "The Tavern",
      events: "Events",
      economy: "Economy",
      special: "Special"
    },
    tiers: {
      bronze: "Bronze",
      silver: "Silver",
      gold: "Gold",
      diamond: "Diamond",
      special: "Special"
    },
    unlocked_toast: "Achievement Unlocked!",
    streak: {
      label: "Login Streak",
      days: "{{days}} days"
    }
  },
  frikimart: {
    ...(enData.frikimart || {}),
    emptyItems: "No items available at the moment.",
    emptyOrders: "You have not placed any orders yet.",
    shippingNotice: "Shipping is paid by the buyer upon delivery. You can also coordinate pickup at our headquarters or at events with an admin."
  },
  events: {
    ...(enData.events || {}),
    qrRequest: "Request Reward QR Code for attendees?",
    qrApproved: "QR Approved",
    qrReward: "🎁 +{{amount}} FC for attending",
    qrBanner: "🎁 This event gives {{amount}} Frikicoins for physical attendance!",
    viewQr: "View / Print QR Code",
    launchEdition: "🔄 Launch New Edition",
    edition: "Edition {{number}}"
  }
};

Object.assign(esData, newKeysEs);
Object.assign(enData, newKeysEn);

fs.writeFileSync(esPath, JSON.stringify(esData, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');

console.log('i18n files updated successfully.');
