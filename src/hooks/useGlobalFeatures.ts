import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isSuperuser } from '../utils/superuser';

export function useGlobalFeatures(userId?: string) {
    const [features, setFeatures] = useState({
        tavern: true,
        frikiVs: true,
        ttrpg: true,
        frikiMartGlobal: true,
        frikiMartWeb: true,
        frikiMartAdmin: true,
        loading: true,
    });

    useEffect(() => {
        const loadFeatures = async () => {
            try {
                const { data, error } = await supabase
                    .from('global_settings')
                    .select('key, value')
                    .in('key', ['tavern_enabled', 'trivia_vs_enabled', 'store_enabled', 'store_web_enabled', 'store_admin_visible', 'ttrpg_enabled']);

                if (error) throw error;

                const map: Record<string, any> = {};
                data?.forEach((r) => { map[r.key] = r.value; });

                const super_user = isSuperuser(userId);

                // For normal users, we parse the DB values. If DB missing, fallback to true usually, or false for web store.
                // For superuser, all features are forcefully ENABLED so they can test/moderate.
                setFeatures({
                    tavern: super_user || (map['tavern_enabled'] !== false),
                    frikiVs: super_user || (map['trivia_vs_enabled'] !== false),
                    ttrpg: super_user || (map['ttrpg_enabled'] !== false),
                    frikiMartGlobal: super_user || (map['store_enabled'] !== false),
                    frikiMartWeb: super_user || (map['store_web_enabled'] ?? false),
                    frikiMartAdmin: super_user || (map['store_admin_visible'] !== false),
                    loading: false,
                });
            } catch (e) {
                console.error("Error loading global features", e);
                setFeatures(prev => ({ ...prev, loading: false }));
            }
        };

        loadFeatures();

        const sub = supabase.channel('global_features_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'global_settings' }, () => {
                loadFeatures();
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [userId]);

    return features;
}
