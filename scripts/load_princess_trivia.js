import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env from Ciudad_friki backend manually to avoid external dependency issues
const backendEnvPath = 'd:/APP_development/Ciudad_friki/backend/.env';
if (!fs.existsSync(backendEnvPath)) {
    console.error('Error: Backend env file not found at:', backendEnvPath);
    process.exit(1);
}

const envContent = fs.readFileSync(backendEnvPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let val = match[2] || '';
        // Remove surrounding quotes if any
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
            val = val.slice(1, -1);
        }
        env[match[1]] = val.trim();
    }
});

const supabaseUrl = env['SUPABASE_URL'];
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceKey) {
    console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in backend env.');
    process.exit(1);
}

console.log(`Connecting to Supabase at: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

async function run() {
    try {
        console.log('Step 1: Checking/Inserting category "princesas" in triviaduels_categories...');
        const { data: cat, error: catError } = await supabase
            .from('triviaduels_categories')
            .select('*')
            .eq('id', 'princesas')
            .maybeSingle();

        if (catError) throw catError;

        if (!cat) {
            console.log('Category "princesas" not found. Inserting category...');
            const { error: insertCatError } = await supabase
                .from('triviaduels_categories')
                .insert({
                    id: 'princesas',
                    name: 'Princesas',
                    icon: 'icon_princess',
                    is_active: true
                });
            if (insertCatError) throw insertCatError;
            console.log('Category "princesas" inserted successfully!');
        } else {
            console.log('Category "princesas" already exists:', cat);
            // Update it just in case icon/name was different
            const { error: updateCatError } = await supabase
                .from('triviaduels_categories')
                .update({
                    name: 'Princesas',
                    icon: 'icon_princess',
                    is_active: true
                })
                .eq('id', 'princesas');
            if (updateCatError) throw updateCatError;
            console.log('Category updated to ensure active state and correct icon.');
        }

        console.log('\nStep 2: Loading questions from princesas.json...');
        const jsonPath = 'D:/APP_development/Assest varios/json/princesas.json';
        if (!fs.existsSync(jsonPath)) {
            throw new Error(`JSON file not found at: ${jsonPath}`);
        }

        let rawData = fs.readFileSync(jsonPath, 'utf8');
        let questions;
        try {
            questions = JSON.parse(rawData);
        } catch (parseError) {
            console.warn('JSON parsing failed due to syntax error. Attempting to repair in-memory...');
            const lastValidIndex = rawData.lastIndexOf('  },');
            if (lastValidIndex !== -1) {
                // Keep everything up to the closing brace "  }" and discard the trailing comma ","
                rawData = rawData.substring(0, lastValidIndex + 3) + '\n]';
                questions = JSON.parse(rawData);
                console.log('Successfully repaired JSON in-memory! Ignored the last incomplete question.');
            } else {
                throw parseError;
            }
        }
        
        console.log(`Total questions to import: ${questions.length}`);

        console.log('\nStep 3: Cleaning existing questions for category "princesas" to avoid duplicates...');
        const { error: deleteError } = await supabase
            .from('triviaduels_questions')
            .delete()
            .eq('category_id', 'princesas');
        if (deleteError) throw deleteError;
        console.log('Cleaned existing questions.');

        console.log('\nStep 4: Inserting new questions in batches...');
        const batchSize = 100;
        let insertedCount = 0;

        for (let i = 0; i < questions.length; i += batchSize) {
            const batch = questions.slice(i, i + batchSize).map(q => ({
                category_id: q.category_id || 'princesas',
                question_text: q.question_text,
                options: q.options,
                difficulty: q.difficulty || 1
            }));

            const { data, error } = await supabase
                .from('triviaduels_questions')
                .insert(batch)
                .select('id');

            if (error) {
                console.error(`Error inserting batch starting at index ${i}:`, error);
                throw error;
            }

            insertedCount += data.length;
            console.log(`Progress: Injected ${insertedCount}/${questions.length} questions.`);
        }

        console.log(`\n🎉 Injected successfully! Total inserted: ${insertedCount} questions.`);

        console.log('\nVerifying database category breakdown:');
        const { data: counts, error: countError } = await supabase
            .from('triviaduels_categories')
            .select(`
                id,
                name,
                triviaduels_questions (count)
            `);
        
        if (countError) throw countError;
        console.log(JSON.stringify(counts, null, 2));

    } catch (e) {
        console.error('❌ Data loading failed:', e);
        process.exit(1);
    }
}

run();
