const fs = require('fs');

const esPath = './src/i18n/locales/es.json';
const enPath = './src/i18n/locales/en.json';

const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Admin Sidebar
es.admin = es.admin || {};
es.admin.sidebar = es.admin.sidebar || {};
es.admin.sidebar.bans = "Sanciones";

en.admin = en.admin || {};
en.admin.sidebar = en.admin.sidebar || {};
en.admin.sidebar.bans = "Sanctions";

// Admin Bans
es.adminBans = {
  title: "Control de Sanciones",
  subtitle: "Gestión de Bans y Shadow Bans",
  searchPlaceholder: "Buscar por username o email...",
  searchButton: "Buscar Usuario",
  loading: "Buscando en la base de datos...",
  noResults: "No se encontraron usuarios con ese criterio.",
  banned: "Banned",
  shadowBanned: "Shadow",
  viewHistory: "Ver Historial",
  banEnd: "Fin",
  noReason: "Sin motivo especificado",
  unbanButton: "Retirar Sanción",
  banButton: "Aplicar Sanción",
  editBan: "Editar Sanción",
  confirmUnban: "¿Estás seguro de retirar todas las sanciones a este usuario?",
  modal: {
    title: "Sancionar Usuario",
    type: "Tipo de Sanción",
    banTotal: "Ban Total",
    shadowBan: "Shadow Ban",
    descBanTotal: "El usuario no podrá acceder a la plataforma mientras el ban esté activo.",
    descShadowBan: "El usuario podrá ver todo pero no podrá crear hilos, responder ni editar.",
    duration: "Duración",
    duration24h: "24 Horas",
    duration3d: "3 Días",
    duration7d: "7 Días",
    duration30d: "30 Días",
    durationPerm: "Permanente",
    reason: "Motivo Interno",
    reasonPlaceholder: "Explica brevemente la razón de la sanción...",
    apply: "Aplicar Sanción"
  }
};

en.adminBans = {
  title: "Sanction Control",
  subtitle: "Bans and Shadow Bans Management",
  searchPlaceholder: "Search by username or email...",
  searchButton: "Search User",
  loading: "Searching in database...",
  noResults: "No users found with that criteria.",
  banned: "Banned",
  shadowBanned: "Shadow",
  viewHistory: "View History",
  banEnd: "End",
  noReason: "No reason specified",
  unbanButton: "Remove Sanction",
  banButton: "Apply Sanction",
  editBan: "Edit Sanction",
  confirmUnban: "Are you sure you want to remove all sanctions from this user?",
  modal: {
    title: "Sanction User",
    type: "Sanction Type",
    banTotal: "Total Ban",
    shadowBan: "Shadow Ban",
    descBanTotal: "The user won't be able to access the platform while the ban is active.",
    descShadowBan: "The user will be able to see everything but won't be able to create threads, reply, or edit.",
    duration: "Duration",
    duration24h: "24 Hours",
    duration3d: "3 Days",
    duration7d: "7 Days",
    duration30d: "30 Days",
    durationPerm: "Permanent",
    reason: "Internal Reason",
    reasonPlaceholder: "Briefly explain the reason for the sanction...",
    apply: "Apply Sanction"
  }
};

// Admin History
es.adminHistory = {
  title: "Historial de Moderación",
  tabReports: "Reportes Realizados",
  tabViolations: "Historial de Infracciones",
  loading: "Cargando expediente...",
  noReports: "Este usuario no ha realizado reportes.",
  noViolations: "Perfil limpio. No hay infracciones registradas.",
  typeThread: "Hilo",
  typeReply: "Respuesta",
  reasonPrefix: "Razón",
  targetId: "ID del objetivo",
  reportsCount: "Reportes",
  reviewedByAdmin: "Revisado por Admin",
  close: "Cerrar Expediente",
  anonymous: "Anónimo"
};

en.adminHistory = {
  title: "Moderation History",
  tabReports: "Submitted Reports",
  tabViolations: "Violation History",
  loading: "Loading dossier...",
  noReports: "This user has not submitted any reports.",
  noViolations: "Clean profile. No registered violations.",
  typeThread: "Thread",
  typeReply: "Reply",
  reasonPrefix: "Reason",
  targetId: "Target ID",
  reportsCount: "Reports",
  reviewedByAdmin: "Reviewed by Admin",
  close: "Close Dossier",
  anonymous: "Anonymous"
};

fs.writeFileSync(esPath, JSON.stringify(es, null, 2) + '\n');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
console.log('JSON updated successfully');
