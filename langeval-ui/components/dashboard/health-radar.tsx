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
    if (percentage >= 80) return { label: t('statuses.excellent'), color: 'text-green-600' };
    if (percentage >= 60) return { label: t('statuses.good'), color: 'text-blue-600' };
    if (percentage >= 40) return { label: t('statuses.fair'), color: 'text-yellow-600' };
    return { label: t('statuses.improve'), color: 'text-red-600' };
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const status = getStatus(data.A, data.fullMark);
      const metricKey = data.subject.toLowerCase();

      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg max-w-[250px]">
          <p className="font-bold text-slate-900 mb-1">{t(`metrics.${metricKey}.title`)}</p>
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-2xl font-bold text-[#D13138]">{data.A}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 bg-slate-50 rounded-full border ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-tight">
            {t(`metrics.${metricKey}.description`)}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-400">
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
    <div className="h-[300px] w-full min-w-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={localizedData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Radar
            name="V-Eval"
            dataKey="A"
            stroke="#D13138"
            fill="#D13138"
            fillOpacity={0.4}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
