import { supabase } from '../lib/supabase';

export const SystemService = {
    /**
     * Get a global setting value by key
     */
    async getGlobalSetting<T = any>(key: string, defaultValue: T): Promise<T> {
        try {
            const { data, error } = await supabase
                .from('global_settings')
                .select('value')
                .eq('key', key)
                .single();

            if (error) {
                if (error.code !== 'PGRST116') {
                    console.error(`Error fetching global setting ${key}:`, error);
                }
                return defaultValue;
            }

            return (data.value as T) ?? defaultValue;
        } catch (error) {
            console.error(`Unexpected error fetching global setting ${key}:`, error);
            return defaultValue;
        }
    },

    /**
     * Update a global setting
     */
    async updateGlobalSetting(key: string, value: any) {
        try {
            const { error } = await supabase
                .from('global_settings')
                .upsert({ key, value, updated_at: new Date().toISOString() });

            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            console.error(`Error updating global setting ${key}:`, error);
            return { success: false, error };
        }
    }
};
