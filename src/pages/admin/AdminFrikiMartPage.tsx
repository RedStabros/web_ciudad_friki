import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Loader2 } from 'lucide-react';
import { AdminFrikiMartContent } from '../../components/AdminFrikiMart';
import { useAuth } from '../../context/AuthContext';
import { SuperAdminService } from '../../services/SuperAdminService';
import { Navigate } from 'react-router-dom';

export default function AdminFrikiMartPage() {
    const { t } = useTranslation();
    const { isSuperuser, isLoading } = useAuth();
    const [storeAdminVisible, setStoreAdminVisible] = useState<boolean | null>(null);

    useEffect(() => {
        SuperAdminService.getGlobalSetting('store_admin_visible').then(val => {
            setStoreAdminVisible(!!val);
        });
    }, []);

    if (isLoading || storeAdminVisible === null) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
        );
    }

    if (!isSuperuser && !storeAdminVisible) {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 border-b border-border-theme pb-4 px-6 pt-2">
                <div className="bg-amber-500/20 text-amber-500 p-3 rounded-xl">
                    <Store size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-text-main leading-tight flex items-center gap-2 uppercase italic tracking-tighter">
                        {t('adminFrikiMart.title')}
                    </h1>
                    <p className="text-sm text-amber-500 font-bold">{t('adminFrikiMart.subtitle')}</p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden mt-4">
                <AdminFrikiMartContent />
            </div>
        </div>
    );
}
