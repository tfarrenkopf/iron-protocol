import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export type Collection = Tables<'collections'>;
export type CollectionMission = Tables<'collection_missions'>;

export interface CollectionWithMissions extends Collection {
  collection_missions: (CollectionMission & {
    missions: Tables<'missions'>;
  })[];
}

export function useCollections(filters?: {
  showOnlyMine?: boolean;
  showSystem?: boolean;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['collections', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('collections')
        .select(`
          *,
          collection_missions (
            *,
            missions (*)
          )
        `)
        .order('is_system', { ascending: false })
        .order('popularity_score', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;

      let filtered = data as CollectionWithMissions[];

      // Filter for user's own collections
      if (filters?.showOnlyMine && user) {
        filtered = filtered.filter(c => c.created_by === user.id);
      }

      // Filter for system collections only
      if (filters?.showSystem) {
        filtered = filtered.filter(c => c.is_system);
      }

      // Sort collection_missions by order_index
      return filtered.map(collection => ({
        ...collection,
        collection_missions: collection.collection_missions?.sort((a, b) => a.order_index - b.order_index) || []
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCollection(collectionId: string | undefined) {
  return useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      if (!collectionId) return null;

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_missions (
            *,
            missions (
              *,
              mission_exercises (
                *,
                exercises (*)
              )
            )
          )
        `)
        .eq('id', collectionId)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        collection_missions: data.collection_missions?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      } as CollectionWithMissions;
    },
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (collection: {
      name: string;
      code_name: string;
      description?: string;
      cover_image_url?: string;
      visibility?: 'private' | 'public' | 'shared';
      mission_ids?: string[];
    }) => {
      if (!user) throw new Error('Must be logged in to create collections');
      
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .insert({
          name: collection.name,
          code_name: collection.code_name,
          description: collection.description,
          cover_image_url: collection.cover_image_url,
          visibility: collection.visibility || 'private',
          created_by: user.id,
          is_system: false,
        })
        .select()
        .single();
      
      if (collectionError) throw collectionError;

      // Add missions if provided
      if (collection.mission_ids && collection.mission_ids.length > 0) {
        const collectionMissions = collection.mission_ids.map((missionId, index) => ({
          collection_id: collectionData.id,
          mission_id: missionId,
          order_index: index,
        }));

        const { error: missionsError } = await supabase
          .from('collection_missions')
          .insert(collectionMissions);
        
        if (missionsError) throw missionsError;
      }

      return collectionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (collection: {
      id: string;
      name: string;
      code_name: string;
      description?: string;
      cover_image_url?: string;
      visibility?: 'private' | 'public' | 'shared';
      mission_ids?: string[];
    }) => {
      if (!user) throw new Error('Must be logged in to update collections');
      
      const { error: collectionError } = await supabase
        .from('collections')
        .update({
          name: collection.name,
          code_name: collection.code_name,
          description: collection.description,
          cover_image_url: collection.cover_image_url,
          visibility: collection.visibility || 'private',
        })
        .eq('id', collection.id)
        .eq('created_by', user.id);
      
      if (collectionError) throw collectionError;

      // Replace missions if provided
      if (collection.mission_ids !== undefined) {
        // Delete existing
        await supabase
          .from('collection_missions')
          .delete()
          .eq('collection_id', collection.id);

        // Insert new
        if (collection.mission_ids.length > 0) {
          const collectionMissions = collection.mission_ids.map((missionId, index) => ({
            collection_id: collection.id,
            mission_id: missionId,
            order_index: index,
          }));

          const { error: missionsError } = await supabase
            .from('collection_missions')
            .insert(collectionMissions);
          
          if (missionsError) throw missionsError;
        }
      }

      return collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useAddMissionToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, missionId }: { collectionId: string; missionId: string }) => {
      // Get current max order_index
      const { data: existing } = await supabase
        .from('collection_missions')
        .select('order_index')
        .eq('collection_id', collectionId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

      const { error } = await supabase
        .from('collection_missions')
        .insert({
          collection_id: collectionId,
          mission_id: missionId,
          order_index: nextIndex,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
}

export function useRemoveMissionFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, missionId }: { collectionId: string; missionId: string }) => {
      const { error } = await supabase
        .from('collection_missions')
        .delete()
        .eq('collection_id', collectionId)
        .eq('mission_id', missionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
}
