
import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const data = [
  { match: 'Week 1', overall: 64, pace: 65, shooting: 60, passing: 62 },
  { match: 'Week 2', overall: 68, pace: 69, shooting: 65, passing: 64 },
  { match: 'Week 3', overall: 71, pace: 72, shooting: 70, passing: 68 },
  { match: 'Week 4', overall: 74, pace: 74, shooting: 74, passing: 72 },
  { match: 'Week 5', overall: 77, pace: 78, shooting: 76, passing: 75 }, // Breaks Gold
  { match: 'Week 6', overall: 81, pace: 82, shooting: 82, passing: 80 },
  { match: 'Week 7', overall: 86, pace: 88, shooting: 89, passing: 85 }, // Breaks Platinum
];

export const StatProgression: React.FC = () => {
  return (
    <div className="w-full h-[500px] bg-black/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">

      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-elkawera-accent/5 rounded-full blur-[100px] -z-10 group-hover:bg-elkawera-accent/10 transition-colors duration-700"></div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 gap-4 relative z-10">
        <div>
          <h3 className="text-3xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-2">
            Evolution Tracker
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-elkawera-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-elkawera-accent"></span>
            </span>
          </h3>
          <p className="text-gray-400 text-sm mt-2 max-w-lg leading-relaxed">
            Visualize your path to greatness. Track how match performance upgrades your card from
            <span className="text-gray-400 font-bold mx-1">Silver</span> ➜
            <span className="text-[#fbbf24] font-bold mx-1">Gold</span> ➜
            <span className="text-[#22d3ee] font-bold mx-1">Platinum</span>.
          </p>
        </div>

        {/* Current Form Indicator */}
        <div className="flex flex-col items-end">
          <div className="text-right bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-[0.2em] block mb-1">Current Form</span>
            <div className="text-xl font-bold text-white flex items-center gap-2">
              Use Matches to Upgrade
              <span className="text-elkawera-accent">↗</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[320px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

            <XAxis
              dataKey="match"
              stroke="#666"
              tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />

            <YAxis
              stroke="#666"
              tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              domain={[60, 100]}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(5, 5, 5, 0.95)',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}
              labelStyle={{ color: '#9ca3af', fontSize: '10px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />

            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }} />

            {/* TIER GOAL LINES */}
            <ReferenceLine
              y={75}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{
                value: 'GOLD TIER (75)',
                position: 'insideTopRight',
                fill: '#fbbf24',
                fontSize: 10,
                fontWeight: 700
              }}
            />
            <ReferenceLine
              y={85}
              stroke="#22d3ee"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{
                value: 'PLATINUM TIER (85)',
                position: 'insideTopRight',
                fill: '#22d3ee',
                fontSize: 10,
                fontWeight: 700
              }}
            />

            {/* Supporting Stats (Thinner lines) */}
            <Line
              type="monotone"
              dataKey="pace"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              strokeOpacity={0.4}
              name="Pace"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="shooting"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              strokeOpacity={0.4}
              name="Shooting"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />

            {/* Main Overall Rating (Area/Thick Line) */}
            <Area
              type="monotone"
              dataKey="overall"
              stroke="#00ff9d"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorOverall)"
              name="Overall Rating"
              activeDot={{ r: 6, fill: '#fff', stroke: '#00ff9d', strokeWidth: 4 }}
            />

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};