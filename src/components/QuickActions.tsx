import React from 'react';
import { Link } from 'react-router-dom';
import { 
    BarChart3, Trophy, Users, Calendar, Shirt, Target, 
    TrendingUp, Award, Zap, ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    link: string;
    color: string;
    bgColor: string;
}

interface QuickActionsProps {
    userRole: 'player' | 'captain' | 'scout' | 'admin';
    hasPlayerCard?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ userRole, hasPlayerCard }) => {
    const getQuickActions = (): QuickAction[] => {
        const baseActions: QuickAction[] = [
            {
                id: 'leaderboard',
                title: 'Global Leaderboard',
                description: 'See top players & rankings',
                icon: <Trophy size={24} />,
                link: '/leaderboard',
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-500/10'
            },
            {
                id: 'teams',
                title: 'Browse Teams',
                description: 'Explore all teams',
                icon: <Users size={24} />,
                link: '/teams',
                color: 'text-blue-400',
                bgColor: 'bg-blue-500/10'
            },
            {
                id: 'events',
                title: 'Upcoming Events',
                description: 'Join tournaments & matches',
                icon: <Calendar size={24} />,
                link: '/events',
                color: 'text-purple-400',
                bgColor: 'bg-purple-500/10'
            },
            // {
            //     id: 'kits',
            //     title: 'Official Kits',
            //     description: 'Browse & order kits',
            //     icon: <Shirt size={24} />,
            //     link: '/kits',
            //     color: 'text-green-400',
            //     bgColor: 'bg-green-500/10'
            // }
        ];

        if (userRole === 'player' && hasPlayerCard) {
            baseActions.unshift({
                id: 'performance',
                title: 'Performance Hub',
                description: 'View detailed statistics',
                icon: <BarChart3 size={24} />,
                link: '/performance-hub',
                color: 'text-elkawera-accent',
                bgColor: 'bg-elkawera-accent/10'
            });
        }

        if (userRole === 'captain') {
            baseActions.unshift({
                id: 'captain-dashboard',
                title: 'Captain Dashboard',
                description: 'Manage your team',
                icon: <Target size={24} />,
                link: '/captain/dashboard',
                color: 'text-orange-400',
                bgColor: 'bg-orange-500/10'
            });
        }

        if (userRole === 'scout') {
            baseActions.unshift({
                id: 'scout-dashboard',
                title: 'Scout Dashboard',
                description: 'Discover talent',
                icon: <Target size={24} />,
                link: '/scout/dashboard',
                color: 'text-cyan-400',
                bgColor: 'bg-cyan-500/10'
            });
        }

        return baseActions;
    };

    const actions = getQuickActions();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="text-elkawera-accent" size={20} />
                    Quick Actions
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actions.map((action, index) => (
                    <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link
                            to={action.link}
                            className={`block ${action.bgColor} border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`${action.color} ${action.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                                        {action.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1 group-hover:text-elkawera-accent transition-colors">
                                            {action.title}
                                        </h4>
                                        <p className="text-sm text-gray-400">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight 
                                    size={20} 
                                    className="text-gray-500 group-hover:text-elkawera-accent group-hover:translate-x-1 transition-all flex-shrink-0" 
                                />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Achievement Teaser */}
            {userRole === 'player' && hasPlayerCard && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                <Award size={24} className="text-black" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Unlock Achievements</h4>
                                <p className="text-sm text-gray-400">
                                    Complete challenges to earn exclusive badges
                                </p>
                            </div>
                        </div>
                        <Link 
                            to="/performance-hub"
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold text-white transition-all flex items-center gap-2"
                        >
                            View All
                            <TrendingUp size={16} />
                        </Link>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
