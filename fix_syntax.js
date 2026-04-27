import fs from 'fs';
const adminBansPath = './src/pages/admin/AdminBans.tsx';

let adminBans = fs.readFileSync(adminBansPath, 'utf8');

const replacements = [
  ["if (!window.confirm('{t(\\'adminBans.confirmUnban\\')}')) return;", "if (!window.confirm(t('adminBans.confirmUnban'))) return;"],
  ['placeholder="{t(\\\'adminBans.searchPlaceholder\\\')}"', "placeholder={t('adminBans.searchPlaceholder')}"],
  ["'{t(\\'adminBans.searchButton\\')}'", "{t('adminBans.searchButton')}"],
  ['title="{t(\\\'adminBans.viewHistory\\\')}"', "title={t('adminBans.viewHistory')}"],
  ["{u.ban_reason || '{t(\\'adminBans.noReason\\')}' }", "{u.ban_reason || t('adminBans.noReason')}"],
  ['title="{t(\\\'adminBans.editBan\\\')}"', "title={t('adminBans.editBan')}"],
  ['"{t(\\\'adminBans.modal.descShadowBan\\\')}"', "t('adminBans.modal.descShadowBan')"],
  ['"{t(\\\'adminBans.modal.descBanTotal\\\')}"', "t('adminBans.modal.descBanTotal')"],
  ['placeholder="{t(\\\'adminBans.modal.reasonPlaceholder\\\')}"', "placeholder={t('adminBans.modal.reasonPlaceholder')}"],
  ["'{t(\\'adminBans.banButton\\')}'", "{t('adminBans.banButton')}"]
];

for (const [search, replace] of replacements) {
  adminBans = adminBans.split(search).join(replace);
}

fs.writeFileSync(adminBansPath, adminBans);
console.log('Fixed syntax errors in AdminBans');
