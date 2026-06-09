import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------------------------------------------------------------------------
// Removables QCLog helpers
// ---------------------------------------------------------------------------
export const QCLog = {
  async list(orderBy = '-created_date', limit = 500) {
    const desc = orderBy.startsWith('-');
    const column = orderBy.replace(/^-/, '');
    const { data, error } = await supabase
      .from('rem_qc_logs')
      .select('*')
      .eq('is_sample', false)
      .order(column, { ascending: !desc })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('rem_qc_logs')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  subscribe(callback) {
    const channel = supabase
      .channel('rem_qc_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rem_qc_logs' }, callback)
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};
