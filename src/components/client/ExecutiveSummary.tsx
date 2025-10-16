import { Client } from '@/types';
import { differenceInDays, format } from 'date-fns';

interface ExecutiveSummaryProps {
  client: Client;
}

export default function ExecutiveSummary({ client }: ExecutiveSummaryProps) {
  console.log('📊 EXECUTIVE SUMMARY - Received client data:');
  console.log('  - Client name:', client?.name);
  console.log('  - onTimeDelivery.completed:', client?.onTimeDelivery?.completed);
  console.log('  - onTimeDelivery.total:', client?.onTimeDelivery?.total);
  console.log('  - qualityScores:', client?.qualityScores);
  console.log('  - completedSprints:', client?.completedSprints);
  
  // Calculate metrics
  const onTimePercentage = client.onTimeDelivery.total > 0 
    ? Math.round((client.onTimeDelivery.completed / client.onTimeDelivery.total) * 100)
    : 0;

  const qualityAverage = client.qualityScores.length > 0
    ? Math.round(client.qualityScores.reduce((sum, score) => sum + score, 0) / client.qualityScores.length)
    : 0;
  
  console.log('🧮 EXECUTIVE SUMMARY - Calculated metrics:');
  console.log(`  - On-Time: ${client.onTimeDelivery.completed} of ${client.onTimeDelivery.total} (${onTimePercentage}%)`);
  console.log(`  - Quality Average: ${qualityAverage}%`);
  console.log(`  - Quality Scores Array:`, client.qualityScores);

  // Calculate quality trend
  const getQualityTrend = () => {
    if (client.qualityScores.length < 6) return null;
    
    const last3 = client.qualityScores.slice(-3);
    const previous3 = client.qualityScores.slice(-6, -3);
    
    const last3Avg = last3.reduce((a, b) => a + b, 0) / 3;
    const previous3Avg = previous3.reduce((a, b) => a + b, 0) / 3;
    
    const difference = last3Avg - previous3Avg;
    
    if (difference > 5) return '↑ improving';
    if (difference < -5) return '↓ declining';
    return null;
  };

  const qualityTrend = getQualityTrend();

  // Calculate days ahead/behind
  const currentDeadline = new Date(client.sprintDeadline);
  const today = new Date();
  const daysDifference = differenceInDays(currentDeadline, today);
  
  // Color functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ON_TIME':
        return '#1DB954'; // Green
      case 'DELAYED':
        return '#E50914'; // Red
      default:
        return '#999999'; // Gray
    }
  };

  const getOnTimeColor = (percentage: number) => {
    if (percentage >= 80) return '#1DB954';
    if (percentage >= 60) return '#FF9500';
    return '#E50914';
  };

  const getQualityColor = (percentage: number) => {
    if (percentage >= 80) return '#1DB954';
    if (percentage >= 65) return '#FF9500';
    return '#E50914';
  };

  const getSprintStatusColor = (days: number) => {
    if (days > 0) return '#1DB954';
    if (days === 0) return '#FFFFFF';
    return '#E50914';
  };

  const getSprintStatusText = (days: number) => {
    if (days > 0) return `${days} days ahead of schedule`;
    if (days === 0) return 'Due today';
    return `${Math.abs(days)} days behind schedule`;
  };

  return (
    <div style={{
      background: '#0B0B0B',
      borderLeft: '2px solid #E50914',
      padding: '32px',
      marginBottom: '48px',
      maxWidth: '1200px',
      marginLeft: 'auto',
      marginRight: 'auto'
    }}>
      {/* Header */}
      <div style={{
        fontWeight: 700,
        fontSize: '24px',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '24px',
        borderBottom: '1px solid #212427',
        paddingBottom: '16px'
      }}
      className="font-heading">
        {client.name} — WEEK {client.weekNumber} OF 30
      </div>

      {/* Status and Rank Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '1px solid #212427'
      }}>
        <div>
          <div style={{
            fontWeight: 700,
            fontSize: '14px',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}
          className="font-heading">
            YOUR STATUS
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: getStatusColor(client.status)
          }}
          className="font-heading">
            {client.status.replace('_', ' ')}
          </div>
        </div>

        <div>
          <div style={{
            fontWeight: 700,
            fontSize: '14px',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}
          className="font-heading">
            LEADERBOARD RANK
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#FFFFFF'
          }}
          className="font-heading">
            {client.rank} of {client.totalClients}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        marginBottom: '32px'
      }}>
        {/* On-Time Delivery */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontWeight: 700,
            fontSize: '14px',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}
          className="font-heading">
            ON-TIME DELIVERY
          </div>
          <div style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: '8px'
          }}
          className="font-heading">
            {client.onTimeDelivery.completed} of {client.onTimeDelivery.total}
          </div>
          <div style={{
            fontSize: '14px',
            color: getOnTimeColor(onTimePercentage)
          }}
          className="font-body">
            ({onTimePercentage}% hit rate)
          </div>
        </div>

        {/* Quality Integration */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontWeight: 700,
            fontSize: '14px',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}
          className="font-heading">
            QUALITY INTEGRATION
          </div>
          <div style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: '8px'
          }}
          className="font-heading">
            {qualityAverage}%
          </div>
          <div style={{
            fontSize: '14px',
            color: getQualityColor(qualityAverage)
          }}
          className="font-body">
            (Target: 80%)
          </div>
          {qualityTrend && (
            <div style={{
              fontSize: '14px',
              color: '#FFFFFF',
              marginTop: '8px'
            }}
            className="font-body">
              {qualityTrend}
            </div>
          )}
        </div>
      </div>

      {/* Current Sprint Section */}
      <div style={{
        borderTop: '1px solid #212427',
        paddingTop: '24px'
      }}
      className="font-body">
        <div style={{
          fontSize: '16px',
          fontWeight: 500,
          color: '#FFFFFF',
          marginBottom: '8px'
        }}>
          CURRENT SPRINT: Sprint {client.currentSprint.number} — {client.currentSprint.name}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#FFFFFF',
          marginBottom: '4px'
        }}>
          DUE: {format(currentDeadline, 'EEEE MMM d, yyyy')}
        </div>
        <div style={{
          fontSize: '14px',
          color: getSprintStatusColor(daysDifference),
          marginBottom: '16px'
        }}>
          STATUS: {getSprintStatusText(daysDifference)}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#FFFFFF',
          paddingTop: '16px',
          borderTop: '1px solid #212427'
        }}>
          NEXT SPRINT: Sprint {client.nextSprint.number} — {client.nextSprint.name} (releases {format(new Date(client.nextSprintRelease), 'MMM d')})
        </div>
      </div>
    </div>
  );
}
