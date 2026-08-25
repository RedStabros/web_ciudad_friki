import { SEO } from '../components/SEO';

import { Shield, Map, Gamepad2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-500">
            <SEO 
                title="Acerca de Ciudad Friki"
                description="Descubre qué es Ciudad Friki: la plataforma interactiva y red social para la comunidad geek."
            />

            <header className="text-center mb-16 mt-8">
                <h1 className="text-5xl md:text-7xl font-black text-brand-primary uppercase italic tracking-tighter mb-6">
                    ¿Qué es Ciudad Friki?
                </h1>
                <p className="text-xl text-text-sub max-w-2xl mx-auto font-medium leading-relaxed">
                    Ciudad Friki es la red social y mapa interactivo definitivo para la comunidad geek, friki, otaku y gamer. 
                    Nuestra plataforma te permite descubrir eventos locales, conectar con otros apasionados, jugar trivias y explorar el mapa interactivo de tu ciudad.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Link to="/login" className="btn-primary text-lg px-8 py-3 bg-brand-primary text-bg-main rounded-full font-bold hover:opacity-90">
                        Unirse a la Comunidad
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div className="bg-bg-side p-8 rounded-3xl border border-divider-theme shadow-xl relative overflow-hidden group hover:border-brand-primary transition-colors">
                    <Map className="w-12 h-12 text-brand-primary mb-4" />
                    <h2 className="text-2xl font-black text-text-main uppercase mb-2">Mapa Interactivo</h2>
                    <p className="text-text-sub font-medium">Encuentra los mejores eventos, convenciones, tiendas aliadas y torneos en tu área local mediante nuestro mapa con tecnología de punta.</p>
                </div>
                
                <div className="bg-bg-side p-8 rounded-3xl border border-divider-theme shadow-xl relative overflow-hidden group hover:border-brand-primary transition-colors">
                    <Gamepad2 className="w-12 h-12 text-brand-primary mb-4" />
                    <h2 className="text-2xl font-black text-text-main uppercase mb-2">Gamificación Integrada</h2>
                    <p className="text-text-sub font-medium">Participa en trivias, duelos de conocimiento (Friki VS) y obtén logros exclusivos. Gana Frikicoins virtuales para posicionarte en la tabla de líderes.</p>
                </div>

                <div className="bg-bg-side p-8 rounded-3xl border border-divider-theme shadow-xl relative overflow-hidden group hover:border-brand-primary transition-colors">
                    <Users className="w-12 h-12 text-brand-primary mb-4" />
                    <h2 className="text-2xl font-black text-text-main uppercase mb-2">La Taberna</h2>
                    <p className="text-text-sub font-medium">Nuestro foro comunitario donde puedes discutir de anime, videojuegos, rol y películas con otros usuarios en un ambiente seguro y moderado.</p>
                </div>

                <div className="bg-bg-side p-8 rounded-3xl border border-divider-theme shadow-xl relative overflow-hidden group hover:border-brand-primary transition-colors">
                    <Shield className="w-12 h-12 text-brand-primary mb-4" />
                    <h2 className="text-2xl font-black text-text-main uppercase mb-2">Seguridad y Privacidad</h2>
                    <p className="text-text-sub font-medium">Nos tomamos muy en serio tus datos. No almacenamos tu ubicación en tiempo real y contamos con estrictas políticas de moderación para proteger a los usuarios.</p>
                </div>
            </div>
            
            <div className="text-center mt-12 pb-8 border-t border-divider-theme pt-8">
                <p className="text-text-muted text-sm font-bold uppercase tracking-widest">Corporación Ciudad Friki © {new Date().getFullYear()}</p>
                <div className="flex justify-center gap-4 mt-4">
                    <Link to="/legal/privacy" className="text-brand-primary hover:underline text-sm font-medium">Política de Privacidad</Link>
                    <Link to="/legal/terms" className="text-brand-primary hover:underline text-sm font-medium">Términos del Servicio</Link>
                </div>
            </div>
        </div>
    );
}
