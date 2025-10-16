'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Client } from '@/types';

// Using Client type from @/types

interface Module {
  id: string;
  module_number: number;
  module_name: string;
  description: string;
  duration_days: number;
}

interface ClientSprint {
  id: string;
  sprint_number: number;
  sprint_name: string;
  status: string;
  quality_score?: number;
  on_time: boolean;
  assigned_guru?: string;
}

interface SSDBInsight {
  id: string;
  start_insight: string;
  stop_insight: string;
  do_better_insight: string;
  priority: string;
  status: string;
  created_at: string;
}

interface EnhancedClientManagementModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClient: Client) => void;
}

export default function EnhancedClientManagementModal({
  client,
  isOpen,
  onClose,
  onSave
}: EnhancedClientManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'sprints' | 'ssdb' | 'notes'>('profile');
  const [modules, setModules] = useState<Module[]>([]);
  const [sprints, setSprints] = useState<ClientSprint[]>([]);
  const [ssdbInsights, setSsdbInsights] = useState<SSDBInsight[]>([]);
  // const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [ssdbForm, setSsdbForm] = useState({
    startInsight: '',
    stopInsight: '',
    doBetterInsight: '',
    priority: 'Medium'
  });

  const loadModules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('module_number');
      
      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  }, []);

  const loadSprints = useCallback(async () => {
    if (!client) return;
    
    try {
      const { data, error } = await supabase
        .from('client_sprints')
        .select('*')
        .eq('team_id', client.id)
        .order('sprint_number');
      
      if (error) throw error;
      setSprints(data || []);
    } catch (error) {
      console.error('Error loading sprints:', error);
    }
  }, [client]);

  const loadSSDBInsights = useCallback(async () => {
    if (!client) return;
    
    try {
      const { data, error } = await supabase
        .from('enhanced_ssdb_insights')
        .select('*')
        .eq('team_id', client.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSsdbInsights(data || []);
    } catch (error) {
      console.error('Error loading SSDB insights:', error);
    }
  }, [client]);

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        ...client,
        ceoName: client.ceoName || '',
        industryType: client.industryType || '',
        companySize: client.companySize || '',
        website: client.website || '',
        mainContact: client.mainContact || '',
        priorityLevel: client.priorityLevel || 'Medium',
        speedScore: client.speedScore || 0,
        currentModule: client.currentModule || '',
        moduleGuru: client.moduleGuru || '',
        notes: client.notes || ''
      });
    }
  }, [client]);

  // Load modules and sprints when modal opens
  useEffect(() => {
    if (isOpen && client) {
      loadModules();
      loadSprints();
      loadSSDBInsights();
    }
  }, [isOpen, client, loadModules, loadSprints, loadSSDBInsights]);

  const handleInputChange = (field: keyof Client, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!client) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          ceo_name: formData.ceoName,
          industry_type: formData.industryType,
          company_size: formData.companySize,
          website: formData.website,
          main_contact: formData.mainContact,
          priority_level: formData.priorityLevel,
          speed_score: formData.speedScore,
          current_module: formData.currentModule,
          module_guru: formData.moduleGuru,
          notes: formData.notes
        })
        .eq('id', client.id);

      if (error) throw error;

      // Update local state
      const updatedClient = { ...client, ...formData };
      onSave(updatedClient);
      
      alert('Client profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSSDB = async () => {
    if (!client || (!ssdbForm.startInsight && !ssdbForm.stopInsight && !ssdbForm.doBetterInsight)) {
      alert('Please fill at least one SSDB insight field.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('enhanced_ssdb_insights')
        .insert({
          team_id: client.id,
          start_insight: ssdbForm.startInsight || null,
          stop_insight: ssdbForm.stopInsight || null,
          do_better_insight: ssdbForm.doBetterInsight || null,
          priority: ssdbForm.priority,
          status: 'Active'
        });

      if (error) throw error;

      // Reset form and reload insights
      setSsdbForm({ startInsight: '', stopInsight: '', doBetterInsight: '', priority: 'Medium' });
      loadSSDBInsights();
      
      alert('SSDB insights saved successfully!');
    } catch (error) {
      console.error('Error saving SSDB insights:', error);
      alert('Failed to save SSDB insights. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSprintUpdate = async (sprintId: string, updates: Partial<ClientSprint>) => {
    try {
      const { error } = await supabase
        .from('client_sprints')
        .update(updates)
        .eq('id', sprintId);

      if (error) throw error;
      loadSprints();
    } catch (error) {
      console.error('Error updating sprint:', error);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white px-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black">
            MANAGE CLIENT - {client.name.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'sprints', label: 'Sprint Progress' },
            { id: 'ssdb', label: 'SSDB' },
            { id: 'notes', label: 'Notes' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'profile' | 'sprints' | 'ssdb' | 'notes')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#E50914] text-[#E50914]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  value={formData.countryCode || ''}
                  onChange={(e) => handleInputChange('countryCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="LK">Sri Lanka</option>
                  <option value="IN">India</option>
                  <option value="SG">Singapore</option>
                  <option value="MU">Mauritius</option>
                </select>
              </div>

              {/* CEO Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEO Name
                </label>
                <input
                  type="text"
                  value={formData.ceoName || ''}
                  onChange={(e) => handleInputChange('ceoName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Industry Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry Type
                </label>
                <input
                  type="text"
                  value={formData.industryType || ''}
                  onChange={(e) => handleInputChange('industryType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select
                  value={formData.companySize || ''}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Size</option>
                  <option value="Small (1-50 employees)">Small (1-50 employees)</option>
                  <option value="Medium (50-200 employees)">Medium (50-200 employees)</option>
                  <option value="Large (200+ employees)">Large (200+ employees)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || ''}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ON_TIME">On Time (Green)</option>
                  <option value="DELAYED">Delayed (Red)</option>
                  <option value="GRADUATED">Graduated</option>
                  <option value="PROGRESS_MEETING">Progress Meeting</option>
                  <option value="STARTING_SOON">Starting Soon</option>
                </select>
              </div>

              {/* Priority Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={formData.priorityLevel || 'Medium'}
                  onChange={(e) => handleInputChange('priorityLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Speed Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Speed Score
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.speedScore || 0}
                  onChange={(e) => handleInputChange('speedScore', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quality Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Score
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.qualityScore || 0}
                  onChange={(e) => handleInputChange('qualityScore', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Current Module */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Module
                </label>
                <select
                  value={formData.currentModule || ''}
                  onChange={(e) => handleInputChange('currentModule', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Module</option>
                  {modules.map((module) => (
                    <option key={module.id} value={`${module.module_number} - ${module.module_name}`}>
                      {module.module_number} - {module.module_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Module Guru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned GURU
                </label>
                <input
                  type="text"
                  value={formData.moduleGuru || ''}
                  onChange={(e) => handleInputChange('moduleGuru', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Main Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Contact
                </label>
                <input
                  type="email"
                  value={formData.mainContact || ''}
                  onChange={(e) => handleInputChange('mainContact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional notes about this client..."
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        )}

        {/* SSDB Tab */}
        {activeTab === 'ssdb' && (
          <div className="space-y-6">
            {/* Add New SSDB Insight */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Add New SSDB Insight</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start
                  </label>
                  <textarea
                    value={ssdbForm.startInsight}
                    onChange={(e) => setSsdbForm(prev => ({ ...prev, startInsight: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What should the client start doing?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stop
                  </label>
                  <textarea
                    value={ssdbForm.stopInsight}
                    onChange={(e) => setSsdbForm(prev => ({ ...prev, stopInsight: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What should the client stop doing?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Do Better
                  </label>
                  <textarea
                    value={ssdbForm.doBetterInsight}
                    onChange={(e) => setSsdbForm(prev => ({ ...prev, doBetterInsight: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How can the client do better?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={ssdbForm.priority}
                    onChange={(e) => setSsdbForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleSaveSSDB}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? 'Saving...' : 'Save SSDB Insight'}
              </Button>
            </div>

            {/* Existing SSDB Insights */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Previous SSDB Insights</h3>
              {ssdbInsights.length === 0 ? (
                <p className="text-gray-500">No SSDB insights yet.</p>
              ) : (
                <div className="space-y-4">
                  {ssdbInsights.map((insight) => (
                    <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          insight.priority === 'High' ? 'bg-red-100 text-red-800' :
                          insight.priority === 'Medium' ? 'bg-gray-200 text-gray-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {insight.priority}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(insight.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {insight.start_insight && (
                        <div className="mb-2">
                          <strong className="text-green-600">Start:</strong>
                          <p className="text-gray-700">{insight.start_insight}</p>
                        </div>
                      )}
                      
                      {insight.stop_insight && (
                        <div className="mb-2">
                          <strong className="text-red-600">Stop:</strong>
                          <p className="text-gray-700">{insight.stop_insight}</p>
                        </div>
                      )}
                      
                      {insight.do_better_insight && (
                        <div>
                          <strong className="text-blue-600">Do Better:</strong>
                          <p className="text-gray-700">{insight.do_better_insight}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sprint Progress Tab */}
        {activeTab === 'sprints' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sprint Progress</h3>
            {sprints.length === 0 ? (
              <p className="text-gray-500">No sprints found for this client.</p>
            ) : (
              <div className="space-y-3">
                {sprints.map((sprint) => (
                  <div key={sprint.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Sprint {sprint.sprint_number}: {sprint.sprint_name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        sprint.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        sprint.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        sprint.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sprint.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quality Score
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={sprint.quality_score || 0}
                          onChange={(e) => handleSprintUpdate(sprint.id, { 
                            quality_score: parseInt(e.target.value) || 0 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={sprint.status}
                          onChange={(e) => handleSprintUpdate(sprint.id, { status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Delayed">Delayed</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assigned GURU
                        </label>
                        <input
                          type="text"
                          value={sprint.assigned_guru || ''}
                          onChange={(e) => handleSprintUpdate(sprint.id, { 
                            assigned_guru: e.target.value 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client Notes</h3>
            <p className="text-gray-500">Notes functionality will be implemented in the next phase.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6 py-2"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
