'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Client, ClientStatus } from '@/types';
import ExecutiveSummary from '@/components/client/ExecutiveSummary';
import ClientDetailModal from '@/components/client/ClientDetailModal';

// Helper function to get full country name
function getCountryName(countryCode: string): string {
  const countries: { [key: string]: string } = {
    'MU': 'Mauritius',
    'LV': 'Latvia',
    'KE': 'Kenya',
    'GT': 'Guatemala',
    'IT': 'Italy',
    'EE': 'Estonia',
    'LK': 'Sri Lanka',
    'PL': 'Poland',
    'MX': 'Mexico',
    'AT': 'Austria',
  };
  return countries[countryCode] || countryCode;
}

// Helper function to get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'ON_TIME':
      return 'bg-green-500';
    case 'DELAYED':
      return 'bg-red-500';
    case 'PROGRESS_MEETING':
    case 'GRADUATED':
    case 'STARTING_SOON':
    default:
      return 'bg-gray-400';
  }
}

// Interface for Supabase team data
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

// Transform Supabase data to Client interface
function transformSupabaseToClient(data: SupabaseTeamData): Client {
  return {
    id: data.id,
    name: data.name,
    accessCode: data.access_code,
    weekNumber: data.week_number,
    onTimeDelivery: {
      completed: data.on_time_completed,
      total: data.on_time_total,
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
    sprints: [], // Will be populated separately if needed
    rank: data.rank,
    totalClients: 0, // Will be set from all clients count
    countryCode: data.country_code,
    associateId: data.associate_id,
    previousRank: data.previous_rank,
  };
}

export default function ClientDashboard() {
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ssdbInsights, setSsdbInsights] = useState<{start_insight: string; stop_insight: string; do_better_insight: string} | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const accessCode = searchParams.get('code');

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current client by access code
      const { data: clientData, error: clientError } = await supabase
        .from('teams')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (clientError || !clientData) {
        setError('Client not found. Please check your access code.');
        return;
      }

      // Fetch all clients for leaderboard
      const { data: allClientsData, error: allClientsError } = await supabase
        .from('teams')
        .select('*')
        .order('rank', { ascending: true });

      if (allClientsError) {
        setError('Failed to load leaderboard data.');
        return;
      }

      // Transform data
      const transformedClient = transformSupabaseToClient(clientData);
      const transformedAllClients = allClientsData.map(transformSupabaseToClient);

      // Set total clients count
      transformedClient.totalClients = transformedAllClients.length;
      transformedAllClients.forEach(client => {
        client.totalClients = transformedAllClients.length;
      });

      setCurrentClient(transformedClient);
      setAllClients(transformedAllClients);

      // Fetch SSDB insights for the current client
      const { data: ssdbData, error: ssdbError } = await supabase
        .from('ssdb_insights')
        .select('*')
        .eq('team_id', clientData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!ssdbError && ssdbData) {
        setSsdbInsights(ssdbData);
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
      setError('An error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  }, [accessCode]);

  useEffect(() => {
    if (!accessCode) {
      router.push('/');
      return;
    }

    fetchClientData();
  }, [accessCode, router, fetchClientData]);

  const calculateOnTimePercentage = (completed: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const calculateQualityAverage = (scores: number[]): number => {
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl font-body">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4 font-body">{error}</div>
          <button 
            onClick={() => router.push('/')}
            className="bg-white text-black px-6 py-2 rounded hover:bg-gray-200 font-heading"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (!currentClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl font-body">No client data found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-black z-50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-white font-heading text-2xl">Fast Track Leaderboard</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')} 
              className="bg-white text-black px-6 py-2 rounded font-heading hover:bg-gray-200 transition"
            >
              EXIT
            </button>
            <Image src="/logo.png" alt="Fast Track" width={32} height={32} className="h-8 w-auto ml-4" />
          </div>
        </div>
      </header>

      {/* Main Content with padding for fixed header */}
      <div className="pt-24">
        {/* Executive Summary */}
        <ExecutiveSummary client={currentClient} />

        {/* Leaderboard Section */}
        <div className="p-6">
        <h2 className="text-3xl font-bold mb-6 text-center font-heading">LEADERBOARD</h2>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Rank</th>
                <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Team</th>
                <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Country</th>
                <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Sprint</th>
                <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">On-Time %</th>
                <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Quality %</th>
                <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Status</th>
                <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allClients.map((client) => {
                const isCurrentClient = client.id === currentClient.id;
                const onTimePercentage = calculateOnTimePercentage(
                  client.onTimeDelivery.completed,
                  client.onTimeDelivery.total
                );
                const qualityAverage = calculateQualityAverage(client.qualityScores);
                
                return (
                  <tr
                    key={client.id}
                    className={`${
                      isCurrentClient
                        ? 'bg-black border-l-4 border-white text-white font-bold'
                        : 'bg-gray-800 text-gray-200 border-l-4 border-transparent'
                    } hover:bg-gray-700 transition-colors`}
                  >
                    <td className="py-4 px-2">
                      <div className="text-6xl font-bold font-heading">
                        {client.rank}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="font-medium font-heading">{client.name}</div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-sm font-body">
                        {getCountryName(client.countryCode)}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-sm font-body">
                        Sprint {client.currentSprint.number}
                      </div>
                      <div className="text-xs text-gray-400 font-body">
                        {client.currentSprint.name}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-6xl font-bold font-heading">
                        {onTimePercentage}%
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-6xl font-bold font-heading">
                        {qualityAverage}%
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`px-3 py-1 rounded text-sm font-bold font-body ${getStatusColor(client.status)}`}>
                        {client.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      {isCurrentClient ? (
                        <button
                          onClick={() => handleViewClient(client)}
                          className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors font-heading text-sm font-bold"
                        >
                          VIEW
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm font-body">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {allClients.map((client) => {
            const isCurrentClient = client.id === currentClient.id;
            const onTimePercentage = calculateOnTimePercentage(
              client.onTimeDelivery.completed,
              client.onTimeDelivery.total
            );
            const qualityAverage = calculateQualityAverage(client.qualityScores);
            
            return (
              <div
                key={client.id}
                className={`${
                  isCurrentClient
                    ? 'bg-black border-l-4 border-white text-white font-bold'
                    : 'bg-gray-800 text-gray-200 border-l-4 border-transparent'
                } p-4 rounded-lg`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="text-4xl font-bold font-heading">#{client.rank}</div>
                  <div className="text-sm font-body text-right">{getCountryName(client.countryCode)}</div>
                </div>
                
                <div className="mb-3">
                  <div className="font-medium text-lg font-heading">{client.name}</div>
                  <div className="text-sm text-gray-400 font-body">
                    Sprint {client.currentSprint.number} - {client.currentSprint.name}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400 font-body">On-Time %</div>
                    <div className="text-3xl font-bold font-heading">{onTimePercentage}%</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400 font-body">Quality %</div>
                    <div className="text-3xl font-bold font-heading">{qualityAverage}%</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-3 py-1 rounded text-sm font-bold font-body ${getStatusColor(client.status)}`}>
                    {client.status.replace('_', ' ')}
                  </span>
                  {isCurrentClient && (
                    <span className="text-red-500 font-bold text-sm font-heading">YOU</span>
                  )}
                </div>
                
                <div className="flex justify-center">
                  {isCurrentClient ? (
                    <button
                      onClick={() => handleViewClient(client)}
                      className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors font-heading text-sm font-bold"
                    >
                      VIEW DETAILS
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm font-body">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start, Stop, Do Better Section */}
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6 text-center font-heading text-black uppercase">START, STOP, DO BETTER</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* START Card */}
          <div className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg p-6 rounded-lg hover:transform hover:scale-105 transition-all duration-300">
            <div className="text-xl font-bold uppercase mb-4 font-heading text-black">START</div>
            <div className="text-base font-body text-gray-800 mb-4 min-h-[80px]">
              {ssdbInsights?.start_insight ? (
                <div className="space-y-2">
                  {ssdbInsights.start_insight.split('\n').map((line: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>{line.trim()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 italic">Insights coming soon</span>
              )}
            </div>
            <div className="text-xs text-gray-600 font-body">What to start doing</div>
          </div>

          {/* STOP Card */}
          <div className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg p-6 rounded-lg hover:transform hover:scale-105 transition-all duration-300">
            <div className="text-xl font-bold uppercase mb-4 font-heading text-black">STOP</div>
            <div className="text-base font-body text-gray-800 mb-4 min-h-[80px]">
              {ssdbInsights?.stop_insight ? (
                <div className="space-y-2">
                  {ssdbInsights.stop_insight.split('\n').map((line: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>{line.trim()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 italic">Insights coming soon</span>
              )}
            </div>
            <div className="text-xs text-gray-600 font-body">What to stop doing</div>
          </div>

          {/* DO BETTER Card */}
          <div className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg p-6 rounded-lg hover:transform hover:scale-105 transition-all duration-300">
            <div className="text-xl font-bold uppercase mb-4 font-heading text-black">DO BETTER</div>
            <div className="text-base font-body text-gray-800 mb-4 min-h-[80px]">
              {ssdbInsights?.do_better_insight ? (
                <div className="space-y-2">
                  {ssdbInsights.do_better_insight.split('\n').map((line: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>{line.trim()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 italic">Insights coming soon</span>
              )}
            </div>
            <div className="text-xs text-gray-600 font-body">What to do better</div>
          </div>
        </div>
      </div>

      {/* Client Detail Modal */}
      <ClientDetailModal
        client={selectedClient}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      </div>
    </div>
  );
}