import { useTranslation } from 'react-i18next';
import { HelpCircle, Mail, MessageCircleQuestion } from 'lucide-react';

export default function Support() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <div className="bg-bg-side rounded-3xl p-8 border border-border-theme shadow-xl mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-brand-primary/10 p-4 rounded-2xl">
            <HelpCircle className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text-main">
              {t('support.title', 'Centro de Soporte')}
            </h1>
            <p className="text-text-sub font-medium mt-1">
              {t('support.subtitle', '¿Necesitas ayuda con Ciudad Friki? Estamos aquí para ti.')}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-bg-sub p-6 rounded-2xl border border-border-theme hover:border-brand-primary transition-colors">
            <Mail className="w-8 h-8 text-text-main mb-4" />
            <h2 className="text-xl font-bold text-text-main mb-2">{t('support.contactEmail', 'Contacto por Correo')}</h2>
            <p className="text-text-sub mb-4">
              Para reportar bugs, problemas con tu cuenta o consultas comerciales, escríbenos directamente.
            </p>
            <a href="mailto:udcarkangel@gmail.com" className="inline-flex items-center gap-2 font-bold text-brand-primary hover:text-brand-primary-light">
              udcarkangel@gmail.com
            </a>
          </div>

          <div className="bg-bg-sub p-6 rounded-2xl border border-border-theme hover:border-brand-secondary transition-colors">
            <MessageCircleQuestion className="w-8 h-8 text-text-main mb-4" />
            <h2 className="text-xl font-bold text-text-main mb-2">{t('support.community', 'Ayuda Comunitaria')}</h2>
            <p className="text-text-sub mb-4">
              Puedes preguntar tus dudas en "La Taberna" de la aplicación. Nuestra comunidad de moderadores y otros frikis te ayudarán rápidamente.
            </p>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="bg-bg-side rounded-3xl p-8 border border-border-theme shadow-xl">
        <h2 className="text-2xl font-black text-text-main mb-6">{t('support.faq', 'Preguntas Frecuentes (FAQ)')}</h2>
        <div className="space-y-4 text-text-sub">
          <details className="group bg-bg-sub rounded-xl border border-divider-theme p-4 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-text-main">
              ¿Para qué sirven las Frikicoins?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="mt-4 leading-relaxed">
              Las Frikicoins son puntos de fidelidad virtuales (sin valor monetario real) que puedes ganar jugando a las trivias. Te permitirán desbloquear elementos en el futuro y presumir tu nivel de conocimiento geek en la comunidad.
            </p>
          </details>
          <details className="group bg-bg-sub rounded-xl border border-divider-theme p-4 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-text-main">
              ¿Por qué no puedo ver todos los Eventos?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="mt-4 leading-relaxed">
              Los eventos están organizados por categorías y fechas. Si no encuentras uno, puede que ya haya finalizado o no estés en la ciudad correcta, aunque la mayoría de los eventos son de acceso nacional/internacional si son virtuales.
            </p>
          </details>
          <details className="group bg-bg-sub rounded-xl border border-divider-theme p-4 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-text-main">
              Fui baneado de La Taberna, ¿qué hago?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="mt-4 leading-relaxed">
              Si fuiste sancionado (Shadow Ban o Suspensión), puedes enviar un correo a udcarkangel@gmail.com para solicitar una revisión del caso en un plazo de 7 días hábiles tras la sanción.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
