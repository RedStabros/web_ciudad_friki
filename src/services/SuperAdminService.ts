import { supabase } from '../lib/supabase';

export const SuperAdminService = {
    async getGlobalSetting(key: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('global_settings')
            .select('*')
            .eq('key', key)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data?.value ?? true;
    },

    async getGlobalSettings(keys: string[]): Promise<Record<string, boolean>> {
        const { data, error } = await supabase
            .from('global_settings')
            .select('key, value')
            .in('key', keys);

        if (error) throw error;

        const settings: Record<string, boolean> = {};
        keys.forEach(k => {
            const found = data?.find(d => d.key === k);
            settings[k] = found ? found.value : true;
        });
        return settings;
    },

    async toggleGlobalSetting(key: string, enabled: boolean): Promise<{ error?: any }> {
        try {
            const { error } = await supabase
                .from('global_settings')
                .upsert({ key, value: enabled });
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async getFrikiMartMetrics() {
        try {
            const { data, error } = await supabase.rpc('get_frikimart_metrics');
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    async createGlobalBroadcast(title: string, message: string) {
        try {
            const { data, error } = await supabase
                .from('global_broadcasts')
                .insert([{ title, message }])
                .select()
                .single();
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating global broadcast:', error);
            return { data: null, error };
        }
    },

    async getAdminStats() {
        try {
            const { data, error } = await supabase.rpc('get_admin_stats');
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('getAdminStats error:', error);
            return { data: null, error };
        }
    }
};
