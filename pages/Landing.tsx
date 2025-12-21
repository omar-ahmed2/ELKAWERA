import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Zap, Shield, TrendingUp, Users } from 'lucide-react';
import { StatProgression } from '../components/StatProgression';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

export const Landing: React.FC = () => {
  const { t, dir } = useSettings();
  const { user } = useAuth();

  return (
    <div className="space-y-20 animate-fade-in-up" dir={dir}>
      {/* Hero Section */}
      <section className="relative pt-10 pb-20 lg:pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-7xl font-display font-bold uppercase leading-tight text-[var(--text-primary)]">
              {t('landing.hero.title_manage')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-elkawera-accent to-emerald-500">{t('landing.hero.title_dynasty')}</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg lg:text-xl max-w-xl leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/create"
                aria-label={t('landing.cta.create')}
                className="inline-flex items-center px-8 py-4 bg-elkawera-accent text-elkawera-black rounded-full font-bold text-lg hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(0,255,157,0.3)]"
              >
                {t('landing.cta.create')} <ChevronRight className={`ml-2 transform ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              </Link>
              <Link
                to="/teams"
                aria-label={t('landing.cta.teams')}
                className="inline-flex items-center px-8 py-4 border border-[var(--text-secondary)] text-[var(--text-primary)] rounded-full font-bold text-lg hover:border-elkawera-accent hover:text-elkawera-accent transition-colors"
              >
                {t('landing.cta.teams')}
              </Link>
            </div>
            <div className="pt-4">
              <Link
                to={!user ? "/dashboard" : user.role === 'captain' ? "/captain/dashboard" : user.role === 'scout' ? "/scout/dashboard" : "/dashboard"}
                aria-label={t('landing.cta.database')}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg font-bold hover:bg-[var(--bg-secondary)]/80 transition-all border border-[var(--border-color)] hover:border-[var(--text-primary)]"
              >
                <Users size={20} /> {t('landing.cta.database')}
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end relative">
            <div className="absolute -inset-4 bg-elkawera-accent/10 blur-3xl rounded-full z-0"></div>
            <div className="w-full z-10 animate-fade-in-up delay-100">
              <StatProgression />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-4 gap-8 text-center">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-2xl hover:border-elkawera-accent/50 transition-colors shadow-sm">
          <div className="w-12 h-12 bg-elkawera-accent rounded-full flex items-center justify-center mx-auto mb-4 text-black">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{t('landing.feat.stats.title')}</h3>
          <p className="text-[var(--text-secondary)] text-sm">{t('landing.feat.stats.desc')}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-2xl hover:border-purple-500/50 transition-colors shadow-sm">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
            <Users size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{t('landing.feat.teams.title')}</h3>
          <p className="text-[var(--text-secondary)] text-sm">{t('landing.feat.teams.desc')}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-2xl hover:border-yellow-500/50 transition-colors shadow-sm">
          <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{t('landing.feat.tier.title')}</h3>
          <p className="text-[var(--text-secondary)] text-sm">{t('landing.feat.tier.desc')}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-2xl hover:border-blue-500/50 transition-colors shadow-sm">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">{t('landing.feat.analytics.title')}</h3>
          <p className="text-[var(--text-secondary)] text-sm">{t('landing.feat.analytics.desc')}</p>
        </div>
      </section>
    </div>
  );
};