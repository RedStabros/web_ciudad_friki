
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function probe() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
    const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
    const supabase = createClient(url, key);

    const { data, error } = await supabase.from('survey_responses').select('*').limit(1);
    if (error) {
        console.log('Error:', error);
    } else {
        console.log('Columns:', Object.keys(data[0] || {}));
    }

    // Also check if there's an RPC to get counts
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_survey_stats');
    console.log('RPC check:', rpcError ? rpcError.code : 'RPC FOUND');
}

probe();
