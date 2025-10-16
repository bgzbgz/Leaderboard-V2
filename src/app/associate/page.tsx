'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Associate, Client, ClientStatus } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useErrorHandler } from '@/utils/errorHandler';
import { isValidSupabaseTeamData, isValidSSDBInsights } from '@/utils/typeGuards';
import { useLoading } from '@/hooks/useLoading';
import { useStableCallback } from '@/hooks/usePerformance';
import { LoadingPage } from '@/components/ui/loading';
import { formatDisplayDate } from '@/utils/dateUtils';
import { ErrorDisplay } from '@/components/ui/error-display';
import EnhancedClientManagementModal from '@/components/associate/EnhancedClientManagementModal';
import ScoreCalculator from '@/components/associate/ScoreCalculator';

// Helper function to get full country name
function getCountryName(countryCode: string): string {
  const countries: { [key: string]: string } = {
    'MU': 'Mauritius', 'LV': 'Latvia', 'KE': 'Kenya', 'GT': 'Guatemala', 'IT': 'Italy',
    'EE': 'Estonia', 'LK': 'Sri Lanka', 'PL': 'Poland', 'MX': 'Mexico', 'AT': 'Austria',
  };
  return countries[countryCode] || countryCode;
}

// Helper function to get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'ON_TIME': return 'bg-[#1DB954]';
    case 'DELAYED': return 'bg-[#E50914]';
    case 'PROGRESS_MEETING':
    case 'GRADUATED':
    case 'STARTING_SOON':
    default: return 'bg-[#999999]';
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
    sprints: [],
    rank: data.rank,
    totalClients: 0,
    countryCode: data.country_code,
    associateId: data.associate_id,
    previousRank: data.previous_rank,
  };
}

interface ActivityLog {
  id: string;
  timestamp: string;
  clientName: string;
  action: string;
}

interface NewClientForm {
  name: string;
  countryCode: string;
  ceoName: string;
  programChampion: string;
}

function AssociateDashboard() {
  const [associate, setAssociate] = useState<Associate | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  
  // Modal states
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [manageClientModalOpen, setManageClientModalOpen] = useState(false);
  const [enhancedManageModalOpen, setEnhancedManageModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // SSDB Insights states
  const [ssdbModalOpen, setSsdbModalOpen] = useState(false);
  const [ssdbForm, setSsdbForm] = useState({
    startInsight: '',
    stopInsight: '',
    doBetterInsight: ''
  });
  const [ssdbInsights, setSsdbInsights] = useState<{[key: string]: {start_insight: string; stop_insight: string; do_better_insight: string} | null}>({});
  const [newClientForm, setNewClientForm] = useState<NewClientForm>({
    name: '',
    countryCode: '',
    ceoName: '',
    programChampion: '',
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const { loading, error, setError, withLoading } = useLoading();
  const accessCode = searchParams.get('code');

  const fetchAssociateData = useStableCallback(async () => {
    if (!accessCode) {
      setError('Access code is missing.');
      router.push('/');
      return;
    }

    await withLoading(async () => {
      // Fetch associate
      const { data: associateData, error: associateError } = await supabase
        .from('associates')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (associateError) {
        const appError = handleError(associateError, {
          component: 'AssociateDashboard',
          action: 'fetchAssociate',
          additionalData: { accessCode }
        });
        throw new Error(appError.message);
      }

      if (!associateData) {
        throw new Error('Associate not found or invalid access code.');
      }
      setAssociate(associateData);

      // Fetch clients assigned to this associate
      const { data: clientsData, error: clientsError } = await supabase
        .from('teams')
        .select('*')
        .eq('current_guru', associateData.name)
        .order('rank', { ascending: true });

      if (clientsError) {
        const appError = handleError(clientsError, {
          component: 'AssociateDashboard',
          action: 'fetchClients'
        });
        throw new Error(appError.message);
      }

      // Transform clients data with validation
      let transformedClients: Client[];
      try {
        transformedClients = clientsData.map(transformSupabaseToClient);
      } catch (transformError) {
        const appError = handleError(transformError, {
          component: 'AssociateDashboard',
          action: 'transformClientsData'
        });
        throw new Error(appError.message);
      }

      setClients(transformedClients);

      // Fetch activity log
      const { data: activityData, error: activityError } = await supabase
        .from('activity_log')
        .select('*')
        .eq('associate_id', associateData.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (activityError) {
        console.warn('Failed to fetch activity log:', activityError);
        setActivityLog([]);
      } else {
        setActivityLog(activityData || []);
      }

      // Fetch SSDB insights for all clients
      const insightsPromises = transformedClients.map(async (client) => {
        try {
          const { data: insightData, error: insightError } = await supabase
            .from('ssdb_insights')
            .select('*')
            .eq('team_id', client.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!insightError && insightData && isValidSSDBInsights(insightData)) {
            return { clientId: client.id, insight: insightData };
          }
          return { clientId: client.id, insight: null };
        } catch (insightErr) {
          console.warn(`Failed to fetch insights for client ${client.id}:`, insightErr);
          return { clientId: client.id, insight: null };
        }
      });

      const insightsResults = await Promise.all(insightsPromises);
      const insightsMap: {[key: string]: {start_insight: string; stop_insight: string; do_better_insight: string} | null} = {};
      insightsResults.forEach(result => {
        insightsMap[result.clientId] = result.insight;
      });
      setSsdbInsights(insightsMap);
    });
  });

  useEffect(() => {
    if (accessCode) {
      fetchAssociateData();
    }
  }, [accessCode, fetchAssociateData]);

  const calculateOnTimePercentage = (completed: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const calculateQualityAverage = (scores: number[]): number => {
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  const analytics = {
    totalClients: clients.length,
    onTimeClients: clients.filter(c => c.status === 'ON_TIME').length,
    delayedClients: clients.filter(c => c.status === 'DELAYED').length,
    graduatedClients: clients.filter(c => c.status === 'GRADUATED').length,
    averageQuality: calculateQualityAverage(clients.flatMap(c => c.qualityScores)),
  };

  const handleCreateNewClient = async () => {
    try {
      // Validate form data
      if (!newClientForm.name.trim()) {
        alert('Client name is required');
        return;
      }
      if (!newClientForm.countryCode.trim()) {
        alert('Country code is required');
        return;
      }
      if (!newClientForm.programChampion.trim()) {
        alert('Program champion is required');
        return;
      }
      if (!associate?.id) {
        alert('Associate information not found');
        return;
      }

      const newAccessCode = `CLIENT${Date.now()}`;
      
      const { error: clientError } = await supabase
        .from('teams')
        .insert({
          name: newClientForm.name.trim(),
          access_code: newAccessCode,
          country_code: newClientForm.countryCode.trim().toUpperCase(),
          program_champion: newClientForm.programChampion.trim(),
          current_guru: associate.name,
          status: 'STARTING_SOON',
          week_number: 1,
          on_time_completed: 0,
          on_time_total: 0,
          quality_scores: [],
          current_sprint_number: 1,
          current_sprint_name: 'Business Model Canvas',
          sprint_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          next_sprint_number: 2,
          next_sprint_name: 'Value Proposition Canvas',
          next_sprint_release: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
          start_date: new Date().toISOString().split('T')[0],
          graduation_date: null,
          days_in_delay: 0,
          completed_sprints: [],
          rank: 1, // Will be updated by the system
          associate_id: associate.id,
          previous_rank: null
        })
        .select()
        .single();

      if (clientError) {
        console.error('Client creation error:', clientError);
        alert(`Failed to create client: ${clientError.message}`);
        return;
      }

      // Update the rank for the new client
      const { error: rankError } = await supabase
        .from('teams')
        .update({ 
          rank: (await supabase.from('teams').select('id', { count: 'exact' })).count || 1
        })
        .eq('access_code', newAccessCode);

      if (rankError) {
        console.warn('Rank update error:', rankError);
        // Don't fail the entire operation for rank update errors
      }

      // Log activity
      const { error: logError } = await supabase.from('activity_log').insert({
        associate_id: associate.id,
        client_name: newClientForm.name.trim(),
        action: 'Client created',
        timestamp: new Date().toISOString(),
      });

      if (logError) {
        console.error('Activity log error:', logError);
        // Don't fail the entire operation for logging errors
      }

      // Reset form and close modal
      setNewClientForm({ name: '', countryCode: '', ceoName: '', programChampion: '' });
      setNewClientModalOpen(false);
      
      // Refresh data
      await fetchAssociateData();
      
      alert(`Client "${newClientForm.name}" created successfully with access code: ${newAccessCode}`);
    } catch (err) {
      console.error('Error creating client:', err);
      alert('An unexpected error occurred while creating the client. Please try again.');
    }
  };

  const handleRegenerateAccessCode = async (client: Client) => {
    try {
      const newCode = `CLIENT${Date.now()}`;
      await supabase
        .from('teams')
        .update({ access_code: newCode })
        .eq('id', client.id);

      // Log activity
      await supabase.from('activity_log').insert({
        associate_id: associate?.id,
        client_name: client.name,
        action: 'Access code regenerated',
        timestamp: new Date().toISOString(),
      });

      await fetchAssociateData();
    } catch (err) {
      console.error('Error regenerating access code:', err);
    }
  };

  const handleDeactivateClient = async (client: Client) => {
    try {
      await supabase
        .from('teams')
        .update({ access_code: 'DEACTIVATED' })
        .eq('id', client.id);

      // Log activity
      await supabase.from('activity_log').insert({
        associate_id: associate?.id,
        client_name: client.name,
        action: 'Client deactivated',
        timestamp: new Date().toISOString(),
      });

      await fetchAssociateData();
    } catch (err) {
      console.error('Error deactivating client:', err);
    }
  };

  const handleOpenSsdbModal = (client: Client) => {
    setSelectedClient(client);
    const existingInsight = ssdbInsights[client.id];
    setSsdbForm({
      startInsight: existingInsight?.start_insight || '',
      stopInsight: existingInsight?.stop_insight || '',
      doBetterInsight: existingInsight?.do_better_insight || ''
    });
    setSsdbModalOpen(true);
  };

  const handleSaveSsdbInsights = async () => {
    if (!selectedClient || !associate) return;

    // Validation
    const trimmedForm = {
      startInsight: ssdbForm.startInsight.trim(),
      stopInsight: ssdbForm.stopInsight.trim(),
      doBetterInsight: ssdbForm.doBetterInsight.trim()
    };

    if (!trimmedForm.startInsight && !trimmedForm.stopInsight && !trimmedForm.doBetterInsight) {
      alert('Please fill at least one insight field.');
      return;
    }

    // Check character limits
    if (trimmedForm.startInsight.length > 500 || trimmedForm.stopInsight.length > 500 || trimmedForm.doBetterInsight.length > 500) {
      alert('Each insight field must be 500 characters or less.');
      return;
    }

    await withLoading(async () => {
      const { error } = await supabase
        .from('ssdb_insights')
        .insert({
          team_id: selectedClient.id,
          start_insight: trimmedForm.startInsight || null,
          stop_insight: trimmedForm.stopInsight || null,
          do_better_insight: trimmedForm.doBetterInsight || null,
          created_by: associate.id,
        });

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        associate_id: associate.id,
        client_name: selectedClient.name,
        action: 'SSDB insights updated',
        timestamp: new Date().toISOString(),
      });

      alert('Insights saved! Client will see updated recommendations.');
      setSsdbModalOpen(false);
      setSsdbForm({ startInsight: '', stopInsight: '', doBetterInsight: '' });
      fetchAssociateData(); // Refresh to get updated insights
    });
  };

  if (loading) {
    return <LoadingPage isLoading={true} message="Loading associate dashboard..." className="bg-black text-white"><div /></LoadingPage>;
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
              onRetry={() => fetchAssociateData()}
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

  if (!associate) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl font-body">No associate data found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* SECTION 1: Header */}
      <header className="fixed top-0 left-0 right-0 bg-black z-50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-white font-heading text-2xl">Associate Panel</h1>
            <p className="text-gray-300 font-body text-sm">{associate.name}</p>
          </div>
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
      <div className="pt-24 p-6">
        {/* SECTION 2: Personal Greeting */}
        <div className="bg-black text-white text-center py-8 mb-8">
          <h2 className="font-heading text-5xl">Hello, {associate.name}!</h2>
        </div>

        {/* SECTION 3: Create New Client Button */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => setNewClientModalOpen(true)}
            className="bg-black text-white hover:bg-gray-800 font-heading"
          >
            CREATE NEW CLIENT
          </Button>
        </div>

        {/* SECTION 3.5: Score Calculator */}
        <div className="mb-12">
          <ScoreCalculator 
            clients={clients} 
            onScoreUpdate={fetchAssociateData}
          />
        </div>

        {/* SECTION 4: Client Cards Grid */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold mb-6 font-heading">Your Clients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => {
              const onTimePercentage = calculateOnTimePercentage(
                client.onTimeDelivery.completed,
                client.onTimeDelivery.total
              );
              return (
                <div key={client.id} className="bg-white text-black p-6 rounded-lg shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-heading text-2xl">{client.name}</h4>
                    <span className="text-sm font-body">{getCountryName(client.countryCode)}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="font-body text-sm">CEO: {client.programChampion || 'Not assigned'}</p>
                    <span className={`px-3 py-1 rounded text-sm font-bold font-body ${getStatusColor(client.status)}`}>
                      {client.status.replace('_', ' ')}
                    </span>
                    <p className="font-body text-sm">Sprint {client.currentSprint.number}: {client.currentSprint.name}</p>
                    <p className="font-body text-sm">Speed Score: {onTimePercentage}%</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setSelectedClient(client);
                        setEnhancedManageModalOpen(true);
                      }}
                      className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-heading"
                    >
                      ENHANCED MANAGE
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedClient(client);
                        setManageClientModalOpen(true);
                      }}
                      className="flex-1 bg-black text-white hover:bg-gray-800 font-heading"
                    >
                      QUICK MANAGE
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: Analytics Cards */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold mb-6 font-heading">Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white text-black p-6 rounded-lg">
              <div className="text-xs uppercase tracking-wide mb-2 font-body">Total Clients</div>
              <div className="text-6xl font-bold font-heading">{analytics.totalClients}</div>
            </div>
            <div className="bg-white text-black p-6 rounded-lg">
              <div className="text-xs uppercase tracking-wide mb-2 font-body">On Time</div>
              <div className="text-6xl font-bold text-[#1DB954] font-heading">{analytics.onTimeClients}</div>
            </div>
            <div className="bg-white text-black p-6 rounded-lg">
              <div className="text-xs uppercase tracking-wide mb-2 font-body">In Delay</div>
              <div className="text-6xl font-bold text-[#E50914] font-heading">{analytics.delayedClients}</div>
            </div>
            <div className="bg-white text-black p-6 rounded-lg">
              <div className="text-xs uppercase tracking-wide mb-2 font-body">Graduated</div>
              <div className="text-6xl font-bold text-[#999999] font-heading">{analytics.graduatedClients}</div>
            </div>
            <div className="bg-white text-black p-6 rounded-lg">
              <div className="text-xs uppercase tracking-wide mb-2 font-body">Avg Quality</div>
              <div className="text-6xl font-bold font-heading">{analytics.averageQuality}%</div>
            </div>
          </div>
        </div>

        {/* SECTION 6: Client Leaderboard Table */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold mb-6 font-heading">Client Leaderboard</h3>
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Rank</th>
                    <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Client</th>
                    <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Country</th>
                    <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">On-Time %</th>
                    <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Quality %</th>
                    <th className="text-left py-4 px-2 text-xs uppercase tracking-wide font-body">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const onTimePercentage = calculateOnTimePercentage(
                      client.onTimeDelivery.completed,
                      client.onTimeDelivery.total
                    );
                    const qualityAverage = calculateQualityAverage(client.qualityScores);
                    
                    return (
                      <tr key={client.id} className="border-b border-gray-700 hover:bg-gray-800">
                        <td className="py-4 px-2">
                          <div className="text-[96px] leading-none font-bold font-heading">{client.rank}</div>
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
                          <div className="text-[72px] leading-none font-bold font-heading">{onTimePercentage}%</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-[72px] leading-none font-bold font-heading">{qualityAverage}%</div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-3 py-1 rounded text-sm font-bold font-body ${getStatusColor(client.status)}`}>
                            {client.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 7: Access Code Management */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold mb-6 font-heading">Client Access Codes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div key={client.id} className="bg-white text-black p-6 rounded-lg shadow-lg">
                <h4 className="font-heading text-xl mb-4">{client.name}</h4>
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-wide mb-2 font-body">Access Code</div>
                  <div className="text-2xl font-bold font-heading bg-gray-100 p-3 rounded">
                    {client.accessCode}
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleRegenerateAccessCode(client)}
                    className="w-full bg-black text-white hover:bg-gray-800 font-heading text-sm"
                  >
                    REGENERATE
                  </Button>
                  <Button
                    onClick={() => handleDeactivateClient(client)}
                    className="w-full bg-red-500 text-white hover:bg-red-600 font-heading text-sm"
                  >
                    DEACTIVATE
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 8: Activity Log */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold mb-6 font-heading">Recent Activity</h3>
          <div className="bg-white text-black rounded-lg shadow-lg">
            <div className="p-6">
              {activityLog.length === 0 ? (
                <p className="text-gray-500 font-body">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                      <div>
                        <div className="font-heading text-lg">{activity.clientName}</div>
                        <div className="font-body text-sm text-gray-600">{activity.action}</div>
                      </div>
                      <div className="font-body text-sm text-gray-500">
                        {formatDisplayDate(activity.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SSDB Insights Management Section */}
      <div className="mb-12">
        <h3 className="text-3xl font-bold mb-6 font-heading">Client Insights - Start, Stop, Do Better</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => {
            const existingInsight = ssdbInsights[client.id];
            const hasInsight = existingInsight && (existingInsight.start_insight || existingInsight.stop_insight || existingInsight.do_better_insight);
            
            return (
              <div key={client.id} className="bg-white text-black p-6 rounded-lg shadow-lg">
                <h4 className="text-xl font-bold mb-4 font-heading">{client.name}</h4>
                
                <div className="mb-4">
                  {hasInsight ? (
                    <div className="text-sm text-gray-600 font-body">
                      <div className="mb-2">
                        <strong>Latest insight:</strong>
                      </div>
                      <div className="text-xs">
                        {existingInsight.start_insight && (
                          <div className="mb-1">
                            <span className="text-red-500">•</span> Start: {existingInsight.start_insight.substring(0, 50)}...
                          </div>
                        )}
                        {existingInsight.stop_insight && (
                          <div className="mb-1">
                            <span className="text-red-500">•</span> Stop: {existingInsight.stop_insight.substring(0, 50)}...
                          </div>
                        )}
                        {existingInsight.do_better_insight && (
                          <div className="mb-1">
                            <span className="text-red-500">•</span> Do Better: {existingInsight.do_better_insight.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic font-body">
                      No insights yet
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => handleOpenSsdbModal(client)}
                  className="w-full bg-black text-white hover:bg-gray-800 font-heading"
                >
                  EDIT INSIGHTS
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create New Client Modal */}
      <Dialog open={newClientModalOpen} onOpenChange={setNewClientModalOpen}>
        <DialogContent className="bg-white text-black">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-heading">Create New Client</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <label className="block text-sm font-medium mb-2 font-body">Client Name</label>
              <input
                type="text"
                value={newClientForm.name}
                onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
                placeholder="Enter client name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 font-body">Country Code</label>
              <input
                type="text"
                value={newClientForm.countryCode}
                onChange={(e) => setNewClientForm(prev => ({ ...prev, countryCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
                placeholder="e.g., US, UK, DE"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 font-body">Program Champion</label>
              <input
                type="text"
                value={newClientForm.programChampion}
                onChange={(e) => setNewClientForm(prev => ({ ...prev, programChampion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
                placeholder="Enter program champion name"
              />
            </div>
            
            <Button
              onClick={handleCreateNewClient}
              className="w-full bg-black text-white hover:bg-gray-800 font-heading"
            >
              CREATE CLIENT
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Client Modal */}
      <Dialog open={manageClientModalOpen} onOpenChange={setManageClientModalOpen}>
        <DialogContent className="bg-white text-black">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-heading">
              Manage Client - {selectedClient?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 font-body">On-Time Completed</label>
                <input
                  type="number"
                  defaultValue={selectedClient?.onTimeDelivery.completed}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 font-body">On-Time Total</label>
                <input
                  type="number"
                  defaultValue={selectedClient?.onTimeDelivery.total}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 font-body">Quality Score (0-100)</label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={selectedClient?.qualityScores[selectedClient.qualityScores.length - 1] || 0}
                className="w-full"
              />
            </div>
            
            <div className="flex space-x-4">
              <Button className="flex-1 bg-black text-white hover:bg-gray-800 font-heading">
                UPDATE SCORES
              </Button>
              <Button className="flex-1 bg-[#999999] text-white hover:bg-gray-700 font-heading">
                VIEW DETAILS
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SSDB Insights Modal */}
      <Dialog open={ssdbModalOpen} onOpenChange={setSsdbModalOpen}>
        <DialogContent className="bg-white text-black max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-heading">
              SSDB Insights for {selectedClient?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* START Section */}
            <div>
              <label className="block text-sm font-medium mb-2 font-body">
                What should {selectedClient?.name} START doing?
              </label>
              <textarea
                rows={4}
                value={ssdbForm.startInsight}
                onChange={(e) => setSsdbForm(prev => ({ ...prev, startInsight: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
                placeholder="E.g., Focus on customer feedback collection, implement weekly team retrospectives, start using project management tools..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1 font-body">
                {ssdbForm.startInsight.length}/500 characters
              </div>
            </div>

            {/* STOP Section */}
            <div>
              <label className="block text-sm font-medium mb-2 font-body">
                What should {selectedClient?.name} STOP doing?
              </label>
              <textarea
                rows={4}
                value={ssdbForm.stopInsight}
                onChange={(e) => setSsdbForm(prev => ({ ...prev, stopInsight: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
                placeholder="E.g., Stop relying solely on internal assumptions, avoid last-minute changes to sprint goals, stop skipping client check-ins..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1 font-body">
                {ssdbForm.stopInsight.length}/500 characters
              </div>
            </div>

            {/* DO BETTER Section */}
            <div>
              <label className="block text-sm font-medium mb-2 font-body">
                What should {selectedClient?.name} DO BETTER?
              </label>
              <textarea
                rows={4}
                value={ssdbForm.doBetterInsight}
                onChange={(e) => setSsdbForm(prev => ({ ...prev, doBetterInsight: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
                placeholder="E.g., Implement weekly customer satisfaction surveys, improve sprint planning accuracy, enhance team communication protocols..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1 font-body">
                {ssdbForm.doBetterInsight.length}/500 characters
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                onClick={handleSaveSsdbInsights}
                className="flex-1 bg-black text-white hover:bg-gray-800 font-heading"
                disabled={loading}
              >
                {loading ? 'SAVING...' : 'SAVE INSIGHTS'}
              </Button>
              <Button 
                onClick={() => setSsdbModalOpen(false)}
                className="flex-1 bg-white text-black border border-black hover:bg-gray-100 font-heading"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Client Management Modal */}
      <EnhancedClientManagementModal
        client={selectedClient}
        isOpen={enhancedManageModalOpen}
        onClose={() => {
          setEnhancedManageModalOpen(false);
          setSelectedClient(null);
        }}
        onSave={(updatedClient) => {
          // Update the client in the local state
          setClients(prev => 
            prev.map(c => c.id === updatedClient.id ? { ...c, ...updatedClient } : c)
          );
          setEnhancedManageModalOpen(false);
          setSelectedClient(null);
        }}
      />
    </div>
  );
}

export default function AssociatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="font-heading text-xl">Loading...</p>
      </div>
    </div>}>
      <AssociateDashboard />
    </Suspense>
  );
}