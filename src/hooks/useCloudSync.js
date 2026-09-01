import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useCloudSync({ user, settings, setSettings, stats, setStats, balance, setBalance }) {
  const [status, setStatus] = useState('idle'); const hydrated = useRef(false); const timer = useRef();
  useEffect(() => {
    hydrated.current = false;
    if (!user || !supabase) return;
    (async () => {
      setStatus('syncing');
      const { data, error } = await supabase.from('player_progress').select('*').eq('user_id', user.id).maybeSingle();
      if (!error && data) { if (data.settings) setSettings(current=>({...current,...data.settings})); if (data.stats) setStats(current=>({...current,...data.stats})); if (Number.isFinite(Number(data.training_balance))) setBalance(Number(data.training_balance)); }
      else if (!error) await supabase.from('player_progress').insert({ user_id:user.id, settings, stats, training_balance:balance });
      hydrated.current = true; setStatus(error?'error':'synced');
    })();
  }, [user?.id]);
  useEffect(() => {
    if (!user || !supabase || !hydrated.current) return;
    clearTimeout(timer.current); setStatus('syncing');
    timer.current=setTimeout(async()=>{const { error }=await supabase.from('player_progress').upsert({user_id:user.id,settings,stats,training_balance:balance,updated_at:new Date().toISOString()},{onConflict:'user_id'});setStatus(error?'error':'synced')},700);
    return()=>clearTimeout(timer.current);
  }, [user?.id, settings, stats, balance]);
  return status;
}
