
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Shield, User, Star, Search, Info, CheckCircle2, ArrowRight, Zap, Target, Trophy, Globe } from 'lucide-react';

export const About: React.FC = () => {
  const { user } = useAuth();
  const { t, dir } = useSettings();

  const roleInfo = {
    player: {
      title: "As a Player",
      icon: <User className="w-8 h-8 text-elkawera-accent" />,
      description: "You are the primary data source. Your physical activity in matches translates into digital growth and social status.",
      features: [
        { title: "The Registration Request", desc: "You use the 'Request Card' page to submit a form. You must provide Height, Weight, and Age. Once submitted, your status becomes 'Pending' on your Dashboard until an Admin creates your physical database entry." },
        { title: "Performance Hub Interaction", desc: "After every match, you visit the 'Performance Hub'. Here, you don't just see numbers; you interact with Radar Charts. You can toggle between your 'Physical' and 'Tactical' ratings to see how match events affected your profile." },
        { title: "Notification Engagement", desc: "You monitor your 'Notifications' bell. This is where you actually accept or reject 'Team Invitations'. Accepting an invite instantly moves your ID into that Captain's squad database and updates your public profile's team badge." },
        { title: "Leaderboard Competition", desc: "You use the 'Leaderboard' page to filter players by your position (GK, CB, CF). You can click on any player to 'View Card', allowing you to study the stats of higher-ranked players to understand what performance metrics you need to improve." }
      ]
    },
    captain: {
      title: "As a Captain",
      icon: <Shield className="w-8 h-8 text-elkawera-accent" />,
      description: "You are the project manager of your squad. You handle recruitment, logistics, and data entry for every match.",
      features: [
        { title: "Squad Database Control", desc: "On the 'Teams' page, you manage your roster. You can click 'Invite' to open a search modal, find free-agent players by name, and trigger an automated notification to them. You also have the power to 'Remove' players who are inactive." },
        { title: "The Match Scheduler", desc: "You go to 'Schedule Match', select an opponent team from the dropdown, and pick a GPS location and date. This creates a 'Match Request' ID. You then coordinate with the other Captain to ensure they 'Approve' the request in their own dashboard." },
        { title: "Post-Match Data Entry", desc: "This is your most critical task. After a whistle, you go to 'End Match'. You manually select which players scored, who provided assists, and who played in defense. You must also upload a 'Verification Photo' of the score or the field as proof for the Admin." },
        { title: "Tactical Lineups", desc: "Before matches, you use the team management interface to drag and drop players into specific slots. This 'Lineup' is what the system uses to assign 'Clean Sheet' points to defenders and 'Goal' points to strikers once the match is finished." }
      ]
    },
    scout: {
      title: "As a Scout",
      icon: <Search className="w-8 h-8 text-elkawera-accent" />,
      description: "You are a data analyst. You use the platform to filter noise and identify elite potential through cold hard facts.",
      features: [
        { title: "The Advanced Search Engine", desc: "You use a specialized 'Search' page with multi-tier filters. You can search for 'Players over 180cm, with a 75+ shooting rating, who have played more than 5 matches'. This returns a curated list of talent cards." },
        { title: "Talent Monitoring", desc: "When you click on a Player's card, your Scout ID is recorded. You use your 'Scout Dashboard' to see a history of everyone you've viewed, allowing you to track if a player's stats have improved since your last check-in." },
        { title: "Accessing Verified Data", desc: "Unlike regular users, you can see a player's 'Verified Phone' and 'Email' on their public profile. This allows you to bypass the digital platform and initiate real-world recruitment conversations with players or their captains." },
        { title: "Market Trends", desc: "You analyze the 'Trending' section of your dashboard, which aggregates data on which players are getting the most 'Likes' and 'Views' from other scouts, helping you spot emerging stars early." }
      ]
    },
    admin: {
      title: "As an Admin",
      icon: <Star className="w-8 h-8 text-elkawera-accent" />,
      description: "You are the platform's architect and judge. You control the creation of every card and the validity of every match.",
      features: [
        { title: "Card Forging", desc: "You go to the 'New Players' queue. You review registration forms and click 'Create Card'. You then use a slider-based interface to set the player's initial Overall Rating and Card Tier (Silver, Gold, etc.) based on their provided data." },
        { title: "Match Arbitration Queue", desc: "Your 'Admin Dashboard' shows a list of 'Matches Awaiting Approval'. You compare the data submitted by both Captains. If the scores match and the 'Verification Photo' is valid, you click 'Approve', which triggers the site-wide stats recalculation." },
        { title: "Kit Request Management", desc: "You manage the 'Kit Requests' page. When a user pays for a kit, you change their order status from 'Pending' to 'Shipped'. This sends an automated notification to the user with their tracking details." },
        { title: "User Oversight", desc: "You have access to the 'User Database' where you can change user roles (e.g., promoting a Player to Captain), reset passwords, or ban users who provide false match data or inappropriate images." }
      ]
    }
  };

  const currentRoleInfo = user ? roleInfo[user.role as keyof typeof roleInfo] : null;

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8" dir={dir}>
      {/* Hero Section */}
      <section className="text-center space-y-6 animate-in fade-in slide-in-from-top-10 duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-elkawera-accent/10 border border-elkawera-accent/20 text-elkawera-accent text-sm font-bold tracking-wider uppercase">
          <Info size={16} /> About ELKAWERA
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter leading-tight italic">
          REVOLUTIONIZING <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-elkawera-accent to-[#65ec6eff]">STREET FOOTBALL</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-400 font-medium leading-relaxed">
          ELKAWERA is more than just a platform; it's a digital ecosystem designed to bring professional standards to the beautiful game played on streets, courts, and fields everywhere.
        </p>
      </section>

      {/* Platform Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {[
          { icon: <Target className="text-elkawera-accent" />, title: "Precision Tracking", desc: "Every match event contributes to a player's evolution, calculated by a professional-grade rating system." },
          { icon: <Trophy className="text-elkawera-accent" />, title: "Competitive Spirit", desc: "Rise through the ranks, from local squads to global legends, in a system that rewards consistency." },
          { icon: <Globe className="text-elkawera-accent" />, title: "Global Visibility", desc: "Showcase your talent to a network of scouts and clubs, turning street performance into real opportunities." }
        ].map((item, i) => (
          <div key={i} className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-elkawera-accent/30 transition-all duration-300 group shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 group-hover:bg-elkawera-accent/10 transition-all">
              {React.cloneElement(item.icon as React.ReactElement, { size: 24 })}
            </div>
            <h3 className="text-xl font-bold mb-4">{item.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* About Your Role - Dynamic Section */}
      <section className="relative overflow-hidden rounded-[3rem] p-8 md:p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-secondary)] to-black/50 border border-[var(--border-color)]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-elkawera-accent/5 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-display font-black italic tracking-tighter">
              {user ? "ABOUT YOUR ROLE" : "CHOOSE YOUR PATH"}
            </h2>
            <p className="text-gray-400 max-w-xl text-lg font-medium">
              {user 
                ? `Detailed breakdown of how ${user.name} uses ELKAWERA for their maximum potential.`
                : "Join the largest football community and define your legacy. Register today to start your journey."}
            </p>
          </div>

          {currentRoleInfo ? (
            <div className="space-y-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8 animate-in fade-in slide-in-from-left-10 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-elkawera-accent/10 rounded-2xl border border-elkawera-accent/20">
                      {currentRoleInfo.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{currentRoleInfo.title}</h3>
                      <p className="text-elkawera-accent text-sm font-bold uppercase tracking-widest">{user?.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-lg leading-relaxed italic">
                    "{currentRoleInfo.description}"
                  </p>
                  <div className="flex flex-wrap gap-3">
                     <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold flex items-center gap-2">
                       <CheckCircle2 size={14} className="text-elkawera-accent" /> Professional System
                     </div>
                     <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold flex items-center gap-2">
                       <CheckCircle2 size={14} className="text-elkawera-accent" /> Real-time Processing
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-10 duration-500">
                  {currentRoleInfo.features.map((feature, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group">
                      <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Zap size={16} className="text-elkawera-accent group-hover:scale-125 transition-transform" />
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step-by-Step Journey */}
              <div className="pt-8 border-t border-white/5">
                <h4 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <Target className="text-elkawera-accent" /> YOUR STEP-BY-STEP JOURNEY
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {user?.role === 'player' && [
                    { step: "01", title: "Request Card", desc: "Fill out the Registration Form with your real-world physical and position data." },
                    { step: "02", title: "Admin Approval", desc: "An admin verifies your data and builds your starter card with initial ratings." },
                    { step: "03", title: "Join a Team", desc: "Accept an invitation from a Captain or apply to open squads in the Teams database." },
                    { step: "04", title: "Scale the ranks", desc: "Perform in matches to trigger the Evolution Engine and climb the leaderboard." }
                  ].map((s, i) => (
                    <div key={i} className="relative p-6 rounded-2xl bg-black/40 border border-white/5">
                      <span className="text-4xl font-black text-white/10 absolute top-4 right-4">{s.step}</span>
                      <h5 className="font-bold mb-2 text-elkawera-accent">{s.title}</h5>
                      <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                  {user?.role === 'captain' && [
                    { step: "01", title: "Initialize Team", desc: "Define your club's brand and colors to start recruiting the best street talent." },
                    { step: "02", title: "Recruit Squad", desc: "Search 'Free Agents' and send Invitations. You need 5 players to be match-ready." },
                    { step: "03", title: "Challenge", desc: "Use the Scheduler to find opponents. Coordinate via the contact info provided." },
                    { step: "04", title: "Report & Verify", desc: "Submit results instantly via the Captain Dashboard to ensure team rank growth." }
                  ].map((s, i) => (
                    <div key={i} className="relative p-6 rounded-2xl bg-black/40 border border-white/5">
                      <span className="text-4xl font-black text-white/10 absolute top-4 right-4">{s.step}</span>
                      <h5 className="font-bold mb-2 text-elkawera-accent">{s.title}</h5>
                      <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                  {user?.role === 'scout' && [
                    { step: "01", title: "Set Profile", desc: "Choose your scout type. Club scouts have higher priority in recruitment notifications." },
                    { step: "02", title: "Monitor Feed", desc: "Keep an eye on the Daily Trending section to see who is rising in performance." },
                    { step: "03", title: "Deep Dive", desc: "Analyze match history and consistency metrics to filter out one-match wonders." },
                    { step: "04", title: "Bridge the Gap", desc: "Use the direct contact system to reach out to captains about their star players." }
                  ].map((s, i) => (
                    <div key={i} className="relative p-6 rounded-2xl bg-black/40 border border-white/5">
                      <span className="text-4xl font-black text-white/10 absolute top-4 right-4">{s.step}</span>
                      <h5 className="font-bold mb-2 text-elkawera-accent">{s.title}</h5>
                      <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                  {user?.role === 'admin' && [
                    { step: "01", title: "Gatekeep", desc: "Review signup requests. Only verified, real players should enter the ecosystem." },
                    { step: "02", title: "Forge Cards", desc: "Craft initial card ratings. Balance the league by ensuring realistic attributes." },
                    { step: "03", title: "Arbitrate", desc: "Resolve match disputes by comparing captain reports and photo evidence." },
                    { step: "04", title: "Evolve", desc: "Analyze system growth and push platform updates to keep the community thriving." }
                  ].map((s, i) => (
                    <div key={i} className="relative p-6 rounded-2xl bg-black/40 border border-white/5">
                      <span className="text-4xl font-black text-white/10 absolute top-4 right-4">{s.step}</span>
                      <h5 className="font-bold mb-2 text-elkawera-accent">{s.title}</h5>
                      <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(roleInfo).map(([key, info], i) => (
            <div key={key} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-elkawera-accent/30 transition-all group cursor-pointer">
              <Link to="/signup">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:bg-elkawera-accent/10 transition-all">
                  {React.cloneElement(info.icon as React.ReactElement, { size: 20 })}
                </div>
                <h4 className="font-bold mb-2 uppercase text-xs tracking-widest">{info.title}</h4>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed mb-4">{info.description}</p>
                <div className="flex items-center gap-2 text-elkawera-accent text-[10px] font-bold">
                  GET STARTED <ArrowRight size={10} />
                </div>
              </Link>
            </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center px-4">
        <div className="space-y-6">
          <h2 className="text-3xl font-display font-black italic tracking-tighter">OUR MISSION</h2>
          <div className="space-y-4 text-gray-400 font-medium leading-relaxed">
            <p>
              To democratize football excellence by providing every aspirant with the digital tools previously reserved for elite professional clubs.
            </p>
            <p>
              We believe talent is universal, but opportunity is not. ELKAWERA bridges this gap through data transparency, competitive integrity, and community empowerment.
            </p>
          </div>
          <Link to="/contact" className="flex items-center gap-2 text-elkawera-accent font-bold group">
            Learn more about our team <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="relative">
          <div className="aspect-square rounded-[3rem] overflow-hidden border border-[var(--border-color)] shadow-2xl skew-y-3">
             <img src="/elkawera2.png" alt="Mission" className="w-full h-full object-cover scale-110" />
          </div>
          {/* Stats Overlay */}
          <div className="absolute -bottom-8 -right-8 p-6 rounded-3xl bg-[var(--bg-primary)] border border-elkawera-accent/30 shadow-2xl -skew-y-3">
            <div className="text-3xl font-black text-elkawera-accent italic leading-none tracking-tighter">10,000+</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Active Players</div>
          </div>
        </div>
      </section>
    </div>
  );
};
