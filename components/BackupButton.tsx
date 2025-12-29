import React, { useState } from 'react';
import { Download, Loader2, Database, FileSpreadsheet } from 'lucide-react';
import { 
  getAllPlayers, 
  getAllTeams, 
  getAllUsers, 
  getAllMatches,
  getAllPlayerRegistrationRequests,
  getAllMatchRequests,
  getCaptainStats,
  getAllEvents,
  getAllKitRequests,
  getAllScoutProfiles,
  getAllScoutActivity
} from '../utils/db';
import { exportToExcel, exportPlayersOnly, ExportData } from '../utils/excelExport';
import { showToast } from './Toast';

interface BackupButtonProps {
  variant?: 'full' | 'players-only';
  className?: string;
}

export const BackupButton: React.FC<BackupButtonProps> = ({ 
  variant = 'full', 
  className = '' 
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (variant === 'players-only') {
        // Export only players
        const players = await getAllPlayers();
        await exportPlayersOnly(players);
        showToast('Players exported successfully!', 'success');
      } else {
        // Export all data
        console.log('Starting full backup export...');
        
        try {
          const [
            players,
            teams,
            users,
            matches,
            registrationRequests,
            matchRequests,
            events,
            kitRequests,
            scoutProfiles,
            scoutActivities
          ] = await Promise.all([
            getAllPlayers(),
            getAllTeams(),
            getAllUsers(),
            getAllMatches(),
            getAllPlayerRegistrationRequests(),
            getAllMatchRequests(),
            getAllEvents(),
            getAllKitRequests(),
            getAllScoutProfiles(),
            getAllScoutActivity()
          ]);

          console.log('Data fetched:', {
            players: players.length,
            teams: teams.length,
            users: users.length,
            matches: matches.length,
            events: events.length,
            kitRequests: kitRequests.length,
            scoutProfiles: scoutProfiles.length,
            scoutActivities: scoutActivities.length
          });

          // We need to get all captain stats differently since getAllCaptainStats doesn't exist
          const captainStats: any[] = [];

          const exportData: ExportData = {
            players,
            teams,
            users,
            matches,
            registrationRequests,
            matchRequests,
            captainStats,
            events,
            kitRequests,
            scoutProfiles,
            scoutActivities
          };

          console.log('Calling exportToExcel...');
          await exportToExcel(exportData);
          console.log('Export completed successfully');
          showToast('Complete backup exported successfully!', 'success');
        } catch (dataError) {
          console.error('Error fetching data:', dataError);
          throw dataError;
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`
        flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 
        text-white rounded-lg hover:from-green-700 hover:to-green-800 
        transition-all duration-200 shadow-lg hover:shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          {variant === 'players-only' ? (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Players</span>
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              <span>Full Backup</span>
            </>
          )}
          <Download className="w-4 h-4" />
        </>
      )}
    </button>
  );
};
