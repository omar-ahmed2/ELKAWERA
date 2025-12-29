import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  Player, 
  Team, 
  User, 
  Match, 
  PlayerRegistrationRequest, 
  MatchRequest,
  CaptainStats,
  Event,
  KitRequest,
  ScoutProfile,
  ScoutActivity
} from '../types';

export interface ExportData {
  players: Player[];
  teams: Team[];
  users: User[];
  matches: Match[];
  registrationRequests: PlayerRegistrationRequest[];
  matchRequests: MatchRequest[];
  captainStats: CaptainStats[];
  events: Event[];
  kitRequests: KitRequest[];
  scoutProfiles: ScoutProfile[];
  scoutActivities: ScoutActivity[];
}

export const exportToExcel = async (data: ExportData) => {
  try {
    console.log('Starting Excel export process...');
    
    // Helper function to truncate text to avoid Excel limits
    const truncateText = (text: any, maxLength: number = 1000): string => {
      if (!text) return '';
      const str = String(text);
      return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    };
    
    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // 1. Players Sheet
    console.log('Creating Players sheet...');
    const playersData = data.players.map(player => ({
    'ID': truncateText(player.id),
    'Name': truncateText(player.name),
    'Age': player.age,
    'Height (cm)': player.height,
    'Weight (kg)': player.weight,
    'Position': truncateText(player.position),
    'Country': truncateText(player.country),
    'Team ID': truncateText(player.teamId) || 'N/A',
    'Card Type': truncateText(player.cardType),
    'Overall Score': player.overallScore,
    'Goals': player.goals,
    'Assists': player.assists,
    'Defensive Contributions': player.defensiveContributions,
    'Clean Sheets': player.cleanSheets,
    'Penalty Saves': player.penaltySaves,
    'Saves': player.saves,
    'Own Goals': player.ownGoals,
    'Goals Conceded': player.goalsConceded,
    'Penalty Missed': player.penaltyMissed,
    'Matches Played': player.matchesPlayed,
    'Likes': player.likes || 0,
    'Created At': new Date(player.createdAt).toLocaleDateString(),
    'Updated At': new Date(player.updatedAt).toLocaleDateString()
  }));
  const wsPlayers = XLSX.utils.json_to_sheet(playersData);
  XLSX.utils.book_append_sheet(wb, wsPlayers, 'Players');

  // 2. Teams Sheet
  console.log('Creating Teams sheet...');
  const teamsData = data.teams.map(team => ({
    'ID': truncateText(team.id),
    'Name': truncateText(team.name),
    'Short Name': truncateText(team.shortName),
    'Color': truncateText(team.color),
    'Captain ID': truncateText(team.captainId),
    'Captain Name': truncateText(team.captainName),
    'Experience Points': team.experiencePoints,
    'Ranking': team.ranking,
    'Wins': team.wins,
    'Draws': team.draws,
    'Losses': team.losses,
    'Total Matches': team.totalMatches,
    'Win Rate': team.totalMatches > 0 ? ((team.wins / team.totalMatches) * 100).toFixed(1) + '%' : '0%',
    'Created At': new Date(team.createdAt).toLocaleDateString()
  }));
  const wsTeams = XLSX.utils.json_to_sheet(teamsData);
  XLSX.utils.book_append_sheet(wb, wsTeams, 'Teams');

  // 3. Users Sheet
  console.log('Creating Users sheet...');
  const usersData = data.users.map(user => ({
    'ID': truncateText(user.id),
    'Name': truncateText(user.name),
    'Email': truncateText(user.email),
    'Phone': truncateText(user.phone) || 'N/A',
    'Role': truncateText(user.role),
    'Country': truncateText(user.country) || 'N/A',
    'Age': user.age || 'N/A',
    'Height (cm)': user.height || 'N/A',
    'Weight (kg)': user.weight || 'N/A',
    'Strong Foot': truncateText(user.strongFoot) || 'N/A',
    'Position': truncateText(user.position) || 'N/A',
    'Player Card ID': truncateText(user.playerCardId) || 'N/A',
    'Notifications': user.notifications?.length || 0,
    'Created At': new Date(user.createdAt).toLocaleDateString()
  }));
  const wsUsers = XLSX.utils.json_to_sheet(usersData);
  XLSX.utils.book_append_sheet(wb, wsUsers, 'Users');

  // 4. Matches Sheet
  console.log('Creating Matches sheet...');
  const matchesData = data.matches.map(match => ({
    'ID': truncateText(match.id),
    'Home Team ID': truncateText(match.homeTeamId),
    'Away Team ID': truncateText(match.awayTeamId),
    'Home Score': match.homeScore,
    'Away Score': match.awayScore,
    'Status': truncateText(match.status),
    'Man of the Match': truncateText(match.manOfTheMatch) || 'N/A',
    'Events Count': match.events.length,
    'Is External': match.isExternal ? 'Yes' : 'No',
    'Created By': truncateText(match.createdBy),
    'Event ID': truncateText(match.eventId) || 'N/A',
    'Created At': new Date(match.createdAt).toLocaleDateString(),
    'Started At': match.startedAt ? new Date(match.startedAt).toLocaleDateString() : 'N/A',
    'Finished At': match.finishedAt ? new Date(match.finishedAt).toLocaleDateString() : 'N/A'
  }));
  const wsMatches = XLSX.utils.json_to_sheet(matchesData);
  XLSX.utils.book_append_sheet(wb, wsMatches, 'Matches');

  // 5. Registration Requests Sheet
  console.log('Creating Registration Requests sheet...');
  const registrationData = data.registrationRequests.map(request => ({
    'ID': truncateText(request.id),
    'User ID': truncateText(request.userId),
    'Name': truncateText(request.name),
    'Email': truncateText(request.email),
    'Phone': truncateText(request.phone) || 'N/A',
    'Age': request.age,
    'Height (cm)': request.height,
    'Weight (kg)': request.weight,
    'Strong Foot': truncateText(request.strongFoot),
    'Position': truncateText(request.position),
    'Status': truncateText(request.status),
    'Created At': new Date(request.createdAt).toLocaleDateString()
  }));
  const wsRegistrations = XLSX.utils.json_to_sheet(registrationData);
  XLSX.utils.book_append_sheet(wb, wsRegistrations, 'Registration Requests');

  // 6. Match Requests Sheet
  console.log('Creating Match Requests sheet...');
  const matchRequestsData = data.matchRequests.map(request => ({
    'ID': truncateText(request.id),
    'Match ID': truncateText(request.matchId),
    'Requested By': truncateText(request.requestedBy),
    'Requested By Name': truncateText(request.requestedByName),
    'Home Team ID': truncateText(request.homeTeamId),
    'Home Team Name': truncateText(request.homeTeamName),
    'Away Team ID': truncateText(request.awayTeamId),
    'Away Team Name': truncateText(request.awayTeamName),
    'Proposed Date': request.proposedDate ? new Date(request.proposedDate).toLocaleDateString() : 'N/A',
    'Status': truncateText(request.status),
    'Reviewed By': truncateText(request.reviewedBy) || 'N/A',
    'Reviewed At': request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A',
    'Opponent Approved': request.opponentApproved ? 'Yes' : 'No',
    'Opponent Approved At': request.opponentApprovedAt ? new Date(request.opponentApprovedAt).toLocaleDateString() : 'N/A',
    'Rejection Reason': truncateText(request.rejectionReason) || 'N/A',
    'Created At': new Date(request.createdAt).toLocaleDateString()
  }));
  const wsMatchRequests = XLSX.utils.json_to_sheet(matchRequestsData);
  XLSX.utils.book_append_sheet(wb, wsMatchRequests, 'Match Requests');

  // 7. Captain Stats Sheet
  console.log('Creating Captain Stats sheet...');
  const captainStatsData = data.captainStats.map(stats => ({
    'User ID': truncateText(stats.userId),
    'Matches Managed': stats.matchesManaged,
    'Wins': stats.wins,
    'Draws': stats.draws,
    'Losses': stats.losses,
    'Win Rate': stats.matchesManaged > 0 ? ((stats.wins / stats.matchesManaged) * 100).toFixed(1) + '%' : '0%',
    'Players Recruited': stats.playersRecruited,
    'Verified Matches': stats.verifiedMatches,
    'Rank': truncateText(stats.rank),
    'Rank Points': stats.rankPoints,
    'Created At': new Date(stats.createdAt).toLocaleDateString()
  }));
  const wsCaptainStats = XLSX.utils.json_to_sheet(captainStatsData);
  XLSX.utils.book_append_sheet(wb, wsCaptainStats, 'Captain Stats');

  // 8. Events Sheet
  console.log('Creating Events sheet...');
  const eventsData = data.events.map(event => ({
    'ID': truncateText(event.id),
    'Title': truncateText(event.title),
    'Description': truncateText(event.description, 500), // Longer text for descriptions
    'Date': new Date(event.date).toLocaleDateString(),
    'End Date': event.endDate ? new Date(event.endDate).toLocaleDateString() : 'N/A',
    'Location': truncateText(event.location),
    'Status': truncateText(event.status),
    'Category': truncateText(event.category),
    'Max Participants': event.maxParticipants || 'N/A',
    'Current Participants': event.participants.length,
    'Registered Teams': event.registeredTeams?.length || 0,
    'Created By': truncateText(event.createdBy),
    'Created By Name': truncateText(event.createdByName),
    'Schedule Published': event.schedulePublished ? 'Yes' : 'No',
    'Created At': new Date(event.createdAt).toLocaleDateString(),
    'Updated At': new Date(event.updatedAt).toLocaleDateString()
  }));
  const wsEvents = XLSX.utils.json_to_sheet(eventsData);
  XLSX.utils.book_append_sheet(wb, wsEvents, 'Events');

  // 9. Kit Requests Sheet
  console.log('Creating Kit Requests sheet...');
  const kitRequestsData = data.kitRequests.map(request => ({
    'ID': truncateText(request.id),
    'User ID': truncateText(request.userId),
    'User Name': truncateText(request.userName),
    'User Role': truncateText(request.userRole),
    'Team ID': truncateText(request.teamId) || 'N/A',
    'Team Name': truncateText(request.teamName) || 'N/A',
    'Type': truncateText(request.type),
    'Status': truncateText(request.status),
    'Kit ID': truncateText(request.kitId) || 'N/A',
    'Kit Name': truncateText(request.kitName) || 'N/A',
    'Selected Size': truncateText(request.selectedSize) || 'N/A',
    'Quantity': request.quantity,
    'Custom Image URL': truncateText(request.customImageUrl) || 'N/A',
    'Notes': truncateText(request.notes, 500) || 'N/A',
    'Contact Email': truncateText(request.contactEmail),
    'Contact Phone': truncateText(request.contactPhone),
    'Admin Notes': truncateText(request.adminNotes, 500) || 'N/A',
    'Created At': new Date(request.createdAt).toLocaleDateString(),
    'Updated At': new Date(request.updatedAt).toLocaleDateString()
  }));
  const wsKitRequests = XLSX.utils.json_to_sheet(kitRequestsData);
  XLSX.utils.book_append_sheet(wb, wsKitRequests, 'Kit Requests');

  // 10. Scout Profiles Sheet
  console.log('Creating Scout Profiles sheet...');
  const scoutProfilesData = data.scoutProfiles.map(profile => ({
    'User ID': truncateText(profile.userId),
    'Phone': truncateText(profile.phone) || 'N/A',
    'Scout Type': truncateText(profile.scoutType),
    'Organization': truncateText(profile.organization) || 'N/A',
    'Total Profiles Viewed': profile.totalProfilesViewed,
    'Total Players Viewed': profile.totalPlayersViewed,
    'Total Teams Viewed': profile.totalTeamsViewed,
    'Created At': new Date(profile.createdAt).toLocaleDateString(),
    'Last Active': new Date(profile.lastActive).toLocaleDateString()
  }));
  const wsScoutProfiles = XLSX.utils.json_to_sheet(scoutProfilesData);
  XLSX.utils.book_append_sheet(wb, wsScoutProfiles, 'Scout Profiles');

  // 11. Scout Activities Sheet
  console.log('Creating Scout Activities sheet...');
  const scoutActivitiesData = data.scoutActivities.map(activity => ({
    'ID': truncateText(activity.id),
    'Scout ID': truncateText(activity.scoutId),
    'Scout Name': truncateText(activity.scoutName),
    'Action Type': truncateText(activity.actionType),
    'Entity ID': truncateText(activity.entityId),
    'Entity Name': truncateText(activity.entityName),
    'Entity Type': truncateText(activity.entityType),
    'Timestamp': new Date(activity.timestamp).toLocaleDateString(),
    'User Agent': truncateText(activity.userAgent) || 'N/A'
  }));
  const wsScoutActivities = XLSX.utils.json_to_sheet(scoutActivitiesData);
  XLSX.utils.book_append_sheet(wb, wsScoutActivities, 'Scout Activities');

  // Create Summary Sheet
  console.log('Creating Summary sheet...');
  const summaryData = [
    { 'Metric': 'Total Players', 'Count': data.players.length, 'Details': `${data.players.filter(p => p.teamId).length} in teams` },
    { 'Metric': 'Total Teams', 'Count': data.teams.length, 'Details': `${data.teams.reduce((sum, t) => sum + t.totalMatches, 0)} total matches` },
    { 'Metric': 'Total Users', 'Count': data.users.length, 'Details': `${data.users.filter(u => u.role === 'admin').length} admins, ${data.users.filter(u => u.role === 'captain').length} captains` },
    { 'Metric': 'Total Matches', 'Count': data.matches.length, 'Details': `${data.matches.filter(m => m.status === 'finished').length} completed` },
    { 'Metric': 'Pending Registrations', 'Count': data.registrationRequests.filter(r => r.status === 'pending').length, 'Details': `${data.registrationRequests.filter(r => r.status === 'approved').length} approved` },
    { 'Metric': 'Match Requests', 'Count': data.matchRequests.length, 'Details': `${data.matchRequests.filter(r => r.status === 'pending_admin').length} pending admin` },
    { 'Metric': 'Total Events', 'Count': data.events.length, 'Details': `${data.events.filter(e => e.status === 'upcoming').length} upcoming` },
    { 'Metric': 'Kit Requests', 'Count': data.kitRequests.length, 'Details': `${data.kitRequests.filter(r => r.status === 'pending').length} pending` },
    { 'Metric': 'Scout Profiles', 'Count': data.scoutProfiles.length, 'Details': `${data.scoutProfiles.filter(s => s.scoutType === 'Club').length} club scouts` },
    { 'Metric': 'Scout Activities', 'Count': data.scoutActivities.length, 'Details': 'Total tracking activities' }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Apply advanced styling to all sheets
  console.log('Applying advanced styling to sheets...');
  const sheets = ['Players', 'Teams', 'Users', 'Matches', 'Registration Requests', 'Match Requests', 'Captain Stats', 'Events', 'Kit Requests', 'Scout Profiles', 'Scout Activities', 'Summary'];
  
  // Color schemes for different sheet types
  const colorSchemes = {
    'Players': { header: '1E88E5', alternate1: 'E3F2FD', alternate2: 'BBDEFB' },
    'Teams': { header: '43A047', alternate1: 'E8F5E8', alternate2: 'C8E6C9' },
    'Users': { header: '8E24AA', alternate1: 'F3E5F5', alternate2: 'E1BEE7' },
    'Matches': { header: 'FB8C00', alternate1: 'FFF3E0', alternate2: 'FFE0B2' },
    'Registration Requests': { header: 'D32F2F', alternate1: 'FFEBEE', alternate2: 'FFCDD2' },
    'Match Requests': { header: '7B1FA2', alternate1: 'F3E5F5', alternate2: 'E1BEE7' },
    'Captain Stats': { header: '1976D2', alternate1: 'E3F2FD', alternate2: 'BBDEFB' },
    'Events': { header: '388E3C', alternate1: 'E8F5E8', alternate2: 'C8E6C9' },
    'Kit Requests': { header: 'F57C00', alternate1: 'FFF3E0', alternate2: 'FFE0B2' },
    'Scout Profiles': { header: '0288D1', alternate1: 'E1F5FE', alternate2: 'B3E5FC' },
    'Scout Activities': { header: '00796B', alternate1: 'E0F2F1', alternate2: 'B2DFDB' },
    'Summary': { header: '5E35B1', alternate1: 'F3E5F5', alternate2: 'E1BEE7' }
  };
  
  sheets.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    if (ws) {
      const colors = colorSchemes[sheetName as keyof typeof colorSchemes] || colorSchemes['Summary'];
      
      // Get the range of the sheet
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      
      // Style headers (first row) with advanced formatting
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { 
              bold: true, 
              color: { rgb: 'FFFFFF' },
              sz: 12,
              name: 'Calibri'
            },
            fill: { 
              fgColor: { rgb: colors.header },
              patternType: 'solid'
            },
            alignment: { 
              horizontal: 'center', 
              vertical: 'center',
              wrapText: true
            },
            border: {
              top: { style: 'thin', color: { auto: 1 } },
              bottom: { style: 'thin', color: { auto: 1 } },
              left: { style: 'thin', color: { auto: 1 } },
              right: { style: 'thin', color: { auto: 1 } }
            }
          };
        }
      }
      
      // Apply alternating row colors and borders to data rows
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const isAlternate = (row - range.s.r - 1) % 2 === 0;
        const rowColor = isAlternate ? colors.alternate1 : colors.alternate2;
        
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[cellAddress]) {
            ws[cellAddress].s = {
              fill: { 
                fgColor: { rgb: rowColor },
                patternType: 'solid'
              },
              font: { 
                color: { rgb: '212121' },
                sz: 11,
                name: 'Calibri'
              },
              alignment: { 
                vertical: 'center',
                wrapText: true
              },
              border: {
                top: { style: 'thin', color: { rgb: 'E0E0E0' } },
                bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
                left: { style: 'thin', color: { rgb: 'E0E0E0' } },
                right: { style: 'thin', color: { rgb: 'E0E0E0' } }
              }
            };
          }
        }
      }
      
      // Set optimal column widths based on content
      const colWidths = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        // Calculate optimal width based on header and sample data
        let maxWidth = 15; // minimum width
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[headerCell] && ws[headerCell].v) {
          maxWidth = Math.max(maxWidth, String(ws[headerCell].v).length + 2);
        }
        
        // Check a few data rows to determine width
        for (let row = 1; row <= Math.min(5, range.e.r); row++) {
          const dataCell = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[dataCell] && ws[dataCell].v) {
            maxWidth = Math.max(maxWidth, Math.min(30, String(ws[dataCell].v).length + 2));
          }
        }
        
        colWidths.push({ wch: maxWidth });
      }
      ws['!cols'] = colWidths;
      
      // Freeze header row for better navigation
      ws['!freeze'] = { ySplit: 1, xSplit: 0, topLeftCell: 'A2' };
    }
  });

  // Generate Excel file
  console.log('Generating Excel file...');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `ELKAWERA_Backup_${timestamp}.xlsx`;
  
  console.log('Saving file:', filename);
  // Save file
  saveAs(blob, filename);
  console.log('File saved successfully');
  } catch (error) {
    console.error('Excel export error:', error);
    throw error;
  }
};

export const exportPlayersOnly = async (players: Player[]) => {
  try {
    console.log('Starting players-only export...');
    
    // Helper function to truncate text to avoid Excel limits
    const truncateText = (text: any, maxLength: number = 1000): string => {
      if (!text) return '';
      const str = String(text);
      return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    };
    
    const wb = XLSX.utils.book_new();
    
    const playersData = players.map(player => ({
      'ID': truncateText(player.id),
      'Name': truncateText(player.name),
      'Age': player.age,
      'Height (cm)': player.height,
      'Weight (kg)': player.weight,
      'Position': truncateText(player.position),
      'Country': truncateText(player.country),
      'Team ID': truncateText(player.teamId) || 'N/A',
      'Card Type': truncateText(player.cardType),
      'Overall Score': player.overallScore,
      'Goals': player.goals,
      'Assists': player.assists,
      'Defensive Contributions': player.defensiveContributions,
      'Clean Sheets': player.cleanSheets,
      'Penalty Saves': player.penaltySaves,
      'Saves': player.saves,
      'Own Goals': player.ownGoals,
      'Goals Conceded': player.goalsConceded,
      'Penalty Missed': player.penaltyMissed,
      'Matches Played': player.matchesPlayed,
      'Likes': player.likes || 0,
      'Created At': new Date(player.createdAt).toLocaleDateString(),
      'Updated At': new Date(player.updatedAt).toLocaleDateString()
    }));
  
  const ws = XLSX.utils.json_to_sheet(playersData);
  XLSX.utils.book_append_sheet(wb, ws, 'Players');
  
  // Style headers with advanced formatting
  console.log('Applying advanced styling to Players sheet...');
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  
  // Color scheme for Players sheet
  const colors = { header: '1E88E5', alternate1: 'E3F2FD', alternate2: 'BBDEFB' };
  
  // Style headers (first row) with advanced formatting
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { 
          bold: true, 
          color: { rgb: 'FFFFFF' },
          sz: 12,
          name: 'Calibri'
        },
        fill: { 
          fgColor: { rgb: colors.header },
          patternType: 'solid'
        },
        alignment: { 
          horizontal: 'center', 
          vertical: 'center',
          wrapText: true
        },
        border: {
          top: { style: 'thin', color: { auto: 1 } },
          bottom: { style: 'thin', color: { auto: 1 } },
          left: { style: 'thin', color: { auto: 1 } },
          right: { style: 'thin', color: { auto: 1 } }
        }
      };
    }
  }
  
  // Apply alternating row colors and borders to data rows
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const isAlternate = (row - range.s.r - 1) % 2 === 0;
    const rowColor = isAlternate ? colors.alternate1 : colors.alternate2;
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          fill: { 
            fgColor: { rgb: rowColor },
            patternType: 'solid'
          },
          font: { 
            color: { rgb: '212121' },
            sz: 11,
            name: 'Calibri'
          },
          alignment: { 
            vertical: 'center',
            wrapText: true
          },
          border: {
            top: { style: 'thin', color: { rgb: 'E0E0E0' } },
            bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
            left: { style: 'thin', color: { rgb: 'E0E0E0' } },
            right: { style: 'thin', color: { rgb: 'E0E0E0' } }
          }
        };
      }
    }
  }
  
  // Set optimal column widths based on content
  const colWidths = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    // Calculate optimal width based on header and sample data
    let maxWidth = 15; // minimum width
    const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[headerCell] && ws[headerCell].v) {
      maxWidth = Math.max(maxWidth, String(ws[headerCell].v).length + 2);
    }
    
    // Check a few data rows to determine width
    for (let row = 1; row <= Math.min(5, range.e.r); row++) {
      const dataCell = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[dataCell] && ws[dataCell].v) {
        maxWidth = Math.max(maxWidth, Math.min(30, String(ws[dataCell].v).length + 2));
      }
    }
    
    colWidths.push({ wch: maxWidth });
  }
  ws['!cols'] = colWidths;
  
  // Freeze header row for better navigation
  ws['!freeze'] = { ySplit: 1, xSplit: 0, topLeftCell: 'A2' };
  
  console.log('Generating Players Excel file...');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `ELKAWERA_Players_${timestamp}.xlsx`;
  
  console.log('Saving Players file:', filename);
  saveAs(blob, filename);
  console.log('Players file saved successfully');
  } catch (error) {
    console.error('Players export error:', error);
    throw error;
  }
};
