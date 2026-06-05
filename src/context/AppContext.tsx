import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useGlobalFeatures } from '../hooks/useGlobalFeatures';

interface AppContextType {
    profile: any;
    wallet: any;
    profileLoading: boolean;
    profileError: any;
    refetchProfile: () => void;

    tavern: boolean;
    frikiVs: boolean;
    ttrpg: boolean;
    frikiMartGlobal: boolean;
    frikiMartWeb: boolean;
    frikiMartAdmin: boolean;
    featuresLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    
    const { 
        profile, 
        wallet, 
        isLoading: profileLoading, 
        error: profileError, 
        refetch: refetchProfile 
    } = useProfile(user?.id);

    const { 
        tavern, 
        frikiVs, 
        ttrpg, 
        frikiMartGlobal, 
        frikiMartWeb, 
        frikiMartAdmin, 
        loading: featuresLoading 
    } = useGlobalFeatures(user?.id);

    return (
        <AppContext.Provider value={{
            profile,
            wallet,
            profileLoading,
            profileError,
            refetchProfile,
            tavern,
            frikiVs,
            ttrpg,
            frikiMartGlobal,
            frikiMartWeb,
            frikiMartAdmin,
            featuresLoading
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppContextProvider');
    }
    return context;
}
