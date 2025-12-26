import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';
type Theme = 'dark' | 'light';

interface SettingsContextType {
    language: Language;
    theme: Theme;
    setLanguage: (lang: Language) => void;
    setTheme: (theme: Theme) => void;
    t: (key: string) => string;
    dir: 'ltr' | 'rtl';
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
        'settings.light': 'Light Mode',
        'settings.sound': 'Sound',
        'settings.sound.desc': 'Play sounds when clicking buttons or receiving notifications.',
        'settings.save': 'Save Changes',
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.matches': 'Matches',
        'nav.teams': 'Teams',
        'nav.leaderboard': 'Leaderboard',
        'nav.profile': 'Profile',
        'nav.settings': 'Settings',
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
        'landing.hero.title_manage': 'Manage Your',
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
    ar: {
        'settings.title': 'الإعدادات',
        'settings.subtitle': 'إدارة تفضيلاتك وأمان حسابك',
        'settings.general': 'عام',
        'settings.notifications': 'إشعارات',
        'settings.privacy': 'الخصوصية والأمان',
        'settings.signout': 'تسجيل الخروج',
        'settings.language': 'الغة والمنطقة',
        'settings.theme': 'تفضيلات المظهر',
        'settings.dark': 'الوضع الليلي',
        'settings.light': 'الوضع النهاري',
        'settings.sound': 'الصوت',
        'settings.sound.desc': 'تشغيل الأصوات عند النقر على الأزرار أو تلقي الإشعارات.',
        'settings.save': 'حفظ التغييرات',
        // Navigation
        'nav.dashboard': 'لوحة التحكم',
        'nav.matches': 'المباريات',
        'nav.teams': 'الفرق',
        'nav.leaderboard': 'لوحة المتصدرين',
        'nav.profile': 'الملف الشخصي',
        'nav.settings': 'الإعدادات',
        // Common
        'common.loading': 'جاري التحميل...',
        'common.search': 'بحث...',
        'common.no_data': 'لا توجد بيانات.',
        'common.view_details': 'عرض التفاصيل',
        'common.cancel': 'إلغاء',
        'common.confirm': 'تأكيد',
        'common.edit': 'تعديل',
        'common.delete': 'حذف',
        'common.save': 'حفظ',
        // Landing
        'landing.hero.title_manage': 'ابدأ بناء',
        'landing.hero.title_dynasty': 'مسيرتك الأسطورية',
        'landing.hero.subtitle': 'المنصة الاحترافية لمتابعة تطور اللاعبين. أنشئ الفرق، حدد المراكز، وتابع تدرج الإحصائيات بعد كل مباراة.',
        'landing.cta.create': 'إنشاء لاعب',
        'landing.cta.teams': 'إدارة الفرق',
        'landing.cta.database': 'عرض قاعدة البيانات',
        'landing.feat.stats.title': 'إحصائيات ديناميكية',
        'landing.feat.stats.desc': 'قم بتحديث الخصائص بعد كل مباراة لإعادة حساب التقييم العام.',
        'landing.feat.teams.title': 'إدارة الفرق',
        'landing.feat.teams.desc': 'أنشئ التشكيلات، عيّن اللاعبين، وأدر فرقاً متعددة بسهولة.',
        'landing.feat.tier.title': 'نظام المستويات',
        'landing.feat.tier.desc': 'طوّر البطاقات من الفضية إلى الذهبية ثم البلاتينية بناءً على الأداء.',
        'landing.feat.analytics.title': 'التحليلات',
        'landing.feat.analytics.desc': 'تصور النمو بمرور الوقت وتتبع تقدم فريقك بدقة.',
        // Vision
        'landing.vision.title': 'رؤيتنا',
        'landing.vision.subtitle': 'ثورة في إدارة كرة القدم للهواة',
        'landing.vision.desc1': 'الكورة هي أكثر من مجرد متتبع للإحصائيات. إنها نظام بيئي رقمي مصمم لرفع كرة القدم في الشوارع إلى المعايير الاحترافية.',
        'landing.vision.desc2': 'مهمتنا هي تزويد كل لاعب وقائد وكشاف بالأدوات التي يحتاجونها لإظهار الموهبة وإدارة المنافسة بسلاسة.',
        'landing.vision.philosophy': 'حيث يلتقي الشغف بالاحترافية',
        // How It Works
        'landing.how.title': 'كيف يعمل؟',
        'landing.how.step1.title': 'أنشئ ملفك الشخصي',
        'landing.how.step1.desc': 'سجل كلاعب، قائد، أو كشاف لتبدأ رحلتك.',
        'landing.how.step2.title': 'كون فريقك',
        'landing.how.step2.desc': 'يمكن للقادة بناء الفرق وتوظيف اللاعبين من قاعدة البيانات.',
        'landing.how.step3.title': 'العب وتطور',
        'landing.how.step3.desc': 'سجل نتائج المباريات وشاهد إحصائياتك ومستوى بطاقتك يتطور.',
        'landing.how.step4.title': 'كن تحت الأنظار',
        'landing.how.step4.desc': 'أهم المواهب تجذب الكشافين الذين يبحثون عن الأساطير القادمة.',
        // Extended Features
        'landing.feat.admin.title': 'تحكم الإدارة',
        'landing.feat.admin.desc': 'اعتماد المباريات، إدارة المستخدمين، وضمان نزاهة المنصة.',
        'landing.feat.scout.title': 'اكتشاف المواهب',
        'landing.feat.scout.desc': 'فلاتر متقدمة للعثور على اللاعبين حسب الأداء، العمر، والمركز.',
        'landing.feat.scheduling.title': 'جدولة المباريات',
        'landing.feat.scheduling.desc': 'تنظيم المباريات والبطولات بأدوات جدولة تلقائية.',
        'landing.feat.leaderboards.title': 'التصنيفات العالمية',
        'landing.feat.leaderboards.desc': 'نافس على الصدارة في التصنيفات الإقليمية والعالمية.',
        // Card Evolution
        'landing.evolution.title': 'تطور بطاقة اللاعب',
        'landing.evolution.subtitle': 'أداؤك، تقدمك',
        'landing.evolution.desc': 'كل مباراة لها قيمتها. مع تحسن مهاراتك، يتطور مستوى بطاقتك.',
        'landing.evolution.silver': 'الفضية: البداية',
        'landing.evolution.gold': 'الذهبية: النجم الصاعد',
        'landing.evolution.elite': 'النخبة: درجة المحترفين',
        'landing.evolution.platinum': 'البلاتينية: حالة الأسطورة',
        // Team Management
        'landing.team_mgmt.title': 'إدارة فرق احترافية',
        'landing.team_mgmt.desc': 'كل ما يحتاجه القائد لقيادة مسيرة ناجحة. أدر التشكيلات، تتبع مستوى الفريق، وجدول التحديات.',
        // Analytics
        'landing.analytics.title': 'تحليلات متعمقة',
        'landing.analytics.desc': 'تمثيلات مرئية جميلة لأدائك بمرور الوقت. خرائط حرارية، رسوم بيانية للتقدم، ونسب الأداء.',
        // Community
        'landing.community.title': 'المجتمع والمنافسة',
        'landing.community.desc': 'انضم إلى أكبر مجتمع لكرة القدم في الشوارع، شارك في الفعاليات، وابنِ سمعتك.',
        // CTAs
        'landing.cta.player': 'انضم كلاعب',
        'landing.cta.captain': 'ابدأ كقائد',
        'landing.cta.scout': 'سجل ككشاف',
        'landing.cta.view_rankings': 'عرض التصنيفات العالمية',
        // Dashboard
        'dashboard.title': 'لوحة تحكم الفريق',
        'dashboard.subtitle': 'إدارة بطاقات اللاعبين وتتبع الأداء.',
        'dashboard.my_card': 'بطاقتي',
        'dashboard.welcome': 'مرحباً',
        'dashboard.notification': 'إشعار',
        'dashboard.created_by_admin': 'تم إنشاء بطاقتك بواسطة المشرف.',
        'dashboard.admin_update_only': 'يمكن للمشرفين فقط تحديث إحصائياتك.',
        'dashboard.pending_card': 'بطاقتك قيد المراجعة',
        'dashboard.pending_desc': 'سيقوم المشرف بإنشاء بطاقتك قريباً.',
        'dashboard.rejected_card': 'تم رفض الطلب',
        'dashboard.rejected_desc': 'تم رفض طلبك السابق. يرجى مراجعة التفاصيل والمحاولة مرة أخرى.',
        'dashboard.no_card': 'لا توجد بطاقة',
        'dashboard.no_card_desc': 'ليس لديك بطاقة لاعب حتى الآن. اطلب واحدة الآن!',
        'dashboard.create_card': 'طلب بطاقة لاعب',
        'dashboard.retry_card': 'إنشاء بطاقة جديدة',
        'dashboard.delete_confirm_title': 'حذف البطاقة؟',
        'dashboard.delete_confirm_msg': 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف اللاعب وإحصائياته نهائياً.',
        'dashboard.club_top_rated': 'الأعلى تقييماً',
        'dashboard.metrics.overall': 'الإجمالي',
        'dashboard.metrics.goals': 'الأهداف',
        'dashboard.metrics.matches': 'مباريات',
        'dashboard.update_performance': 'تحديث الأداء',
        'dashboard.backup_data': 'نسخ احتياطي',

        'dashboard.add_new_card': 'إضافة بطاقة جديدة',
        'dashboard.admin_team_cards': 'بطاقات الفريق الإداري',
        'dashboard.match_requests': 'طلبات المباريات للتحكيم',
        'dashboard.ready_to_start': 'جاهزة للبدء',
        'dashboard.lineups_submitted': 'تم تقديم التشكيلات من قبل كلا القائدين',
        'dashboard.start_match': 'بدء المباراة',
        'dashboard.squad_composition': 'تكوين الفريق',
        'dashboard.total_cards': 'إجمالي البطاقات',
        'dashboard.search_db': 'بحث في قاعدة البيانات',
        'dashboard.filter_pos': 'تصفية حسب المركز',
        'dashboard.player_cards': 'بطاقات اللاعبين',
        'dashboard.no_match': 'لا يوجد لاعبين مطابقين للبحث.',
        'dashboard.clear_filters': 'مسح التصفية',
        'dashboard.edit_card': 'تعديل البطاقة',
        'dashboard.delete_card': 'حذف',
        'dashboard.flip_instruction': 'انقر على البطاقة للقلب',
        'dashboard.user_db': 'قاعدة بيانات المستخدمين',
        'dashboard.user_table.user': 'المستخدم',
        'dashboard.user_table.email': 'البريد الإلكتروني',
        'dashboard.user_table.role': 'الدور',
        'dashboard.user_table.joined': 'تاريخ الانضمام',
        'dashboard.user_table.actions': 'إجراءات',
        'dashboard.user_table.delete_user': 'حذف المستخدم',
        'dashboard.user_table.delete_confirm': 'حذف؟',
        'dashboard.user_table.yes': 'نعم',
        'dashboard.user_table.no': 'لا',
        // Leaderboard & Stats
        'leaderboard.title': 'لوحة المتصدرين',
        'leaderboard.subtitle': 'أفضل اللاعبين والفرق الأسطورية',
        'leaderboard.players_ranking': 'ترتيب اللاعبين',
        'leaderboard.clubs_ranking': 'ترتيب الفرق',
        'leaderboard.no_matches': 'لا توجد مباريات',
        'stats.matches': 'مباريات',
        'stats.wins': 'فوز',
        'stats.losses': 'خسارة',
        'stats.draws': 'تعادل',
        'stats.goals': 'أهداف',
        'stats.assists': 'تمريرات حاسمة',
        'stats.defense': 'دفاع',
        'stats.saves': 'تصديات',
        'stats.clean_sheets': 'شباك نظيفة',
        'stats.rating': 'التقييم',
        'stats.overall': 'الإجمالي',
        // Positions
        'pos.all': 'كل المراكز',
        'pos.cf': 'مهاجم',
        'pos.cb': 'مدافع',
        'pos.gk': 'حارس مرمى',
        'pos.mid': 'خط وسط',
        // Teams
        'teams.title': 'إدارة الفرق',
        'teams.subtitle': 'أنشئ وأدر فرقك بشعارات مخصصة.',
        'teams.create_btn': 'إنشاء فريق',
        'teams.your_teams': 'فرقك',
        'teams.other_teams': 'فرق أخرى',
        'teams.no_teams': 'لا توجد فرق',
        'teams.create_first_team': 'أنشئ أول فريق لك لتبدأ مسيرتك.',
        'teams.player_create_msg': 'أنشئ فريقك لتبدأ اللعب.',
        'teams.link_create': 'أنشئ فريق الآن',
        'teams.player_max_team_warning': 'يمكن للاعبين إنشاء فريق واحد فقط',
        'teams.edit_title': 'تعديل تفاصيل الفريق',
        'teams.create_title': 'إنشاء فريق جديد',
        'teams.form.name': 'اسم الفريق',
        'teams.form.short_name': 'الاختصار (3 حروف)',
        'teams.form.color': 'اللون الأساسي',
        'teams.form.logo': 'شعار الفريق',
        'teams.form.upload_text': 'رفع PNG/JPG',
        'teams.form.change': 'تغيير',
        'teams.form.cancel': 'إلغاء',
        'teams.form.save': 'حفظ الفريق',
        'teams.form.update': 'تحديث الفريق',
        'teams.details.back': 'العودة للفرق',
        'teams.details.invite': 'دعوة لاعب',
        'teams.details.edit': 'تعديل',
        'teams.details.delete': 'حذف',
        'teams.details.squad_size': 'حجم التشكيلة',
        'teams.details.avg_rating': 'متوسط التقييم',
        'teams.details.captain': 'القائد',
        'teams.details.squad_list': 'قائمة الفريق',
        'teams.details.no_players': 'لا يوجد لاعبين في هذا الفريق بعد.',
        'teams.details.invite_link': 'دعوة لاعبين للانضمام',
        'teams.delete_confirm_title': 'حذف الفريق؟',
        'teams.delete_confirm_msg': 'هل أنت متأكد من حذف هذا الفريق؟ لا يمكن التراجع عن هذا الإجراء.',
        'teams.remove_player_confirm': 'إزالة لاعب من الفريق؟',
        'teams.remove_player_msg': 'سيتم إزالة هذا اللاعب وسيصبح حراً.',
        'teams.min_players': 'الحد الأدنى للاعبين',
        'teams.max_players': 'تجاوز الحد الأقصى',
        'teams.min_players_msg': 'تحتاج إلى 5 لاعبين على الأقل لجدولة المباريات.',
        'teams.max_players_msg': 'الحد الأقصى هو 7 لاعبين لكل فريق.',
        'teams.table.player': 'اللاعب',
        'teams.table.pos': 'المركز',
        'teams.table.tier': 'المستوى',
        'teams.table.age': 'العمر',
        'teams.table.action': 'إجراء',
        'teams.card.details': 'تفاصيل',
    }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        const storedLang = localStorage.getItem('elkawera_lang') as Language;
        const storedTheme = localStorage.getItem('elkawera_theme') as Theme;
        if (storedLang) setLanguage(storedLang);
        if (storedTheme) setTheme(storedTheme);
    }, []);

    const updateLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('elkawera_lang', lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    };

    const updateTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('elkawera_theme', newTheme);
        if (newTheme === 'light') {
            document.documentElement.classList.add('light-mode');
        } else {
            document.documentElement.classList.remove('light-mode');
        }
    };

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <SettingsContext.Provider value={{
            language,
            theme,
            setLanguage: updateLanguage,
            setTheme: updateTheme,
            t,
            dir: language === 'ar' ? 'rtl' : 'ltr'
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
