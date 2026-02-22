"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { healthRadarData } from '@/lib/mock-data';
import { useTranslations } from 'next-intl';

export function HealthRadar({ data = healthRadarData }: { data?: any[] }) {
  const t = useTranslations("Dashboard.radar");

  const getStatus = (value: number, fullMark: number) => {
    const percentage = (value / fullMark) * 100;
    if (percentage >= 80) return { label: t('statuses.excellent'), color: 'text-green-400', bg: 'bg-green-500/10' };
    if (percentage >= 60) return { label: t('statuses.good'), color: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (percentage >= 40) return { label: t('statuses.fair'), color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    return { label: t('statuses.improve'), color: 'text-red-400', bg: 'bg-red-500/10' };
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const status = getStatus(data.A, data.fullMark);
      const metricKey = data.subject.toLowerCase();

      return (
        <div className="bg-[#161B2B]/90 backdrop-blur-xl p-4 border border-white/10 shadow-2xl rounded-2xl max-w-[250px]">
          <p className="font-bold text-white mb-1.5">{t(`metrics.${metricKey}.title`)}</p>
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-2xl font-black text-white">{data.A}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5 uppercase tracking-wider ${status.color} ${status.bg}`}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            {t(`metrics.${metricKey}.description`)}
          </p>
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[10px] text-slate-500 font-mono">
            <span>{t('tooltip.fullMark')}: {data.fullMark}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Localize subjects for Axis
  const localizedData = data.map(item => ({
    ...item,
    subject: t(`metrics.${item.subject.toLowerCase()}.title`)
  }));

  return (
    <div className="h-[350px] w-full min-w-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={localizedData}>
          <PolarGrid stroke="#ffffff" strokeOpacity={0.1} />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 150]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="V-Eval"
            dataKey="A"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.5}
            dot={{ r: 4, fill: '#818cf8', fillOpacity: 1 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
