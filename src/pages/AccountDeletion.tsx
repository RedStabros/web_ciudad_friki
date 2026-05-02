import { useTranslation } from 'react-i18next';
import { Mail, ShieldAlert, Trash2 } from 'lucide-react';

export default function AccountDeletion() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <div className="bg-bg-side rounded-3xl p-8 border border-border-theme shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-accent-red/10 p-4 rounded-2xl">
            <Trash2 className="w-8 h-8 text-accent-red" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text-main">
              {t('legal.accountDeletion', 'Eliminación de Cuenta')}
            </h1>
            <p className="text-text-sub font-medium mt-1">
              {t('legal.accountDeletionSubtitle', 'Cómo solicitar la eliminación de tus datos personales')}
            </p>
          </div>
        </div>

        <div className="space-y-8 text-text-main">
          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-primary" />
              {t('legal.deletionRights', 'Tus Derechos')}
            </h2>
            <p className="leading-relaxed">
              {t('legal.deletionRightsText', 'En cumplimiento con las normas de privacidad internacionales y las políticas de las tiendas de aplicaciones, como usuario de Ciudad Friki tienes el derecho a solicitar la eliminación permanente de tu cuenta y de todos los datos personales asociados a la misma.')}
            </p>
          </section>

          <section className="bg-bg-sub p-6 rounded-2xl border border-border-theme">
            <h2 className="text-xl font-bold mb-4">{t('legal.howToDelete', '¿Cómo eliminar tu cuenta?')}</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-brand-primary mb-2">Opción 1: Desde la aplicación móvil</h3>
                <ol className="list-decimal pl-5 space-y-2 text-text-sub">
                  <li>Abre la aplicación Ciudad Friki e inicia sesión.</li>
                  <li>Dirígete a tu Perfil.</li>
                  <li>Selecciona la opción "Configuración" o "Editar Perfil".</li>
                  <li>Busca y selecciona "Eliminar Cuenta".</li>
                  <li>Confirma la acción siguiendo los pasos en pantalla.</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-brand-primary mb-2">Opción 2: Solicitud por correo electrónico</h3>
                <p className="text-text-sub mb-3">Si no tienes acceso a la aplicación, puedes solicitar la eliminación enviándonos un correo electrónico con la dirección asociada a tu cuenta.</p>
                <div className="flex items-center gap-3 bg-bg-main p-4 rounded-xl border border-divider-theme">
                  <Mail className="w-5 h-5 text-text-muted" />
                  <a href="mailto:udcarkangel@gmail.com" className="font-bold hover:text-brand-primary transition-colors">
                    udcarkangel@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-accent-red">{t('legal.whatHappens', '¿Qué sucede al eliminar tu cuenta?')}</h2>
            <ul className="list-disc pl-5 space-y-2 text-text-sub">
              <li>Tu perfil público será eliminado.</li>
              <li>Tu saldo de Frikicoins y progreso en juegos se perderán permanentemente.</li>
              <li>Tus interacciones en La Taberna podrían anonimizarse o eliminarse según las políticas de moderación y retención de datos.</li>
              <li>Este proceso puede tardar hasta 30 días en completarse en nuestras bases de datos de respaldo.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
