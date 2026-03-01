import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SystemService } from '../services/SystemService';

const SUPERUSER_ID = import.meta.env.VITE_SUPERUSER_ID;

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    isSuperuser: boolean;
    maintenanceMode: boolean;
    signOut: () => Promise<void>;
    checkMaintenance: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    isSuperuser: false,
    maintenanceMode: false,
    signOut: async () => { },
    checkMaintenance: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    const isSuperuser = user?.id === SUPERUSER_ID;

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            await checkMaintenance();
            setIsLoading(false);
        });

        // 2. Listen for changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkMaintenance = async () => {
        const mode = await SystemService.getGlobalSetting('maintenance_mode', false);
        setMaintenanceMode(mode === true || mode === 'true');
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, isLoading, isSuperuser, maintenanceMode, signOut, checkMaintenance }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
