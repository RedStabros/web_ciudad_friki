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
    }
};
