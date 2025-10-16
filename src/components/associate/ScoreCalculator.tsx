'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useClients } from '@/context/ClientContext';

interface ScoreCalculatorProps {
  // No longer needs clients prop - uses context
  onScoreUpdate?: () => Promise<void>;
}

interface ScoreUpdate {
  sprintNumber: number;
  qualityScore: number;
  submissionDate: string;
  deadline: string;
  isOnTime: boolean;
}

/**
 * Calculate speed score (on-time delivery percentage)
 */
const calculateSpeedScore = (onTimeCompleted: number, onTimeTotal: number): number => {
  if (onTimeTotal === 0) return 0;
  return Math.round((onTimeCompleted / onTimeTotal) * 100);
};

/**
 * Calculate quality average from all quality scores
 */
const calculateQualityAverage = (qualityScores: number[]): number => {
  if (qualityScores.length === 0) return 0;
  const sum = qualityScores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / qualityScores.length);
};

/**
 * Calculate quality trend (improving/declining)
 * Requires at least 6 sprint scores
 */
const calculateQualityTrend = (qualityScores: number[]): string | null => {
  if (qualityScores.length < 6) return null;
  
  const last3 = qualityScores.slice(-3);
  const previous3 = qualityScores.slice(-6, -3);
  
  const last3Avg = last3.reduce((a, b) => a + b, 0) / 3;
  const previous3Avg = previous3.reduce((a, b) => a + b, 0) / 3;
  
  const difference = last3Avg - previous3Avg;
  
  if (difference > 5) return '↑ improving';
  if (difference < -5) return '↓ declining';
  return null; // stable
};

/**
 * Calculate combined ranking score
 * 60% speed score + 40% quality score
 */
const calculateCombinedScore = (speedScore: number, qualityScore: number): number => {
  return (speedScore * 0.6) + (qualityScore * 0.4);
};

/**
 * Calculate if submission is on time
 */
const calculateIsOnTime = (deadline: string, submissionDate: string): boolean => {
  const deadlineDate = new Date(deadline);
  const submissionDateTime = new Date(submissionDate);
  return submissionDateTime <= deadlineDate;
};

/**
 * Get color for speed score display
 */
const getSpeedColor = (score: number): string => {
  if (score >= 80) return 'text-[#1DB954]';
  if (score >= 60) return 'text-[#FF9500]';
  return 'text-[#E50914]';
};

/**
 * Get color for quality score display
 */
const getQualityColor = (score: number): string => {
  if (score >= 80) return 'text-[#1DB954]';
  if (score >= 65) return 'text-[#FF9500]';
  return 'text-[#E50914]';
};

export default function ScoreCalculator({ onScoreUpdate }: ScoreCalculatorProps) {
  // Get clients from context instead of props
  const { clients, refreshClients } = useClients();
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [sprintNumber, setSprintNumber] = useState<number>(1);
  const [qualityScore, setQualityScore] = useState<number>(50);
  const [deadline, setDeadline] = useState<string>('');
  const [submissionDate, setSubmissionDate] = useState<string>('');
  const [isOnTimeOverride, setIsOnTimeOverride] = useState<boolean>(false);
  const [useManualOnTime, setUseManualOnTime] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Auto-calculate on-time status from dates
  const isOnTime = useManualOnTime 
    ? isOnTimeOverride 
    : deadline && submissionDate 
      ? calculateIsOnTime(deadline, submissionDate) 
      : false;

  // Get selected client
  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Calculate preview scores
  const newOnTimeCompleted = selectedClient 
    ? (isOnTime ? selectedClient.onTimeDelivery.completed + 1 : selectedClient.onTimeDelivery.completed)
    : 0;
  const newOnTimeTotal = selectedClient ? selectedClient.onTimeDelivery.total + 1 : 0;
  const newQualityScores = selectedClient 
    ? [...selectedClient.qualityScores, qualityScore] 
    : [qualityScore];

  const newSpeedScore = calculateSpeedScore(newOnTimeCompleted, newOnTimeTotal);
  const newQualityAverage = calculateQualityAverage(newQualityScores);
  const qualityTrend = calculateQualityTrend(newQualityScores);
  const newCombinedScore = calculateCombinedScore(newSpeedScore, newQualityAverage);

  // Calculate predicted rank
  const predictedRank = calculatePredictedRank(newCombinedScore);

  function calculatePredictedRank(combinedScore: number): number {
    // Calculate combined scores for all clients
    const allScores = clients.map(client => {
      if (client.id === selectedClientId) {
        return { id: client.id, score: combinedScore };
      }
      
      const speedScore = calculateSpeedScore(
        client.onTimeDelivery.completed,
        client.onTimeDelivery.total
      );
      const qualityAverage = calculateQualityAverage(client.qualityScores);
      const score = calculateCombinedScore(speedScore, qualityAverage);
      
      return { id: client.id, score };
    });

    // Sort by score (highest first)
    allScores.sort((a, b) => b.score - a.score);

    // Find rank of selected client
    const rank = allScores.findIndex(s => s.id === selectedClientId) + 1;
    return rank;
  }

  /**
   * Update client scores in database and recalculate ranks
   */
  const updateClientScores = async (clientId: string, scoreUpdate: ScoreUpdate) => {
    try {
      // 1. Fetch current client data
      const { data: client, error: fetchError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', clientId)
        .single();

      if (fetchError || !client) {
        throw new Error('Failed to fetch client data');
      }

      // 2. Update on-time delivery
      const newOnTimeTotal = (client.on_time_total || 0) + 1;
      const newOnTimeCompleted = scoreUpdate.isOnTime 
        ? (client.on_time_completed || 0) + 1 
        : (client.on_time_completed || 0);

      // 3. Update quality scores array
      const currentQualityScores = client.quality_scores || [];
      const newQualityScores = [...currentQualityScores, scoreUpdate.qualityScore];

      // 4. Update completed sprints
      const currentCompletedSprints = client.completed_sprints || [];
      const newCompletedSprints = [...currentCompletedSprints, scoreUpdate.sprintNumber];

      // 5. Check if client is graduating (completed sprint 30)
      const isGraduating = scoreUpdate.sprintNumber === 30;
      const updateData: Record<string, unknown> = {
        on_time_completed: newOnTimeCompleted,
        on_time_total: newOnTimeTotal,
        quality_scores: newQualityScores,
        completed_sprints: newCompletedSprints,
        updated_at: new Date().toISOString()
      };

      // Set status to GRADUATED and graduation date if completing sprint 30
      if (isGraduating) {
        updateData.status = 'GRADUATED';
        updateData.graduation_date = new Date().toISOString().split('T')[0];
      }

      // 6. Update database
      console.log('🎯 PRE-UPDATE DEBUG:');
      console.log('  - Client ID:', clientId);
      console.log('  - Current DB values:', {
        on_time_completed: client.on_time_completed,
        on_time_total: client.on_time_total,
        quality_scores: client.quality_scores,
        completed_sprints: client.completed_sprints
      });
      console.log('  - New calculated values:', {
        on_time_completed: newOnTimeCompleted,
        on_time_total: newOnTimeTotal,
        quality_scores: newQualityScores,
        completed_sprints: newCompletedSprints
      });
      console.log('💾 Sending UPDATE with payload:', updateData);
      
      const { data: updatedRow, error: updateError } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', clientId)
        .select()  // Return the updated row
        .maybeSingle();  // Tolerate 0 or 1 rows (more forgiving than .single())

      console.log('📤 SUPABASE UPDATE RESPONSE:', {
        data: updatedRow,
        error: updateError
      });

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        console.error('  - Error code:', updateError.code);
        console.error('  - Error message:', updateError.message);
        console.error('  - Error details:', updateError.details);
        console.error('  - Error hint:', updateError.hint);
        throw new Error(`Failed to update client scores: ${updateError.message}`);
      }

      if (!updatedRow) {
        console.error('❌ UPDATE returned no data! This means the row was not updated.');
        console.error('  - Possible causes:');
        console.error('    1. RLS policy is still blocking the update');
        console.error('    2. Client ID does not exist');
        console.error('    3. WITH CHECK clause in RLS policy is rejecting the update');
        throw new Error('UPDATE returned no data - row was not updated');
      }

      console.log('✅ Database UPDATE completed successfully');
      console.log('  - Row returned from UPDATE:', updatedRow);
      console.log('  - on_time_completed:', updatedRow.on_time_completed);
      console.log('  - on_time_total:', updatedRow.on_time_total);
      console.log('  - quality_scores:', updatedRow.quality_scores);
      console.log('  - completed_sprints:', updatedRow.completed_sprints);
      
      // Verify UPDATE actually wrote the expected values
      const updateSuccess = 
        updatedRow.on_time_completed === newOnTimeCompleted &&
        updatedRow.on_time_total === newOnTimeTotal &&
        JSON.stringify(updatedRow.quality_scores) === JSON.stringify(newQualityScores);
      
      console.log('🔍 UPDATE VERIFICATION:', updateSuccess ? '✅ SUCCESS' : '❌ MISMATCH');
      if (!updateSuccess) {
        console.error('❌ UPDATE MISMATCH DETECTED:');
        console.error('  Expected:', { newOnTimeCompleted, newOnTimeTotal, newQualityScores });
        console.error('  Got:', { 
          on_time_completed: updatedRow.on_time_completed,
          on_time_total: updatedRow.on_time_total,
          quality_scores: updatedRow.quality_scores
        });
      }

      // VERIFICATION - Fetch the client again to confirm update
      const { data: verifyClient, error: verifyError } = await supabase
        .from('teams')
        .select('id, name, access_code, on_time_completed, on_time_total, quality_scores, completed_sprints')
        .eq('id', clientId)
        .single();

      if (verifyError) {
        console.error('❌ Verification query failed:', verifyError);
      } else {
        console.log('🔍 VERIFICATION - Client data after update:');
        console.log('  - Client name:', verifyClient?.name);
        console.log('  - Client access_code:', verifyClient?.access_code);
        console.log('  - on_time_completed:', verifyClient?.on_time_completed);
        console.log('  - on_time_total:', verifyClient?.on_time_total);
        console.log('  - quality_scores:', verifyClient?.quality_scores);
        console.log('  - completed_sprints:', verifyClient?.completed_sprints);
      }

      // 7. Recalculate all ranks
      await recalculateAllRanks();

      return true;
    } catch (error) {
      console.error('Error updating client scores:', error);
      throw error;
    }
  };

  /**
   * Recalculate ranks for all clients based on combined scores
   */
  const recalculateAllRanks = async () => {
    try {
      console.log('🔧 Starting rank recalculation...');
      
      // 1. Fetch all clients
      const { data: allClients, error: fetchError } = await supabase
        .from('teams')
        .select('*');

      if (fetchError || !allClients) {
        console.error('❌ Failed to fetch clients for ranking:', fetchError);
        throw new Error('Failed to fetch all clients');
      }

      console.log(`📊 Found ${allClients.length} clients to rank`);

      // 2. Calculate combined score for each
      const clientsWithScores = allClients.map(client => {
        const speedScore = calculateSpeedScore(
          client.on_time_completed || 0,
          client.on_time_total || 0
        );
        const qualityScore = calculateQualityAverage(client.quality_scores || []);
        const combinedScore = calculateCombinedScore(speedScore, qualityScore);

        console.log(`  - ${client.name}: Speed ${speedScore}%, Quality ${qualityScore}%, Combined ${combinedScore.toFixed(2)}`);

        return {
          id: client.id,
          name: client.name,
          combinedScore,
          previousRank: client.rank
        };
      });

      // 3. Sort by combined score (highest first)
      clientsWithScores.sort((a, b) => b.combinedScore - a.combinedScore);
      
      console.log('🏆 Ranking order (by combined score):');
      clientsWithScores.forEach((client, index) => {
        console.log(`  Rank ${index + 1}: ${client.name} (Score: ${client.combinedScore.toFixed(2)})`);
      });

      // 4. Assign new ranks and update database
      for (let i = 0; i < clientsWithScores.length; i++) {
        const client = clientsWithScores[i];
        const newRank = i + 1;

        const { error: updateError } = await supabase
          .from('teams')
          .update({
            rank: newRank,
            previous_rank: client.previousRank
          })
          .eq('id', client.id);
        
        if (updateError) {
          console.error(`❌ Failed to update rank for ${client.name}:`, updateError);
        } else {
          console.log(`✅ Updated ${client.name}: Rank ${newRank} (was ${client.previousRank || 'none'})`);
        }
      }

      console.log('✅ All ranks recalculated successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error recalculating ranks:', error);
      throw error;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validation
    if (!selectedClientId) {
      setMessage({ type: 'error', text: 'Please select a client' });
      return;
    }

    if (!sprintNumber || sprintNumber < 1 || sprintNumber > 30) {
      setMessage({ type: 'error', text: 'Sprint number must be between 1 and 30' });
      return;
    }

    // Check for duplicate sprint entry
    if (selectedClient && selectedClient.completedSprints.includes(sprintNumber)) {
      setMessage({ 
        type: 'error', 
        text: `Sprint ${sprintNumber} has already been completed for ${selectedClient.name}. Please select a different sprint number.` 
      });
      return;
    }

    if (!deadline) {
      setMessage({ type: 'error', text: 'Please select a deadline' });
      return;
    }

    if (!submissionDate) {
      setMessage({ type: 'error', text: 'Please select a submission date' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const scoreUpdate: ScoreUpdate = {
        sprintNumber,
        qualityScore,
        submissionDate,
        deadline,
        isOnTime
      };

      console.log('🎯 Starting score update for client:', selectedClientId);
      
      await updateClientScores(selectedClientId, scoreUpdate);
      
      console.log('✅ Score update successful!');
      
      setMessage({ 
        type: 'success', 
        text: `✅ Scores updated successfully! Rank recalculated. ${selectedClient?.name} is now predicted rank #${predictedRank}`
      });

      // Refresh clients from context (ensures fresh data in dropdown)
      console.log('🔄 Refreshing clients from context...');
      await refreshClients();
      
      // Also call parent refresh if provided (for backwards compatibility)
      if (onScoreUpdate) {
        console.log('🔄 Calling parent refresh...');
        await onScoreUpdate();
      }
      
      console.log('✅ All data refreshed, keeping form visible for 3 seconds...');

      // Reset form after 3 seconds (so user can see the success message)
      setTimeout(() => {
        console.log('🔄 Resetting form...');
        setSprintNumber(1);
        setQualityScore(50);
        setDeadline('');
        setSubmissionDate('');
        setUseManualOnTime(false);
        setMessage(null);
      }, 3000);
    } catch (error: unknown) {
      console.error('❌ Score update failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      setMessage({ 
        type: 'error', 
        text: `❌ Failed to update scores: ${errorMessage}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg text-black">
      <h2 className="text-2xl font-bold mb-6 font-heading">Score Calculator</h2>

      {/* Client Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 font-body">Select Client</label>
        <select 
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
        >
          <option value="">-- Choose a client --</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name} (Current Rank: #{client.rank})
            </option>
          ))}
        </select>
      </div>

      {/* Sprint Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2 font-body">Sprint Number (1-30)</label>
          <input 
            type="number" 
            min="1" 
            max="30"
            value={sprintNumber}
            onChange={(e) => setSprintNumber(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 font-body">Quality Score (0-100)</label>
          <input 
            type="range" 
            min="0" 
            max="100"
            value={qualityScore}
            onChange={(e) => setQualityScore(parseInt(e.target.value))}
            className="w-full mt-2"
          />
          <div className="text-center">
            <span className="text-3xl font-bold font-heading">{qualityScore}%</span>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2 font-body">Deadline</label>
          <input 
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 font-body">Submission Date</label>
          <input 
            type="date"
            value={submissionDate}
            onChange={(e) => setSubmissionDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-body"
          />
        </div>
      </div>

      {/* On-Time Indicator (auto-calculated) */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <div className="flex items-center justify-between gap-2">
          <div>
            {isOnTime ? (
              <span className="text-[#1DB954] font-bold text-lg font-heading">✅ ON TIME</span>
            ) : (
              <span className="text-[#E50914] font-bold text-lg font-heading">❌ LATE</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={useManualOnTime}
              onChange={(e) => setUseManualOnTime(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm font-body">Manual override</label>
            {useManualOnTime && (
              <input 
                type="checkbox"
                checked={isOnTimeOverride}
                onChange={(e) => setIsOnTimeOverride(e.target.checked)}
                className="w-4 h-4 ml-2"
              />
            )}
          </div>
        </div>
      </div>

      {/* Live Score Preview */}
      {selectedClient && (
        <div className="mb-6 p-6 bg-black text-white rounded-lg">
          <h3 className="text-sm uppercase mb-4 font-heading">Updated Scores Preview</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs uppercase mb-1 font-body">Speed Score</div>
              <div className={`text-4xl font-bold font-heading ${getSpeedColor(newSpeedScore)}`}>
                {newSpeedScore}%
              </div>
              <div className="text-xs mt-1 text-gray-400 font-body">
                {newOnTimeCompleted}/{newOnTimeTotal} on-time
              </div>
            </div>
            
            <div>
              <div className="text-xs uppercase mb-1 font-body">Quality Average</div>
              <div className={`text-4xl font-bold font-heading ${getQualityColor(newQualityAverage)}`}>
                {newQualityAverage}%
              </div>
              {qualityTrend && (
                <div className="text-sm mt-1 font-body">{qualityTrend}</div>
              )}
            </div>
            
            <div>
              <div className="text-xs uppercase mb-1 font-body">Combined Score</div>
              <div className="text-4xl font-bold font-heading">
                {newCombinedScore.toFixed(1)}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-sm font-body">
              Predicted Rank: <span className="text-2xl font-bold font-heading">#{predictedRank}</span> of {clients.length}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.type === 'success' 
            ? 'bg-[#1DB954] text-white' 
            : 'bg-[#E50914] text-white'
        }`}>
          <p className="font-body">{message.text}</p>
        </div>
      )}

      {/* Submit Button */}
      <button 
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedClient}
        className={`w-full py-3 rounded-lg font-bold font-heading mb-3 ${
          isSubmitting || !selectedClient
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
            : 'bg-[#E50914] text-white hover:bg-[#c50812]'
        }`}
      >
        {isSubmitting ? 'UPDATING...' : 'UPDATE SCORES & RECALCULATE RANKS'}
      </button>

      {/* Fix All Ranks Button (for Bug #2 - Multiple Rank #1) */}
      <button 
        onClick={async () => {
          if (confirm('This will recalculate ALL client ranks based on current scores. Continue?')) {
            setIsSubmitting(true);
            try {
              console.log('🔧 Manual rank recalculation triggered...');
              await recalculateAllRanks();
              setMessage({ 
                type: 'success', 
                text: '✅ All ranks recalculated successfully! Check the leaderboard.' 
              });
              if (onScoreUpdate) {
                await onScoreUpdate();
              }
              setTimeout(() => setMessage(null), 5000);
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              setMessage({ 
                type: 'error', 
                text: `❌ Failed to recalculate ranks: ${errorMessage}` 
              });
            } finally {
              setIsSubmitting(false);
            }
          }
        }}
        disabled={isSubmitting}
        className={`w-full py-2 rounded-lg font-bold font-heading text-sm ${
          isSubmitting
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
            : 'bg-[#999999] text-white hover:bg-gray-700'
        }`}
      >
        🔧 FIX ALL RANKS NOW (Manual Recalculation)
      </button>
    </div>
  );
}

