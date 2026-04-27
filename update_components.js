import fs from 'fs';

const adminBansPath = './src/pages/admin/AdminBans.tsx';
const adminLayoutPath = './src/components/AdminLayout.tsx';
const historyModalPath = './src/components/admin/UserHistoryModal.tsx';

let adminLayout = fs.readFileSync(adminLayoutPath, 'utf8');
adminLayout = adminLayout.replace(
  "{ path: '/admin/bans', icon: <Gavel size={20} />, label: 'Sanciones' }",
  "{ path: '/admin/bans', icon: <Gavel size={20} />, label: t('admin.sidebar.bans') }"
);
fs.writeFileSync(adminLayoutPath, adminLayout);

let adminBans = fs.readFileSync(adminBansPath, 'utf8');
const banReplacements = [
  ['Control de Sanciones', "{t('adminBans.title')}"],
  ['Gestión de Bans y Shadow Bans', "{t('adminBans.subtitle')}"],
  ['Buscar por username o email...', "{t('adminBans.searchPlaceholder')}"],
  ['Buscar Usuario', "{t('adminBans.searchButton')}"],
  ['Buscando en la base de datos...', "{t('adminBans.loading')}"],
  ['No se encontraron usuarios con ese criterio.', "{t('adminBans.noResults')}"],
  ['>Banned<', ">{t('adminBans.banned')}<"],
  ['>Shadow<', ">{t('adminBans.shadowBanned')}<"],
  ['Ver Historial', "{t('adminBans.viewHistory')}"],
  ['>Fin:<', ">{t('adminBans.banEnd')}:<"],
  ['Sin motivo especificado', "{t('adminBans.noReason')}"],
  ['Retirar Sanción', "{t('adminBans.unbanButton')}"],
  ['Aplicar Sanción', "{t('adminBans.banButton')}"],
  ['Editar Sanción', "{t('adminBans.editBan')}"],
  ['¿Estás seguro de retirar todas las sanciones a este usuario?', "{t('adminBans.confirmUnban')}"],
  ['>Sancionar Usuario<', ">{t('adminBans.modal.title')}<"],
  ['Tipo de Sanción', "{t('adminBans.modal.type')}"],
  ['>Ban Total<', ">{t('adminBans.modal.banTotal')}<"],
  ['>Shadow Ban<', ">{t('adminBans.modal.shadowBan')}<"],
  ['El usuario no podrá acceder a la plataforma mientras el ban esté activo.', "{t('adminBans.modal.descBanTotal')}"],
  ['El usuario podrá ver todo pero no podrá crear hilos, responder ni editar.', "{t('adminBans.modal.descShadowBan')}"],
  ['>Duración<', ">{t('adminBans.modal.duration')}<"],
  ['>24 Horas<', ">{t('adminBans.modal.duration24h')}<"],
  ['>3 Días<', ">{t('adminBans.modal.duration3d')}<"],
  ['>7 Días<', ">{t('adminBans.modal.duration7d')}<"],
  ['>30 Días<', ">{t('adminBans.modal.duration30d')}<"],
  ['>Permanente<', ">{t('adminBans.modal.durationPerm')}<"],
  ['>Motivo Interno<', ">{t('adminBans.modal.reason')}<"],
  ['Explica brevemente la razón de la sanción...', "{t('adminBans.modal.reasonPlaceholder')}"],
  ["'Aplicar Sanción'", "t('adminBans.modal.apply')"],
  ['>Aplicar Sanción<', ">{t('adminBans.modal.apply')}<"]
];

for (const [search, replace] of banReplacements) {
  adminBans = adminBans.split(search).join(replace);
}
fs.writeFileSync(adminBansPath, adminBans);

let historyModal = fs.readFileSync(historyModalPath, 'utf8');

// Insert useTranslation hook and import
if (!historyModal.includes('useTranslation')) {
  historyModal = historyModal.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useTranslation } from 'react-i18next';");
}
if (!historyModal.includes('const { t } = useTranslation();')) {
  historyModal = historyModal.replace('const [loading, setLoading] = useState(true);', 'const { t } = useTranslation();\n    const [loading, setLoading] = useState(true);');
}

const historyReplacements = [
  ['Historial de Moderación', "{t('adminHistory.title')}"],
  ['Reportes Realizados', "{t('adminHistory.tabReports')}"],
  ['Historial de Infracciones', "{t('adminHistory.tabViolations')}"],
  ['Cargando expediente...', "{t('adminHistory.loading')}"],
  ['Este usuario no ha realizado reportes.', "{t('adminHistory.noReports')}"],
  ['Perfil limpio. No hay infracciones registradas.', "{t('adminHistory.noViolations')}"],
  ["target_type === 'thread' ? 'Hilo' : 'Respuesta'", "target_type === 'thread' ? t('adminHistory.typeThread') : t('adminHistory.typeReply')"],
  ["violation.type === 'thread' ? 'Hilo' : 'Respuesta'", "violation.type === 'thread' ? t('adminHistory.typeThread') : t('adminHistory.typeReply')"],
  ['Razón:', "{t('adminHistory.reasonPrefix')}:"],
  ['>ID del objetivo:<', ">{t('adminHistory.targetId')}:<"],
  ['> Reportes<', "> {t('adminHistory.reportsCount')}<"],
  ['Revisado por Admin', "{t('adminHistory.reviewedByAdmin')}"],
  ['Cerrar Expediente', "{t('adminHistory.close')}"],
  ["|| 'Anónimo'", "|| t('adminHistory.anonymous')"],
  ["'Sin motivo explicitado'", "t('adminBans.noReason')"]
];

for (const [search, replace] of historyReplacements) {
  historyModal = historyModal.split(search).join(replace);
}
fs.writeFileSync(historyModalPath, historyModal);

console.log('Components updated with i18n successfully');
