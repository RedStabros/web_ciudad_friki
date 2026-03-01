import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface MaintenanceGuardProps {
    children: React.ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
    const { maintenanceMode, isSuperuser, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg-main flex items-center justify-center transition-colors duration-300">
                <Loader2 className="animate-spin text-brand-primary" size={48} />
            </div>
        );
    }

    // Explicitly allow access to the maintenance page even if maintenance mode is ON
    if (location.pathname === '/maintenance') {
        return <>{children}</>;
    }

    // Allow access to login page during maintenance (so superuser can log in)
    if (location.pathname === '/login') {
        return <>{children}</>;
    }

    // If maintenance mode is active and user is not superuser, redirect to maintenance page
    if (maintenanceMode && !isSuperuser) {
        return <Navigate to="/maintenance" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
