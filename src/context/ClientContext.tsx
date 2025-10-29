'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Client, ClientStatus } from '@/types';
import { supabase } from '@/lib/supabase';

interface SupabaseTeamData {
  id: string;
  name: string;
  access_code: string;
  week_number: number;
  on_time_completed: number;
  on_time_total: number;
  quality_scores: number[];
  status: string;
  current_sprint_number: number;
  current_sprint_name: string;
  sprint_deadline: string;
  next_sprint_number: number;
  next_sprint_name: string;
  next_sprint_release: string;
  start_date: string;
  graduation_date: string;
  days_in_delay: number;
  program_champion: string;
  current_guru: string;
  completed_sprints: number[];
  rank: number;
  country_code: string;
  associate_id: string;
  previous_rank: number;
}

function transformSupabaseToClient(data: SupabaseTeamData): Client {
  return {
    id: data.id,
    name: data.name,
    accessCode: data.access_code,
    weekNumber: data.week_number,
    onTimeDelivery: {
      completed: data.on_time_completed || 0,
      total: data.on_time_total || 0,
    },
    qualityScores: data.quality_scores || [],
    status: data.status as ClientStatus,
    currentSprint: {
      number: data.current_sprint_number,
      name: data.current_sprint_name,
    },
    sprintDeadline: data.sprint_deadline,
    nextSprint: {
      number: data.next_sprint_number,
      name: data.next_sprint_name,
    },
    nextSprintRelease: data.next_sprint_release,
    startDate: data.start_date,
    graduationDate: data.graduation_date,
    daysInDelay: data.days_in_delay,
    programChampion: data.program_champion,
    currentGuru: data.current_guru,
    completedSprints: data.completed_sprints || [],
    sprints: [],
    rank: data.rank,
    totalClients: 0,
    countryCode: data.country_code,
    associateId: data.associate_id,
    previousRank: data.previous_rank,
  };
}

interface ClientContextType {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
  refreshClients: () => Promise<void>;
  selectClient: (clientId: string | null) => void;
  updateClientData: (clientId: string, updates: Record<string, unknown>) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

interface ClientProviderProps {
  children: ReactNode;
  currentGuru: string;
}

export function ClientProvider({ children, currentGuru }: ClientProviderProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshClients = useCallback(async () => {
    if (!currentGuru) {
      console.warn('ClientContext: No currentGuru provided, skipping refresh');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 ClientContext: Refreshing clients for guru:', currentGuru);
      
      const { data, error: fetchError } = await supabase
        .from('teams')
        .select('*')
        .eq('current_guru', currentGuru)
        .order('rank', { ascending: true });
      
      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        console.warn('ClientContext: No data returned from query');
        setClients([]);
        return;
      }

      console.log(`✅ ClientContext: Fetched ${data.length} clients`);
      
      // Transform Supabase data to Client format
      const transformedClients = data.map(transformSupabaseToClient);
      setClients(transformedClients);
      
      // Update selectedClient if it exists in the new data
      if (selectedClient) {
        const updated = transformedClients.find(c => c.id === selectedClient.id);
        if (updated) {
          console.log('🔄 ClientContext: Updated selected client:', updated.name);
          setSelectedClient(updated);
        } else {
          console.log('⚠️ ClientContext: Selected client no longer exists, clearing selection');
          setSelectedClient(null);
        }
      }
    } catch (err) {
      console.error('❌ ClientContext: Failed to refresh clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clients');
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentGuru, selectedClient]);

  const selectClient = useCallback((clientId: string | null) => {
    if (!clientId) {
      console.log('ClientContext: Clearing client selection');
      setSelectedClient(null);
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (client) {
      console.log('ClientContext: Selected client:', client.name);
      setSelectedClient(client);
    } else {
      console.warn('ClientContext: Client not found:', clientId);
      setSelectedClient(null);
    }
  }, [clients]);

  const updateClientData = useCallback(async (clientId: string, updates: Record<string, unknown>) => {
    try {
      console.log('💾 ClientContext: Updating client:', clientId, updates);
      
      const { error: updateError } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', clientId);
      
      if (updateError) {
        throw updateError;
      }

      console.log('✅ ClientContext: Update successful, refreshing clients...');
      await refreshClients();
    } catch (err) {
      console.error('❌ ClientContext: Failed to update client:', err);
      throw err;
    }
  }, [refreshClients]);

  // Initial load
  useEffect(() => {
    if (currentGuru) {
      console.log('ClientContext: Initial load for guru:', currentGuru);
      refreshClients();
    }
  }, [currentGuru, refreshClients]);

  return (
    <ClientContext.Provider value={{
      clients,
      selectedClient,
      isLoading,
      error,
      refreshClients,
      selectClient,
      updateClientData
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within ClientProvider');
  }
  return context;
}


