import { Client } from '@/types';
import { differenceInDays, format } from 'date-fns';

interface ExecutiveSummaryProps {
  client: Client;
}

export default function ExecutiveSummary({ client }: ExecutiveSummaryProps) {
  // Calculate on-time percentage
  const onTimePercentage = client.onTimeDelivery.total > 0 
    ? Math.round((client.onTimeDelivery.completed / client.onTimeDelivery.total) * 100)
    : 0;

  // Calculate quality average
  const qualityAverage = client.qualityScores.length > 0
    ? Math.round(client.qualityScores.reduce((sum, score) => sum + score, 0) / client.qualityScores.length)
    : 0;

  // Calculate days ahead/behind for current sprint
  const currentDeadline = new Date(client.sprintDeadline);
  const today = new Date();
  const daysDifference = differenceInDays(currentDeadline, today);
  
  // Determine status colors
  const getStatusColor = (status: string) => {
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
  };

  const getOnTimeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getQualityColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 65) return 'text-amber-500';
    return 'text-red-500';
  };

  const getSprintStatusColor = (days: number) => {
    if (days > 0) return 'text-green-500';
    if (days === 0) return 'text-white';
    return 'text-red-500';
  };

  const getSprintStatusText = (days: number) => {
    if (days > 0) return `${days} days ahead of schedule`;
    if (days === 0) return 'Due today';
    return `${Math.abs(days)} days behind schedule`;
  };

  return (
    <div className="bg-black text-white w-full">
      {/* Header Section */}
      <div className="border-b border-white">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold font-heading">
            {client.name} — WEEK {client.weekNumber} OF 30
          </h1>
        </div>
      </div>

      {/* Status and Rank Section */}
      <div className="border-b border-white">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm uppercase tracking-wide font-body">YOUR STATUS:</span>
            <span className={`px-3 py-1 rounded text-base font-bold text-white ${getStatusColor(client.status)}`}>
              {client.status.replace('_', ' ')}
            </span>
          </div>
          <div className="text-sm">
            <span className="uppercase tracking-wide font-body">LEADERBOARD RANK:</span>
            <span className="ml-2 font-bold font-heading">{client.rank} of {client.totalClients}</span>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="border-b border-white">
        <div className="px-6 py-6">
          <div className="grid grid-cols-2 gap-12">
            {/* On-Time Delivery */}
            <div>
              <div className="text-xs uppercase tracking-wide mb-2 font-body">ON-TIME DELIVERY</div>
              <div className="text-5xl font-bold mb-1 font-heading">
                {client.onTimeDelivery.completed} of {client.onTimeDelivery.total}
              </div>
              <div className={`text-sm font-body ${getOnTimeColor(onTimePercentage)}`}>
                ({onTimePercentage}% hit rate)
              </div>
            </div>

            {/* Quality Integration */}
            <div>
              <div className="text-xs uppercase tracking-wide mb-2 font-body">QUALITY INTEGRATION</div>
              <div className={`text-5xl font-bold mb-1 font-heading ${getQualityColor(qualityAverage)}`}>
                {qualityAverage}%
              </div>
              <div className="text-sm text-gray-300 font-body">
                (Target: 80%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Sprint Section */}
      <div className="border-b border-white">
        <div className="px-6 py-4">
          <div className="text-sm uppercase tracking-wide mb-2 font-body">CURRENT SPRINT:</div>
          <div className="text-sm mb-1 font-heading">
            Sprint {client.currentSprint.number} — {client.currentSprint.name}
          </div>
          <div className="text-sm mb-1 font-body">
            DUE: {format(currentDeadline, 'EEEE MMM d, yyyy')}
          </div>
          <div className={`text-sm font-medium font-body ${getSprintStatusColor(daysDifference)}`}>
            STATUS: {getSprintStatusText(daysDifference)}
          </div>
        </div>
      </div>

      {/* Next Sprint Section */}
      <div>
        <div className="px-6 py-4">
          <div className="text-sm uppercase tracking-wide mb-2 font-body">NEXT SPRINT:</div>
          <div className="text-sm font-heading">
            Sprint {client.nextSprint.number} — {client.nextSprint.name} (releases {format(new Date(client.nextSprintRelease), 'MMM d')})
          </div>
        </div>
      </div>
    </div>
  );
}
