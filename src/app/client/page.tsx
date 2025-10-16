'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Client, ClientStatus } from '@/types';
import ExecutiveSummary from '@/components/client/ExecutiveSummary';
import ClientDetailModal from '@/components/client/ClientDetailModal';
import { useErrorHandler } from '@/utils/errorHandler';
import { isValidSupabaseTeamData, isValidSSDBInsights } from '@/utils/typeGuards';
import { useLoading } from '@/hooks/useLoading';
import { useStableCallback } from '@/hooks/usePerformance';
import { LoadingPage } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';
import { getRankChange, calculateCombinedScore } from '@/utils/calculations';

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
      return 'bg-[#1DB954]';
    case 'DELAYED':
      return 'bg-[#E50914]';
    case 'PROGRESS_MEETING':
    case 'GRADUATED':
    case 'STARTING_SOON':
    default:
      return 'bg-[#999999]';
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

// Transform Supabase data to Client interface with validation
function transformSupabaseToClient(data: SupabaseTeamData): Client {
  // Validate the data before transformation
  if (!isValidSupabaseTeamData(data)) {
    throw new Error('Invalid team data received from database')
  }

  return {
    id: data.id,
    name: data.name,
    accessCode: data.access_code,
    weekNumber: data.week_number || 1,
    onTimeDelivery: {
      completed: data.on_time_completed || 0,
      total: data.on_time_total || 0,
    },
    qualityScores: data.quality_scores || [],
    status: data.status as ClientStatus,
    currentSprint: {
      number: data.current_sprint_number || 1,
      name: data.current_sprint_name || 'Sprint 1',
    },
    sprintDeadline: data.sprint_deadline || new Date().toISOString().split('T')[0],
    nextSprint: {
      number: data.next_sprint_number || 2,
      name: data.next_sprint_name || 'Sprint 2',
    },
    nextSprintRelease: data.next_sprint_release || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startDate: data.start_date || new Date().toISOString().split('T')[0],
    graduationDate: data.graduation_date || undefined,
    daysInDelay: data.days_in_delay || 0,
    programChampion: data.program_champion || 'Unknown',
    currentGuru: data.current_guru || 'Unknown',
    completedSprints: data.completed_sprints || [],
    sprints: [], // Will be populated separately if needed
    rank: data.rank || 1,
    totalClients: 0, // Will be set from all clients count
    countryCode: data.country_code || 'US',
    associateId: data.associate_id || '',
    previousRank: data.previous_rank || undefined,
  };
}

function ClientDashboard() {
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ssdbInsights, setSsdbInsights] = useState<{start_insight: string; stop_insight: string; do_better_insight: string} | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const { loading, error, setError, withLoading } = useLoading();
  
  const accessCode = searchParams.get('code');

  const fetchClientData = useStableCallback(async () => {
    if (!accessCode) {
      setError('Access code is missing');
      return;
    }

    console.log('🔄 CLIENT VIEW - Fetching data for access code:', accessCode);

    await withLoading(async () => {
      // Fetch current client by access code
      const { data: clientData, error: clientError } = await supabase
        .from('teams')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (clientError) {
        console.error('❌ CLIENT VIEW - Fetch error:', clientError);
        const appError = handleError(clientError, {
          component: 'ClientDashboard',
          action: 'fetchClientData',
          additionalData: { accessCode }
        });
        throw new Error(appError.message);
      }

      if (!clientData) {
        console.error('❌ CLIENT VIEW - No client data found for code:', accessCode);
        throw new Error('Client not found. Please check your access code.');
      }

      console.log('📥 CLIENT VIEW - Fetched raw database data:');
      console.log('  - Client ID:', clientData.id);
      console.log('  - Client name:', clientData.name);
      console.log('  - Access code:', clientData.access_code);
      console.log('  - on_time_completed:', clientData.on_time_completed);
      console.log('  - on_time_total:', clientData.on_time_total);
      console.log('  - quality_scores:', clientData.quality_scores);
      console.log('  - completed_sprints:', clientData.completed_sprints);
      console.log('  - rank:', clientData.rank);

      // Fetch all clients for leaderboard
      const { data: allClientsData, error: allClientsError } = await supabase
        .from('teams')
        .select('*')
        .order('rank', { ascending: true });

      if (allClientsError) {
        const appError = handleError(allClientsError, {
          component: 'ClientDashboard',
          action: 'fetchAllClients'
        });
        throw new Error(appError.message);
      }

      // Transform data with validation
      let transformedClient: Client;
      let transformedAllClients: Client[];

      try {
        transformedClient = transformSupabaseToClient(clientData);
        transformedAllClients = allClientsData.map(transformSupabaseToClient);
        
        console.log('🔄 CLIENT VIEW - Data transformed to Client interface:');
        console.log('  - Client name:', transformedClient.name);
        console.log('  - onTimeDelivery.completed:', transformedClient.onTimeDelivery.completed);
        console.log('  - onTimeDelivery.total:', transformedClient.onTimeDelivery.total);
        console.log('  - qualityScores:', transformedClient.qualityScores);
        console.log('  - completedSprints:', transformedClient.completedSprints);
      } catch (transformError) {
        console.error('❌ CLIENT VIEW - Transformation error:', transformError);
        const appError = handleError(transformError, {
          component: 'ClientDashboard',
          action: 'transformData'
        });
        throw new Error(appError.message);
      }

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
        if (isValidSSDBInsights(ssdbData)) {
          setSsdbInsights(ssdbData);
        } else {
          console.warn('Invalid SSDB insights data received:', ssdbData);
        }
      }
    });
  });

  useEffect(() => {
    if (!accessCode) {
      router.push('/');
      return;
    }

    // Initial fetch
    fetchClientData();
    
    // Auto-refresh every 30 seconds
    console.log('⏰ Setting up auto-refresh (every 30 seconds)');
    const refreshInterval = setInterval(() => {
      console.log('⏰ Auto-refresh triggered');
      fetchClientData();
    }, 30000); // 30 seconds
    
    // Cleanup interval on unmount
    return () => {
      console.log('🛑 Clearing auto-refresh interval');
      clearInterval(refreshInterval);
    };
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
    return <LoadingPage isLoading={true} message="Loading your dashboard..." className="bg-black text-white"><div /></LoadingPage>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4 font-heading">
              Something went wrong
            </h1>
            <ErrorDisplay
              error={error}
              onRetry={() => fetchClientData()}
              className="mb-6 bg-red-900 border-red-700"
            />
            <button 
              onClick={() => router.push('/')}
              className="bg-white text-black px-6 py-2 rounded hover:bg-gray-200 font-heading"
            >
              Back to Login
            </button>
          </div>
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
              onClick={() => {
                console.log('🔄 Manual refresh triggered by user');
                fetchClientData();
              }} 
              className="bg-[#1DB954] text-white px-6 py-2 rounded font-heading hover:bg-[#1aa845] transition"
              title="Refresh data"
            >
              🔄 REFRESH
            </button>
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
                const rankChange = getRankChange(client.rank, client.previousRank);
                
                return (
                  <tr
                    key={client.id}
                    className={`${
                      isCurrentClient
                        ? 'bg-black border-l-4 border-[#E50914] text-white font-bold'
                        : 'bg-gray-800 text-gray-200 border-l-4 border-transparent'
                    } hover:bg-gray-700 transition-colors`}
                  >
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[96px] leading-none font-bold font-heading">
                          {client.rank}
                        </span>
                        {rankChange && (
                          <span className={`text-3xl ${
                            rankChange === '↑' ? 'text-[#1DB954]' :
                            rankChange === '↓' ? 'text-[#E50914]' :
                            'text-[#999999]'
                          }`}>
                            {rankChange}
                          </span>
                        )}
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
                      <div className="text-[72px] leading-none font-bold font-heading">
                        {onTimePercentage}%
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-[72px] leading-none font-bold font-heading">
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

        {/* Mobile Cards - 3 Column Layout */}
        <div className="md:hidden space-y-4">
          {allClients.map((client) => {
            const isCurrentClient = client.id === currentClient.id;
            const onTimePercentage = calculateOnTimePercentage(
              client.onTimeDelivery.completed,
              client.onTimeDelivery.total
            );
            const qualityAverage = calculateQualityAverage(client.qualityScores);
            const combinedScore = calculateCombinedScore(onTimePercentage, qualityAverage);
            
            return (
              <div
                key={client.id}
                className={`${
                  isCurrentClient
                    ? 'bg-black border-l-4 border-[#E50914] text-white'
                    : 'bg-gray-800 text-gray-200 border-l-4 border-transparent'
                } p-4 rounded-lg`}
              >
                {/* Rank and Team Name */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[48px] leading-none font-bold font-heading">{client.rank}</div>
                    <div className="text-lg font-bold mt-1 font-heading">{client.name}</div>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-bold font-body ${getStatusColor(client.status)}`}>
                    {client.status.replace('_', ' ')}
                  </span>
                </div>
                
                {/* Combined Score */}
                <div className="text-center py-4 bg-gray-900 rounded mb-3">
                  <div className="text-xs uppercase mb-1 font-body">Combined Score</div>
                  <div className="text-[48px] leading-none font-bold font-heading">{combinedScore.toFixed(1)}</div>
                </div>
                
                {/* View Details Button */}
                {isCurrentClient && (
                  <button 
                    onClick={() => handleViewClient(client)}
                    className="w-full py-2 bg-white text-black rounded font-bold font-heading"
                  >
                    VIEW DETAILS
                  </button>
                )}
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

export default function ClientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="font-heading text-xl">Loading...</p>
      </div>
    </div>}>
      <ClientDashboard />
    </Suspense>
  );
}