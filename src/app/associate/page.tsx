'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Associate, Client } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
    case 'ON_TIME': return 'bg-green-500';
    case 'DELAYED': return 'bg-red-500';
    case 'PROGRESS_MEETING':
    case 'GRADUATED':
    case 'STARTING_SOON':
    default: return 'bg-gray-400';
  }
}

// Transform Supabase data to Client interface
function transformSupabaseToClient(data: Record<string, any>): Client {
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
    status: data.status,
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

export default function AssociateDashboard() {
  const [associate, setAssociate] = useState<Associate | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  
  // Modal states
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [manageClientModalOpen, setManageClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // SSDB Insights states
  const [ssdbModalOpen, setSsdbModalOpen] = useState(false);
  const [ssdbForm, setSsdbForm] = useState({
    startInsight: '',
    stopInsight: '',
    doBetterInsight: ''
  });
  const [ssdbInsights, setSsdbInsights] = useState<{[key: string]: Record<string, any> | null}>({});
  const [newClientForm, setNewClientForm] = useState<NewClientForm>({
    name: '',
    countryCode: '',
    ceoName: '',
    programChampion: '',
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const accessCode = searchParams.get('code');

  const fetchAssociateData = async () => {
    if (!accessCode) {
      setError('Access code is missing.');
      setLoading(false);
      router.push('/');
      return;
    }

    try {
      // Fetch associate
      const { data: associateData, error: associateError } = await supabase
        .from('associates')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (associateError || !associateData) {
        setError('Associate not found or invalid access code.');
        setLoading(false);
        return;
      }
      setAssociate(associateData);

      // Fetch clients assigned to this associate
      const { data: clientsData, error: clientsError } = await supabase
        .from('teams')
        .select('*')
        .eq('current_guru', associateData.name)
        .order('rank', { ascending: true });

      if (clientsError) {
        setError('Failed to fetch clients data.');
        setLoading(false);
        return;
      }

      setClients(clientsData.map(transformSupabaseToClient));

      // Fetch activity log
      const { data: activityData } = await supabase
        .from('activity_log')
        .select('*')
        .eq('associate_id', associateData.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      setActivityLog(activityData || []);

      // Fetch SSDB insights for all clients
      const transformedClients = clientsData.map(transformSupabaseToClient);
      const insightsPromises = transformedClients.map(async (client) => {
        const { data: insightData, error: insightError } = await supabase
          .from('ssdb_insights')
          .select('*')
          .eq('team_id', client.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!insightError && insightData) {
          return { clientId: client.id, insight: insightData };
        }
        return { clientId: client.id, insight: null };
      });

      const insightsResults = await Promise.all(insightsPromises);
      const insightsMap: {[key: string]: Record<string, any> | null} = {};
      insightsResults.forEach(result => {
        insightsMap[result.clientId] = result.insight;
      });
      setSsdbInsights(insightsMap);
    } catch (err) {
      console.error('Error fetching associate data:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessCode) {
      fetchAssociateData();
    }
  }, [accessCode]);

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
      const newAccessCode = `CLIENT${Date.now()}`;
      
      const { error } = await supabase
        .from('teams')
        .insert({
          name: newClientForm.name,
          access_code: newAccessCode,
          country_code: newClientForm.countryCode,
          program_champion: newClientForm.programChampion,
          current_guru: associate?.name,
          status: 'STARTING_SOON',
          week_number: 1,
          on_time_completed: 0,
          on_time_total: 0,
          quality_scores: [],
          current_sprint_number: 1,
          current_sprint_name: 'Business Model Canvas',
          start_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        associate_id: associate?.id,
        client_name: newClientForm.name,
        action: 'Client created',
        timestamp: new Date().toISOString(),
      });

      setNewClientForm({ name: '', countryCode: '', ceoName: '', programChampion: '' });
      setNewClientModalOpen(false);
      await fetchAssociateData();
    } catch (err) {
      console.error('Error creating client:', err);
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

    setLoading(true);
    try {
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
    } catch (err) {
      console.error('Error saving SSDB insights:', err);
      alert('Failed to save insights. Please try again.');
    } finally {
      setLoading(false);
    }
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

        {/* SECTION 4: Client Cards Grid */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold mb-6 font-heading">Your Clients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => {
              const onTimePercentage = calculateOnTimePercentage(
                client.onTimeDelivery.completed,
                client.onTimeDelivery.total
              );
              const qualityAverage = calculateQualityAverage(client.qualityScores);
              
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
                  
                  <Button
                    onClick={() => {
                      setSelectedClient(client);
                      setManageClientModalOpen(true);
                    }}
                    className="w-full bg-black text-white hover:bg-gray-800 font-heading"
                  >
                    MANAGE CLIENT
                  </Button>
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
              <div className="text-6xl font-bold text-green-500 font-heading">{analytics.onTimeClients}</div>
            </div>
            <div className="bg-white text-black p-6 rounded-lg">
              <div className="text-xs uppercase tracking-wide mb-2 font-body">In Delay</div>
              <div className="text-6xl font-bold text-red-500 font-heading">{analytics.delayedClients}</div>
            </div>
            <div className="bg-white text-black p-6 rounded-lg">
              <div className="text-xs uppercase tracking-wide mb-2 font-body">Graduated</div>
              <div className="text-6xl font-bold text-blue-500 font-heading">{analytics.graduatedClients}</div>
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
                          <div className="text-2xl font-bold font-heading">{client.rank}</div>
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
                          <div className="text-2xl font-bold font-heading">{onTimePercentage}%</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-2xl font-bold font-heading">{qualityAverage}%</div>
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
                        {new Date(activity.timestamp).toLocaleString()}
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
              <Button className="flex-1 bg-blue-500 text-white hover:bg-blue-600 font-heading">
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
    </div>
  );
}