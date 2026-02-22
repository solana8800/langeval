"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, delay }}
        className={className}
    >
        {children}
    </motion.div>
);

export default function PricingSection() {
    const t = useTranslations("Pricing");
    const [isYearly, setIsYearly] = useState(false);

    const plans = [
        {
            key: "free",
            name: t("free.name"),
            price: t("free.price"),
            period: isYearly ? t("period_yearly") : t("free.period"),
            description: t("free.description"),
            features: [
                t("free.features.0"),
                t("free.features.1"),
                t("free.features.2"),
                t("free.features.3"),
                t("free.features.4"),
            ],
            action: t("free.action"),
            link: "/dashboard",
            highlighted: false,
        },
        {
            key: "pro",
            name: t("pro.name"),
            price: isYearly ? "90" : t("pro.price"),
            period: isYearly ? t("period_yearly") : t("pro.period"),
            description: t("pro.description"),
            features: [
                t("pro.features.0"),
                t("pro.features.1"),
                t("pro.features.2"),
                t("pro.features.3"),
                t("pro.features.4"),
                t("pro.features.5"),
            ],
            action: t("pro.action"),
            link: "/dashboard",
            highlighted: true,
        },
        {
            key: "enterprise",
            name: t("enterprise.name"),
            price: isYearly ? "500" : t("enterprise.price"),
            period: isYearly ? t("period_yearly") : t("enterprise.period"),
            description: t("enterprise.description"),
            features: [
                t("enterprise.features.0"),
                t("enterprise.features.1"),
                t("enterprise.features.2"),
                t("enterprise.features.3"),
                t("enterprise.features.4"),
                t("enterprise.features.5"),
            ],
            action: t("enterprise.action"),
            link: "/dashboard",
            highlighted: false,
        },
    ];

    return (
        <section id="pricing" className="py-32 relative bg-slate-900/30 border-y border-white/5">
            <div className="container mx-auto px-6 relative z-10">
                <FadeIn>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("title")}</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t("subtitle")}</p>
                    </div>

                    <div className="flex justify-center mb-16">
                        <div className="flex items-center gap-4 bg-[#0B0F19] p-1 rounded-full border border-white/10">
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isYearly ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                            >
                                {t("monthly")}
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isYearly ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                            >
                                {t("yearly")}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isYearly ? "bg-white/20 text-white" : "bg-indigo-500/20 text-indigo-400"}`}>
                                    {t("save20")}
                                </span>
                            </button>
                        </div>
                    </div>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, i) => (
                        <FadeIn key={plan.key} delay={i * 0.1}>
                            <div className={`relative p-8 rounded-3xl h-full flex flex-col transition-all ${plan.highlighted ? "bg-gradient-to-b from-indigo-900/50 to-[#0B0F19] border-2 border-indigo-500 shadow-2xl shadow-indigo-900/20 shadow-indigo-500/20 transform md:-translate-y-4" : "bg-[#0B0F19] border border-white/10 hover:border-white/20"}`}>

                                {plan.highlighted && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                    <p className="text-slate-400 text-sm h-10">{plan.description}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        {plan.price !== "Custom" && plan.price !== "Liên hệ" && <span className="text-2xl text-slate-400 font-bold">$</span>}
                                        <span className="text-5xl font-extrabold text-white tracking-tight">{plan.price}</span>
                                    </div>
                                    <div className="text-slate-500 mt-1">{plan.period}</div>
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-slate-300">
                                            <CheckCircle2Icon className={`w-5 h-5 mr-3 shrink-0 ${plan.highlighted ? "text-indigo-400" : "text-slate-500"}`} />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link href={plan.link} className="w-full">
                                    <Button
                                        className={`w-full h-12 rounded-xl font-bold text-base transition-all ${plan.highlighted ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" : "bg-white/5 hover:bg-white/10 text-white border border-white/10"}`}
                                    >
                                        {plan.action}
                                    </Button>
                                </Link>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}
