'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Client } from '@/types';
import { format } from 'date-fns';
import { CheckCircle, X } from 'lucide-react';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

// Hardcoded sprint names array
const SPRINT_NAMES = [
  "Business Model Canvas",
  "Customer Discovery", 
  "Value Proposition Design",
  "Market Analysis",
  "Competitive Landscape",
  "Product-Market Fit",
  "Go-to-Market Strategy",
  "Revenue Model",
  "Unit Economics",
  "Financial Projections",
  "Pitch Deck Development",
  "Product Portfolio Assessment",
  "Value Proposition Testing",
  "Customer Validation",
  "Sales Strategy",
  "Marketing Strategy",
  "Brand Identity",
  "Digital Marketing",
  "Growth Hacking",
  "Metrics & KPIs",
  "Team Building",
  "Organizational Design",
  "Operations Planning",
  "Legal & Compliance",
  "Funding Strategy",
  "Investor Relations",
  "Scale Strategy",
  "International Expansion",
  "Exit Strategy",
  "Final Presentation"
];

export default function ClientDetailModal({ client, isOpen, onClose }: ClientDetailModalProps) {
  if (!client) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "In Progress";
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return "In Progress";
    }
  };

  const getSprintStatus = (sprintNumber: number) => {
    if (client.completedSprints.includes(sprintNumber)) {
      return 'completed';
    } else if (sprintNumber === client.currentSprint.number) {
      return 'current';
    } else {
      return 'not-started';
    }
  };

  const getSprintStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'current':
        return 'bg-amber-500 text-black border-2 border-black font-bold';
      case 'not-started':
        return 'bg-gray-200 text-gray-500';
      default:
        return 'bg-gray-200 text-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        {/* Section 1: Client Header */}
        <DialogHeader className="bg-black text-white p-6 -m-6 mb-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <DialogTitle className="text-4xl font-heading text-white">
            {client.name}
          </DialogTitle>
        </DialogHeader>

        {/* Section 2: Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Start Date */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-body mb-2">
              START DATE
            </div>
            <div className="text-2xl font-heading text-black">
              {formatDate(client.startDate)}
            </div>
          </div>

          {/* Graduation Date */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-body mb-2">
              GRADUATION DATE
            </div>
            <div className="text-2xl font-heading text-black">
              {formatDate(client.graduationDate)}
            </div>
          </div>

          {/* Days in Delay */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-body mb-2">
              DAYS IN DELAY
            </div>
            <div className="text-2xl font-heading text-black">
              {client.daysInDelay || 0}
            </div>
          </div>

          {/* Program Champion */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-body mb-2">
              PROGRAM CHAMPION
            </div>
            <div className="text-2xl font-heading text-black">
              {client.programChampion || "Not Assigned"}
            </div>
          </div>

          {/* Current Guru */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-body mb-2">
              CURRENT GURU
            </div>
            <div className="text-2xl font-heading text-black">
              {client.currentGuru || "Not Assigned"}
            </div>
          </div>
        </div>

        {/* Section 3: Sprint Progress */}
        <div className="mb-8">
          <h3 className="text-2xl font-heading text-black mb-6">
            SPRINT PROGRESS
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {SPRINT_NAMES.map((sprintName, index) => {
              const sprintNumber = index + 1;
              const status = getSprintStatus(sprintNumber);
              const isCompleted = status === 'completed';
              const isCurrent = status === 'current';
              
              return (
                <div
                  key={sprintNumber}
                  className={`p-4 rounded-lg transition-all duration-200 ${getSprintStatusStyles(status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-white" />
                      )}
                      <div>
                        <div className="font-heading text-lg">
                          Sprint {sprintNumber}: {sprintName}
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="text-sm font-bold font-heading">
                        CURRENT
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Modal Footer */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            className="bg-black text-white hover:bg-gray-800 font-heading px-8 py-2"
          >
            CLOSE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
