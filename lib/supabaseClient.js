import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqyzkhzmvdnkknxdmhao.supabase.co';
const supabaseKey = 'sb_publishable_cI8_-aJbJ1A2MabT7eza6Q__Fu83qSY';

export const supabase = createClient(supabaseUrl, supabaseKey);
