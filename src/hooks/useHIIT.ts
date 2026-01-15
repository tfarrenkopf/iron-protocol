import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type HIITConfig = Tables<'hiit_configs'>;

export function useHIITConfigs() {
  return useQuery({
    queryKey: ['hiit-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hiit_configs')
        .select('*')
        .eq('is_public', true)
        .order('rounds');
      
      if (error) throw error;
      return data as HIITConfig[];
    },
  });
}
