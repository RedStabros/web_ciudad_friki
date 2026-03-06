
import { QrCode } from 'lucide-react';

export default function AdminQRs() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-text-main flex items-center gap-2"><QrCode className="text-brand-primary" /> Eventos QR</h1>
            <p className="text-text-muted text-center py-20">Fase 4: Gestión QR en construcción</p>
        </div>
    );
}
