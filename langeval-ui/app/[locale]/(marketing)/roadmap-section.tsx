"use client";

import { motion } from "framer-motion";
import { CheckCircle2Icon, CircleIcon, ClockIcon, RocketIcon, StarIcon } from "lucide-react";
import { useTranslations } from 'next-intl';

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay }}
        className={className}
    >
        {children}
    </motion.div>
);

export default function RoadmapSection() {
    const t = useTranslations('Roadmap');

    const timeline = [
        {
            key: "m1",
            status: "completed"
        },
        {
            key: "m2",
            status: "completed"
        },
        {
            key: "m3",
            status: "current"
        },
        {
            key: "m4",
            status: "planned"
        },
        {
            key: "m5",
            status: "planned"
        },
        {
            key: "m6",
            status: "planned"
        }
    ];

    return (
        <section id="roadmap" className="py-24 relative overflow-hidden bg-[#0B0F19]">
            {/* Background Decorations */}
            <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-violet-900/10 rounded-full blur-[100px] -z-10" />

            <div className="container mx-auto px-6">
                <FadeIn>
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center p-2 rounded-xl bg-indigo-500/10 text-indigo-400 mb-4 ring-1 ring-indigo-500/20">
                            <RocketIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('title')}</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            {t('subtitle')}
                        </p>
                    </div>
                </FadeIn>

                <div className="relative max-w-4xl mx-auto">
                    {/* Vertical Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/0 via-indigo-500/30 to-indigo-500/0 md:-translate-x-1/2" />

                    <div className="space-y-12">
                        {timeline.map((milestone, index) => {
                            const isEven = index % 2 === 0;
                            const isCompleted = milestone.status === 'completed';
                            const isCurrent = milestone.status === 'current';

                            // Safe retrieval of items array using index-based access pattern if raw fails, 
                            // but here we know the structure. simpler to use t.raw if configured, 
                            // or loop. Let's assume t.raw works for array.
                            // If t.raw is not available on the interface, we might need a workaround.
                            // However, let's try to map the object manually if needed.
                            // To be safe without t.raw:

                            return (
                                <FadeIn key={index} delay={index * 0.1}>
                                    <div className={`relative flex flex-col md:flex-row gap-8 md:gap-0 ${isEven ? 'md:flex-row-reverse' : ''}`}>

                                        {/* Date Badge (Mobile: Top, Desktop: Center) */}
                                        <div className="absolute left-8 md:left-1/2 -translate-x-4 md:-translate-x-1/2 top-0 z-10 w-8 h-8 flex items-center justify-center">
                                            <div className={`
                                                flex items-center justify-center w-8 h-8 rounded-full border-4 border-[#0B0F19] 
                                                ${isCompleted ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                                                    isCurrent ? 'bg-white text-indigo-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse' :
                                                        'bg-slate-800 text-slate-500 border-slate-700'}
                                            `}>
                                                {isCompleted ? <CheckCircle2Icon className="w-4 h-4" /> :
                                                    isCurrent ? <StarIcon className="w-4 h-4 fill-current" /> :
                                                        <CircleIcon className="w-3 h-3" />}
                                            </div>
                                        </div>

                                        {/* Content Card */}
                                        <div className={`md:w-1/2 ${isEven ? 'md:pl-16' : 'md:pr-16'} pl-16 md:pl-0`}>
                                            <div className={`
                                                relative p-6 rounded-2xl border transition-all duration-300 group
                                                ${isCurrent
                                                    ? 'bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                                                    : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'}
                                            `}>
                                                {/* Connecting Line to Center */}
                                                <div className={`
                                                    hidden md:block absolute top-4 w-16 h-px bg-indigo-500/30
                                                    ${isEven ? '-left-16 bg-gradient-to-l' : '-right-16 bg-gradient-to-r'} 
                                                    from-transparent to-indigo-500/50
                                                `} />

                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`
                                                        text-sm font-mono px-3 py-1 rounded-full border
                                                        ${isCurrent ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' :
                                                            isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                                'bg-slate-800 border-slate-700 text-slate-400'}
                                                    `}>
                                                        {t(`milestones.${milestone.key}.month` as any)}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="flex h-2 w-2 relative">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className={`text-xl font-bold mb-3 ${isCurrent ? 'text-white' : 'text-slate-200'}`}>
                                                    {t(`milestones.${milestone.key}.title` as any)}
                                                </h3>

                                                <ul className="space-y-2">
                                                    {/* We use specific indices 0-3 based on our JSON structure */}
                                                    {[0, 1, 2, 3].map((i) => {
                                                        const itemKey = `milestones.${milestone.key}.items.${i}`;
                                                        const itemText = t(itemKey as any);
                                                        // Filter out if translation returns the key itself (meaning missing)
                                                        if (itemText === itemKey) return null;

                                                        return (
                                                            <li key={i} className="flex items-start text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                                                                <div className={`mt-1.5 mr-2 w-1 h-1 rounded-full ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                                                                {itemText}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
