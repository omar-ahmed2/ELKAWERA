import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en';
type Theme = 'dark';

interface SettingsContextType {
    language: Language;
    theme: Theme;
    snowEffect: boolean;
    setLanguage: (lang: Language) => void;
    setTheme: (theme: Theme) => void;
    setSnowEffect: (enabled: boolean) => void;
    t: (key: string) => string;
    dir: 'ltr';
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
    en: {
        'settings.title': 'Settings',
        'settings.subtitle': 'Manage your preferences and account security',
        'settings.general': 'General',
        'settings.notifications': 'Notifications',
        'settings.privacy': 'Privacy & Security',
        'settings.signout': 'Sign Out',
        'settings.language': 'Language & Region',
        'settings.theme': 'Theme Preference',
        'settings.dark': 'Dark Mode',
        'settings.sound': 'Sound',
        'settings.sound.desc': 'Play sounds when clicking buttons or receiving notifications.',
        'settings.snow': 'Winter Snowfall',
        'settings.snow.desc': 'Enable or disable the cool snowfall effect across the platform.',
        'settings.save': 'Save Changes',
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.matches': 'Matches',
        'nav.teams': 'Teams',
        'nav.leaderboard': 'Leaderboard',
        'nav.profile': 'Profile',
        'nav.settings': 'Settings',
        'nav.about': 'About Us',
        'nav.contact': 'Contact Us',
        // Common
        'common.loading': 'Loading...',
        'common.search': 'Search...',
        'common.no_data': 'No data found.',
        'common.view_details': 'View Details',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.save': 'Save',
        // Landing
        'landing.hero.title_manage': 'Manage',
        'landing.hero.title_dynasty': 'Dynasty',
        'landing.hero.subtitle': 'The professional platform for tracking player evolution. Create teams, assign positions, and visualize stats progression after every match.',
        'landing.cta.create': 'Create Player',
        'landing.cta.teams': 'Manage Teams',
        'landing.cta.database': 'View Database Cards',
        'landing.feat.stats.title': 'Dynamic Stats',
        'landing.feat.stats.desc': 'Update attributes after every match to recalculate Overall Ratings.',
        'landing.feat.teams.title': 'Team Management',
        'landing.feat.teams.desc': 'Create squads, assign players, and manage multiple teams easily.',
        'landing.feat.tier.title': 'Tier System',
        'landing.feat.tier.desc': 'Evolve cards from Silver to Gold to Platinum based on performance.',
        'landing.feat.analytics.title': 'Analytics',
        'landing.feat.analytics.desc': 'Visualize growth over time and track your squad\'s progression.',
        // Vision
        'landing.vision.title': 'Our Vision',
        'landing.vision.subtitle': 'Revolutionizing Street Football Management',
        'landing.vision.desc1': 'ELKAWERA is more than just a stats tracker. It is a digital ecosystem designed to elevate street football to professional standards.',
        'landing.vision.desc2': 'Our mission is to provide every player, captain, and scout with the tools they need to showcase talent and manage competition seamlessly.',
        'landing.vision.philosophy': 'Where Passion Meets Professionalism',
        // How It Works
        'landing.how.title': 'How It Works',
        'landing.how.step1.title': 'Create Your Profile',
        'landing.how.step1.desc': 'Register as a Player, Captain, or Scout to start your journey.',
        'landing.how.step2.title': 'Form Your Team',
        'landing.how.step2.desc': 'Captains can build squads and recruit players from the database.',
        'landing.how.step3.title': 'Play & Progress',
        'landing.how.step3.desc': 'Submit match results and watch your stats and card tier evolve.',
        'landing.how.step4.title': 'Get Scouted',
        'landing.how.step4.desc': 'Top performers attract scouts looking for the next legend.',
        // Extended Features
        'landing.feat.admin.title': 'Admin Control',
        'landing.feat.admin.desc': 'Validate matches, manage users, and ensure platform integrity.',
        'landing.feat.scout.title': 'Scout Discovery',
        'landing.feat.scout.desc': 'Advanced filters to find players by performance, age, and position.',
        'landing.feat.scheduling.title': 'Match Scheduling',
        'landing.feat.scheduling.desc': 'Organize matches and tournaments with automated scheduling tools.',
        'landing.feat.leaderboards.title': 'Global Rankings',
        'landing.feat.leaderboards.desc': 'Compete for the top spot in regional and global leaderboards.',
        // Card Evolution
        'landing.evolution.title': 'Player Card Evolution',
        'landing.evolution.subtitle': 'Your Performance, Your Progress',
        'landing.evolution.desc': 'Every match counts. As your skills improve, so does your card tier.',
        'landing.evolution.silver': 'Silver: The Beginning',
        'landing.evolution.gold': 'Gold: Rising Star',
        'landing.evolution.elite': 'Elite: Pro Grade',
        'landing.evolution.platinum': 'Platinum: Legend Status',
        // Team Management
        'landing.team_mgmt.title': 'Professional Team Management',
        'landing.team_mgmt.desc': 'Everything a captain needs to lead a winning dynasty. Manage lineups, track team form, and schedule challenges.',
        // Analytics
        'landing.analytics.title': 'In-Depth Analytics',
        'landing.analytics.desc': 'Beautiful visualizations of your performance over time. Heatmaps, progress charts, and performance ratios.',
        // Typewriter phrases
        'landing.hero.typewriter.1': 'Your Legacy',
        'landing.hero.typewriter.2': 'Your Future',
        'landing.hero.typewriter.3': 'Your Legend',
        'landing.hero.typewriter.4': 'Your Destiny',
        // Community
        'landing.community.title': 'Community & Competition',
        'landing.community.desc': 'Join the largest street football community. participate in events, and build your reputation.',
        // CTAs
        'landing.cta.player': 'Join as Player',
        'landing.cta.captain': 'Start as Captain',
        'landing.cta.scout': 'Register as Scout',
        'landing.cta.view_rankings': 'View Global Rankings',
        // Dashboard
        'dashboard.title': 'Squad Dashboard',
        'dashboard.subtitle': 'Manage your player cards and track performance.',
        'dashboard.my_card': 'My Player Card',
        'dashboard.welcome': 'Welcome',
        'dashboard.notification': 'Notification',
        'dashboard.created_by_admin': 'Your player card has been created by an admin.',
        'dashboard.admin_update_only': 'Only admins can update your card stats.',
        'dashboard.pending_card': 'Your Card is Pending',
        'dashboard.pending_desc': 'An admin will create your player card soon.',
        'dashboard.rejected_card': 'Request Rejected',
        'dashboard.rejected_desc': 'Your previous request was rejected. Please review your details and try again.',
        'dashboard.no_card': 'No Player Card Found',
        'dashboard.no_card_desc': 'You don\'t have a player card yet. Request one now!',
        'dashboard.create_card': 'Create Player Card',
        'dashboard.retry_card': 'Create New Card',
        'dashboard.delete_confirm_title': 'Delete Player Card?',
        'dashboard.delete_confirm_msg': 'This action cannot be undone. This player and stats will be permanently removed.',
        'dashboard.club_top_rated': 'Club Top Rated',
        'dashboard.metrics.overall': 'Overall',
        'dashboard.metrics.goals': 'Goals',
        'dashboard.metrics.matches': 'Matches',
        'dashboard.update_performance': 'Update Performance',
        'dashboard.backup_data': 'Backup Data',

        'dashboard.add_new_card': 'Add New Card',
        'dashboard.admin_team_cards': 'Admin Team Cards',
        'dashboard.match_requests': 'Match Requests to Arbitrate',
        'dashboard.ready_to_start': 'Ready to Start',
        'dashboard.lineups_submitted': 'Lineups submitted by both captains',
        'dashboard.start_match': 'Start Match',
        'dashboard.squad_composition': 'Squad Composition',
        'dashboard.total_cards': 'Total Cards',
        'dashboard.search_db': 'Search Database',
        'dashboard.filter_pos': 'Filter Position',
        'dashboard.player_cards': 'Player Cards',
        'dashboard.no_match': 'No players match your criteria.',
        'dashboard.clear_filters': 'Clear Filters',
        'dashboard.edit_card': 'Edit Card',
        'dashboard.delete_card': 'Delete',
        'dashboard.flip_instruction': 'Click Card to Flip',
        'dashboard.user_db': 'User Database',
        'dashboard.user_table.user': 'User',
        'dashboard.user_table.email': 'Email',
        'dashboard.user_table.role': 'Role',
        'dashboard.user_table.joined': 'Joined',
        'dashboard.user_table.actions': 'Actions',
        'dashboard.user_table.delete_user': 'Delete User',
        'dashboard.user_table.delete_confirm': 'Delete?',
        'dashboard.user_table.yes': 'Yes',
        'dashboard.user_table.no': 'No',
        // Leaderboard & Stats
        'leaderboard.title': 'Global Leadboard',
        'leaderboard.subtitle': 'Top performers and legendary clubs',
        'leaderboard.players_ranking': 'PLAYERS RANKING',
        'leaderboard.clubs_ranking': 'CLUBS RANKING',
        'leaderboard.no_matches': 'No matches found',
        'stats.matches': 'Matches',
        'stats.wins': 'Wins',
        'stats.losses': 'Losses',
        'stats.draws': 'Draws',
        'stats.goals': 'Goals',
        'stats.assists': 'Assists',
        'stats.defense': 'Defense',
        'stats.saves': 'Saves',
        'stats.clean_sheets': 'Clean Sheets',
        'stats.rating': 'Rating',
        'stats.overall': 'Overall',
        // Positions
        'pos.all': 'All Positions',
        'pos.cf': 'Forward',
        'pos.cb': 'Defender',
        'pos.gk': 'Goalkeeper',
        'pos.mid': 'Midfielder',
        // Teams
        'teams.title': 'Team Management',
        'teams.subtitle': 'Create and manage your squads with custom logos.',
        'teams.create_btn': 'Create Team',
        'teams.your_teams': 'Your Teams',
        'teams.other_teams': 'Other Teams',
        'teams.no_teams': 'No Teams Found',
        'teams.create_first_team': 'Create your first team to start managing your dynasty.',
        'teams.player_create_msg': 'Create your team to start playing matches.',
        'teams.link_create': 'Create Team Now',
        'teams.player_max_team_warning': 'Players can only create one team',
        'teams.edit_title': 'Edit Team Details',
        'teams.create_title': 'Create New Team',
        'teams.form.name': 'Team Name',
        'teams.form.short_name': 'Abbreviation (3 chars)',
        'teams.form.color': 'Primary Color',
        'teams.form.logo': 'Team Logo',
        'teams.form.upload_text': 'Upload PNG/JPG',
        'teams.form.change': 'Change',
        'teams.form.cancel': 'Cancel',
        'teams.form.save': 'Save Team',
        'teams.form.update': 'Update Team',
        'teams.details.back': 'Back to Teams',
        'teams.details.invite': 'Invite Player',
        'teams.details.edit': 'Edit Team',
        'teams.details.delete': 'Delete',
        'teams.details.squad_size': 'Squad Size',
        'teams.details.avg_rating': 'Avg Rating',
        'teams.details.captain': 'Captain',
        'teams.details.squad_list': 'Squad List',
        'teams.details.no_players': 'No players assigned to this team yet.',
        'teams.details.invite_link': 'Invite players to join',
        'teams.delete_confirm_title': 'Delete Team?',
        'teams.delete_confirm_msg': 'Are you sure you want to delete this team? This action cannot be undone.',
        'teams.remove_player_confirm': 'Remove Player from Team?',
        'teams.remove_player_msg': 'This player will be removed from the team and will become a free agent.',
        'teams.min_players': 'Minimum Players Required',
        'teams.max_players': 'Maximum Players Exceeded',
        'teams.min_players_msg': 'You need at least 5 players to schedule matches.',
        'teams.max_players_msg': 'Maximum 7 players allowed per team.',
        'teams.table.player': 'Player',
        'teams.table.pos': 'Pos',
        'teams.table.tier': 'Tier',
        'teams.table.age': 'Age',
        'teams.table.action': 'Action',
        'teams.card.details': 'DETAILS',
    },
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');
    const [theme] = useState<Theme>('dark');
    const [snowEffect, setSnowEffect] = useState<boolean>(true);

    useEffect(() => {
        const storedSnow = localStorage.getItem('elkawera_snow');
        if (storedSnow !== null) setSnowEffect(storedSnow === 'true');
    }, []);

    // Language is locked to English only - RTL removed
    useEffect(() => {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
        localStorage.setItem('elkawera_lang', 'en');
    }, []);

    // Theme is locked to dark mode only
    useEffect(() => {
        document.documentElement.classList.remove('light-mode');
        localStorage.setItem('elkawera_theme', 'dark');
    }, []);

    const updateSnowEffect = (enabled: boolean) => {
        setSnowEffect(enabled);
        localStorage.setItem('elkawera_snow', String(enabled));
    };

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <SettingsContext.Provider value={{
            language,
            theme,
            snowEffect,
            setLanguage: () => {}, // Locked to English
            setTheme: () => {}, // Locked to dark mode
            setSnowEffect: updateSnowEffect,
            t,
            dir: 'ltr' // Locked to LTR
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};
