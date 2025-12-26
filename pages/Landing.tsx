import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, Zap, Shield, TrendingUp, Users, Target,
  Trophy, Star, Activity, BarChart3, Users2, Calendar,
  Search, Flag, Award, MousePointer2, ArrowRight
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { StatProgression } from '../components/StatProgression';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const SectionTitle: React.FC<{ title: string; subtitle?: string; centered?: boolean }> = ({ title, subtitle, centered = true }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={fadeInUp}
    className={`mb-16 ${centered ? 'text-center' : ''}`}
  >
    <h2 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight text-[var(--text-primary)] mb-4">
      {title}
    </h2>
    {subtitle && (
      <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    )}
    <div className={`h-1.5 w-24 bg-elkawera-accent mt-6 ${centered ? 'mx-auto' : ''} rounded-full opacity-50`}></div>
  </motion.div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; color: string; delay?: number }> = ({ icon, title, desc, color, delay = 0 }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{ y: -10, scale: 1.02 }}
    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-2xl hover:border-elkawera-accent/40 transition-all shadow-xl group relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-${color}-500`}></div>
    <div className={`w-14 h-14 bg-${color}-500/10 border border-${color}-500/20 rounded-xl flex items-center justify-center mb-6 text-${color}-500 group-hover:bg-${color}-500 group-hover:text-black transition-all duration-300`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)] group-hover:text-elkawera-accent transition-colors">{title}</h3>
    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

const EvolutionTier: React.FC<{ tier: string; title: string; desc: string; color: string; rating: string; active?: boolean }> = ({ tier, title, desc, color, rating, active }) => (
  <motion.div
    whileHover={{ scale: 1.05, rotateY: 5 }}
    className={`relative p-6 rounded-2xl border ${active ? `border-${color} bg-${color}/5` : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'} transition-all duration-500 overflow-hidden group`}
  >
    <div className={`absolute -right-4 -top-4 text-8xl font-black opacity-5 text-${color} group-hover:opacity-10 transition-opacity`}>
      {rating}
    </div>
    <div className={`text-xs font-bold uppercase tracking-widest text-${color} mb-2`}>{tier}</div>
    <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h4>
    <p className="text-[var(--text-secondary)] text-sm">{desc}</p>
  </motion.div>
);

export const Landing: React.FC = () => {
  const { t, dir } = useSettings();
  const { user } = useAuth();
  const backgroundRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const opacityProgress = useTransform(scrollYProgress, [0, 0.2], [1, 0.5]);
  const scaleProgress = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="relative min-h-screen overflow-x-hidden" dir={dir}>
      <div className="pb-32">
        {/* Hero Section */}
        <motion.section
          style={{ opacity: opacityProgress, scale: scaleProgress }}
          className="relative min-h-[90vh] flex items-center pb-20 overflow-hidden"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-elkawera-accent/10 border border-elkawera-accent/20 text-elkawera-accent text-sm font-bold tracking-wide uppercase animate-pulse">
                <Star size={16} /> {t('landing.vision.philosophy')}
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-8xl font-display font-bold uppercase leading-[0.9] text-[var(--text-primary)]">
                {t('landing.hero.title_manage')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-elkawera-accent via-emerald-400 to-cyan-500 drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                  {t('landing.hero.title_dynasty')}
                </span>
              </h1>

              <p className="text-[var(--text-secondary)] text-lg lg:text-xl max-w-xl leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/signup"
                  className="group relative inline-flex items-center justify-center px-10 py-5 bg-elkawera-accent text-black rounded-full font-bold text-xl overflow-hidden shadow-[0_0_30px_rgba(0,255,157,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {t('landing.cta.player')}
                    <ArrowRight size={22} className={`group-hover:translate-x-1 transition-transform ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </Link>

                <Link
                  to="/teams"
                  className="inline-flex items-center justify-center px-10 py-5 border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-full font-bold text-xl hover:border-elkawera-accent hover:text-elkawera-accent transition-all hover:bg-elkawera-accent/5"
                >
                  {t('landing.cta.teams')}
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-8 border-t border-[var(--border-color)]">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-[var(--bg-primary)] bg-gradient-to-br from-gray-700 to-black`}></div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--bg-primary)] bg-elkawera-accent text-black flex items-center justify-center text-xs font-bold">+500</div>
                </div>
                <div className="text-sm">
                  <span className="text-[var(--text-primary)] font-bold block">Joined the Dynasty</span>
                  <span className="text-[var(--text-secondary)]">Active players globally</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative w-full"
            >
              <div className="relative z-10 backdrop-blur-sm bg-black/20 rounded-[2rem] p-4 border border-white/5 shadow-2xl">
                <StatProgression />
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Vision Section */}
        <section className="container mx-auto px-4 md:px-6 py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="order-2 lg:order-1"
            >
              <SectionTitle
                title={t('landing.vision.title')}
                subtitle={t('landing.vision.subtitle')}
                centered={false}
              />
              <div className="space-y-6 text-lg text-[var(--text-secondary)] leading-relaxed">
                <p>{t('landing.vision.desc1')}</p>
                <p>{t('landing.vision.desc2')}</p>

                <div className="grid sm:grid-cols-2 gap-6 pt-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-elkawera-accent/10 text-elkawera-accent">
                      <Target size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)]">Precision Data</h4>
                      <p className="text-sm">Track every move and stat with accuracy.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)]">Elite Recognition</h4>
                      <p className="text-sm">Reach Platinum status and be immortalized.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ rotateY: 15, rotateX: 10, scale: 1.05 }}
              className="order-1 lg:order-2 flex justify-center perspective-1000"
            >
              <div className="relative w-80 h-80 transform-style-3d">
                <div className="absolute inset-0 bg-elkawera-accent/20 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-4 bg-elkawera-accent/30 rounded-full animate-pulse opacity-20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-56 bg-black border-4 border-elkawera-accent rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,255,157,0.5)]">
                    <img src="/elkawera.jpg" alt="Logo" className="w-40 h-40 object-cover rounded-full" />
                  </div>
                </div>
                {/* Orbital Icons */}
                {[Zap, Shield, Users, Trophy].map((Icon, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      rotate: 360,
                      transition: { duration: 10 + i * 2, repeat: Infinity, ease: "linear" }
                    }}
                    className="absolute inset-0"
                  >
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-elkawera-accent shadow-lg`}>
                      <Icon size={20} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works - Interactive Timeline */}
        <section className="py-32">
          <div className="container mx-auto px-4 md:px-6">
            <SectionTitle
              title={t('landing.how.title')}
            />

            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-[var(--border-color)] -translate-y-1/2 hidden lg:block"></div>

              <div className="grid lg:grid-cols-4 gap-12">
                {[1, 2, 3, 4].map((step) => (
                  <motion.div
                    key={step}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { delay: step * 0.2 } }
                    }}
                    className="relative text-center group"
                  >
                    <div className="w-20 h-20 bg-[var(--bg-primary)] border-4 border-[var(--border-color)] group-hover:border-elkawera-accent rounded-full flex items-center justify-center mx-auto mb-8 z-10 relative transition-all duration-300 group-hover:scale-110">
                      <span className="text-2xl font-black text-elkawera-accent">0{step}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{t(`landing.how.step${step}.title`)}</h3>
                    <p className="text-[var(--text-secondary)] text-sm">{t(`landing.how.step${step}.desc`)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="container mx-auto px-4 md:px-6 py-32">
          <SectionTitle
            title="Comprehensive Features"
            subtitle="Built for every role in the football ecosystem."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Zap size={28} />}
              title={t('landing.feat.stats.title')}
              desc={t('landing.feat.stats.desc')}
              color="emerald"
            />
            <FeatureCard
              icon={<Users size={28} />}
              title={t('landing.feat.teams.title')}
              desc={t('landing.feat.teams.desc')}
              color="blue"
            />
            <FeatureCard
              icon={<Shield size={28} />}
              title={t('landing.feat.tier.title')}
              desc={t('landing.feat.tier.desc')}
              color="yellow"
            />
            <FeatureCard
              icon={<BarChart3 size={28} />}
              title={t('landing.feat.analytics.title')}
              desc={t('landing.feat.analytics.desc')}
              color="purple"
            />
            <FeatureCard
              icon={<Target size={28} />}
              title={t('landing.feat.admin.title')}
              desc={t('landing.feat.admin.desc')}
              color="red"
            />
            <FeatureCard
              icon={<Search size={28} />}
              title={t('landing.feat.scout.title')}
              desc={t('landing.feat.scout.desc')}
              color="cyan"
            />
            <FeatureCard
              icon={<Calendar size={28} />}
              title={t('landing.feat.scheduling.title')}
              desc={t('landing.feat.scheduling.desc')}
              color="orange"
            />
            <FeatureCard
              icon={<Trophy size={28} />}
              title={t('landing.feat.leaderboards.title')}
              desc={t('landing.feat.leaderboards.desc')}
              color="pink"
            />
          </div>
        </section>

        {/* Player Card Evolution Section */}
        <section className="container mx-auto px-4 md:px-6 py-20">

          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/3">
              <SectionTitle
                title={t('landing.evolution.title')}
                subtitle={t('landing.evolution.desc')}
                centered={false}
              />
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 text-elkawera-accent font-bold hover:gap-4 transition-all"
              >
                {t('landing.cta.view_rankings')} <ChevronRight size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />
              </Link>
            </div>

            <div className="lg:w-2/3 grid sm:grid-cols-2 gap-6 w-full">
              <EvolutionTier
                tier="Tier 1"
                title={t('landing.evolution.silver')}
                desc="Starting your journey. 60-69 Overall."
                color="gray-400"
                rating="64"
              />
              <EvolutionTier
                tier="Tier 2"
                title={t('landing.evolution.gold')}
                desc="Rising through the ranks. 70-79 Overall."
                color="yellow-500"
                rating="78"
              />
              <EvolutionTier
                tier="Tier 3"
                title={t('landing.evolution.platinum')}
                desc="The elite bracket. 80-89 Overall."
                color="cyan-400"
                active={true}
                rating="89"
              />
              <EvolutionTier
                tier="Tier 4"
                title={t('landing.evolution.elite')}
                desc="Beyond legendary. Top 1% of players."
                color="purple-500"
                rating="94"
              />
            </div>
          </div>
        </section>

        {/* Team Management & Analytics Split */}
        <section className="container mx-auto px-4 md:px-6 py-32">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Team Mgmt */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-br from-blue-900/40 to-black p-12 rounded-[2.5rem] border border-blue-500/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 text-blue-500 opacity-10 group-hover:scale-110 transition-transform">
                <Users2 size={120} />
              </div>
              <h3 className="text-3xl font-display font-bold uppercase mb-4 text-white">
                {t('landing.team_mgmt.title')}
              </h3>
              <p className="text-blue-100/60 mb-8 max-w-md">
                {t('landing.team_mgmt.desc')}
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  'Custom Team Branding',
                  'Dynamic Lineup Management',
                  'Match History & Analysis',
                  'Captain Tools & Controls'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-blue-100/80">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/teams" className="px-8 py-3 bg-white text-blue-900 rounded-xl font-bold hover:bg-blue-50 transition-colors">
                Explore Teams
              </Link>
            </motion.div>

            {/* Analytics */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-br from-purple-900/40 to-black p-12 rounded-[2.5rem] border border-purple-500/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 text-purple-500 opacity-10 group-hover:scale-110 transition-transform">
                <Activity size={120} />
              </div>
              <h3 className="text-3xl font-display font-bold uppercase mb-4 text-white">
                {t('landing.analytics.title')}
              </h3>
              <p className="text-purple-100/60 mb-8 max-w-md">
                {t('landing.analytics.desc')}
              </p>
              <div className="flex gap-4 mb-10 overflow-x-auto pb-2 no-scrollbar">
                {[
                  { label: 'Growth', val: '+12%', color: 'purple' },
                  { label: 'Win Rate', val: '68%', color: 'emerald' },
                  { label: 'Avg Rating', val: '7.4', color: 'blue' }
                ].map((stat, i) => (
                  <div key={i} className={`min-w-[100px] p-4 rounded-2xl bg-white/5 border border-white/10 text-center`}>
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{stat.label}</div>
                    <div className={`text-xl font-bold text-${stat.color}-400`}>{stat.val}</div>
                  </div>
                ))}
              </div>
              <button className="px-8 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors">
                View Charts
              </button>
            </motion.div>
          </div>
        </section>

        {/* Global Community Section */}
        <section className="text-center py-20 overflow-hidden relative">
          <div className="container mx-auto px-4 md:px-6 relative px-4">
            <h2 className="text-4xl md:text-6xl font-display font-bold uppercase mb-6">{t('landing.community.title')}</h2>
            <p className="text-[var(--text-secondary)] text-xl max-w-2xl mx-auto mb-12">
              {t('landing.community.desc')}
            </p>

            <div className="flex flex-wrap justify-center gap-12 text-[var(--text-primary)] mb-16">
              <div>
                <div className="text-4xl md:text-6xl font-black text-elkawera-accent">2,400+</div>
                <div className="text-sm uppercase tracking-widest text-[var(--text-secondary)] font-bold mt-2">Active Matches</div>
              </div>
              <div>
                <div className="text-4xl md:text-6xl font-black text-elkawera-accent">150+</div>
                <div className="text-sm uppercase tracking-widest text-[var(--text-secondary)] font-bold mt-2">Verified Teams</div>
              </div>
              <div>
                <div className="text-4xl md:text-6xl font-black text-elkawera-accent">45+</div>
                <div className="text-sm uppercase tracking-widest text-[var(--text-secondary)] font-bold mt-2">Scouts Waiting</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/signup/scout" className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-bold hover:border-elkawera-accent hover:text-elkawera-accent transition-all">
                <Search size={20} /> {t('landing.cta.scout')}
              </Link>
              <Link to="/signup/captain" className="flex items-center justify-center gap-2 px-8 py-4 bg-elkawera-black border border-elkawera-accent text-elkawera-accent rounded-xl font-bold hover:bg-elkawera-accent hover:text-black transition-all">
                <Flag size={20} /> {t('landing.cta.captain')}
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container mx-auto px-4 md:px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-elkawera-accent rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

            <motion.div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-7xl font-display font-bold uppercase text-black leading-tight">
                Ready to become <br /> a street legend?
              </h2>
              <p className="text-black/70 text-xl font-medium max-w-xl mx-auto">
                Join the fastest growing street football platform in the region. Your journey to the top starts with a single click.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup" className="px-12 py-5 bg-black text-elkawera-accent rounded-full font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl">
                  GET STARTED NOW
                </Link>
              </div>
              <div className="flex items-center justify-center gap-8 pt-8 text-black/40 font-bold uppercase tracking-tighter text-sm">
                <span className="flex items-center gap-2"><Trophy size={16} /> Weekly Tournaments</span>
                <span className="flex items-center gap-2"><Award size={16} /> Professional Scouting</span>
                <span className="flex items-center gap-2"><MousePointer2 size={16} /> Instant Stats</span>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};