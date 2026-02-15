"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
    CircleIcon, TargetIcon, RocketIcon, CodeIcon, ChevronRightIcon,
    GithubIcon, ShieldCheckIcon, ZapIcon, BarChart3Icon, UsersIcon,
    CheckCircle2Icon, PlayCircleIcon, TerminalIcon, CpuIcon,
    ArrowRightIcon, BoxIcon, SwordsIcon, Wand2Icon, MenuIcon
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const LanguageSwitcher = () => {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    const toggleLanguage = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 border border-white/10">
            <button
                onClick={() => toggleLanguage('en')}
                className={`text-xs font-bold transition-colors ${locale === 'en' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                EN
            </button>
            <div className="w-px h-3 bg-white/10" />
            <button
                onClick={() => toggleLanguage('vi')}
                className={`text-xs font-bold transition-colors ${locale === 'vi' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                VI
            </button>
        </div>
    );
};

// --- Components ---

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

const FeatureSection = ({ title, description, icon: Icon, image, reversed = false, features = [] }: any) => (
    <div className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 py-24`}>
        <div className="flex-1 space-y-6">
            <FadeIn>
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 ring-1 ring-indigo-500/20">
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">{title}</h3>
                <p className="text-lg text-slate-400 leading-relaxed dark:text-slate-400">{description}</p>
                <ul className="space-y-3 mt-8">
                    {features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center text-slate-300">
                            <CheckCircle2Icon className="w-5 h-5 text-indigo-500 mr-3 shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </FadeIn>
        </div>
        <div className="flex-1 w-full">
            <FadeIn delay={0.2}>
                <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 aspect-video overflow-hidden shadow-2xl group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-slate-900/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {/* Placeholder for screenshot */}
                    <div className="absolute inset-0 flex items-center justify-center text-slate-700 font-mono text-sm">
                        {image ? image : "Interactive UI Preview"}
                    </div>
                    {/* Simulated UI Elements */}
                    <div className="absolute top-4 left-4 right-4 h-full">
                        <div className="w-full h-8 bg-slate-800/50 rounded-t-lg flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                        </div>
                        <div className="w-full h-full bg-slate-950/80 p-6 text-xs text-slate-500 font-mono">
                            <code className="language-python">
                                <span className="text-purple-400">@monitor</span><br />
                                <span className="text-blue-400">def</span> <span className="text-yellow-400">chat_agent</span>(msg):<br />
                                &nbsp;&nbsp;<span className="text-slate-500"># PII Masking: Auto</span><br />
                                &nbsp;&nbsp;<span className="text-blue-400">return</span> agent.process(msg)
                            </code>
                        </div>
                    </div>
                </div>
            </FadeIn>
        </div>
    </div>
);

export default function LandingPage() {
    const t = useTranslations();
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[#0B0F19]/60">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="font-bold text-white text-xl">E</span>
                        </div>
                        <span className="font-bold text-xl text-white tracking-tight">LangEval</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-white transition-colors">{t('Navbar.features')}</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">{t('Navbar.howItWorks')}</a>
                        <a href="#testimonials" className="hover:text-white transition-colors">{t('Navbar.customers')}</a>
                        <a href="/docs/00-Business-Requirements.md" className="hover:text-white transition-colors">{t('Navbar.docs')}</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Link href="https://github.com/langeval/langeval" target="_blank">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
                                <GithubIcon className="w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/dashboard" className="hidden md:block">
                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/25 rounded-full px-6">
                                {t('Navbar.getStarted')}
                            </Button>
                        </Link>

                        {/* Mobile Menu */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white hover:bg-white/5">
                                    <MenuIcon className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="bg-[#0B0F19] border-white/10 text-slate-300">
                                <div className="flex flex-col gap-6 mt-8">
                                    <div className="flex flex-col gap-4 text-lg font-medium">
                                        <a href="#features" className="hover:text-white transition-colors py-2 border-b border-white/5">{t('Navbar.features')}</a>
                                        <a href="#how-it-works" className="hover:text-white transition-colors py-2 border-b border-white/5">{t('Navbar.howItWorks')}</a>
                                        <a href="#testimonials" className="hover:text-white transition-colors py-2 border-b border-white/5">{t('Navbar.customers')}</a>
                                        <a href="/docs/00-Business-Requirements.md" className="hover:text-white transition-colors py-2 border-b border-white/5">{t('Navbar.docs')}</a>
                                    </div>
                                    <Link href="/dashboard" className="mt-4">
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/25 rounded-full h-12 text-lg">
                                            {t('Navbar.getStarted')}
                                        </Button>
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

                <div className="container mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-medium mb-8 hover:bg-white/10 transition-colors cursor-pointer">
                            <span className="flex w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                            {t('Hero.badge')}
                            <ArrowRightIcon className="w-4 h-4 ml-1" />
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400 mb-6 tracking-tight leading-[1.1]">
                            {t('Hero.titlePrefix')} <br className="hidden md:block" /> {t('Hero.titleHighlight')}
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                            {t('Hero.description')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/dashboard">
                                <Button size="lg" className="h-14 px-8 rounded-full text-lg bg-white text-slate-900 hover:bg-slate-200">
                                    {t('Hero.startEvaluating')} <ChevronRightIcon className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg border-slate-700 text-slate-300 hover:bg-white/5 hover:text-white bg-transparent">
                                <TerminalIcon className="mr-2 w-5 h-5" /> {t('Hero.installSdk')}
                            </Button>
                        </div>

                        <div className="mt-12 text-sm text-slate-500 font-mono">
                            pip install langeval-sdk
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Social Proof */}
            <div className="border-y border-white/5 bg-white/[0.02]">
                <div className="container mx-auto px-6 py-12">
                    <p className="text-center text-sm font-medium text-slate-500 mb-8 uppercase tracking-widest">{t('SocialProof.poweredBy')}</p>
                    <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Mock Logos - Replace with real SVGs if needed */}
                        {['OpenAI', 'Anthropic', 'LangChain', 'LlamaIndex', 'HuggingFace'].map((name) => (
                            <div key={name} className="text-xl font-bold font-mono text-white flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-700 rounded-full" /> {name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* How it Works - Steps */}
            <section id="how-it-works" className="py-32 relative">
                <div className="container mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-24">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('HowItWorks.title')}</h2>
                            <p className="text-lg text-slate-400">{t('HowItWorks.subtitle')}</p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

                        {[
                            { icon: BoxIcon, title: t('HowItWorks.steps.connect.title'), desc: t('HowItWorks.steps.connect.description') },
                            { icon: Wand2Icon, title: t('HowItWorks.steps.build.title'), desc: t('HowItWorks.steps.build.description') },
                            { icon: SwordsIcon, title: t('HowItWorks.steps.battle.title'), desc: t('HowItWorks.steps.battle.description') },
                            { icon: BarChart3Icon, title: t('HowItWorks.steps.analyze.title'), desc: t('HowItWorks.steps.analyze.description') },
                        ].map((step, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="relative text-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all backdrop-blur-sm group">
                                    <div className="w-16 h-16 mx-auto bg-[#0B0F19] rounded-2xl border border-indigo-500/30 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-indigo-500/10">
                                        <step.icon className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Features - Jagged Layout */}
            <section id="features" className="py-20 relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <FeatureSection
                        title={t('Features.builder.title')}
                        description={t('Features.builder.description')}
                        icon={Wand2Icon}
                        features={[
                            t('Features.builder.items.0'),
                            t('Features.builder.items.1'),
                            t('Features.builder.items.2')
                        ]}
                        image={
                            <div className="grid grid-cols-3 gap-4 p-8 w-full h-full opacity-60">
                                <div className="rounded-lg bg-indigo-500/20 border border-indigo-500/40 h-24 col-span-1"></div>
                                <div className="col-span-1 flex items-center justify-center"><ArrowRightIcon className="text-slate-600" /></div>
                                <div className="rounded-lg bg-blue-500/20 border border-blue-500/40 h-24 col-span-1"></div>
                            </div>
                        }
                    />

                    <FeatureSection
                        title={t('Features.battle.title')}
                        description={t('Features.battle.description')}
                        icon={SwordsIcon}
                        reversed={true}
                        features={[
                            t('Features.battle.items.0'),
                            t('Features.battle.items.1'),
                            t('Features.battle.items.2')
                        ]}
                        image={
                            <div className="flex items-center justify-center h-full gap-8">
                                <div className="w-24 h-24 rounded-full bg-blue-600/20 border border-blue-500 flex items-center justify-center text-blue-400 font-bold">Agent</div>
                                <div className="text-2xl text-red-500 font-bold">VS</div>
                                <div className="w-24 h-24 rounded-full bg-red-600/20 border border-red-500 flex items-center justify-center text-red-400 font-bold">Attacker</div>
                            </div>
                        }
                    />

                    <FeatureSection
                        title={t('Features.observability.title')}
                        description={t('Features.observability.description')}
                        icon={ZapIcon}
                        features={[
                            t('Features.observability.items.0'),
                            t('Features.observability.items.1'),
                            t('Features.observability.items.2')
                        ]}
                        image={
                            <div className="flex flex-col gap-2 p-8 w-full">
                                {[45, 78, 30, 92].map((width, i) => (
                                    <div key={i} className="h-2 rounded bg-slate-700/50 w-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${width}%` }}></div>
                                    </div>
                                ))}
                            </div>
                        }
                    />
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('Testimonials.title')}</h2>
                            <p className="text-lg text-slate-400">{t('Testimonials.subtitle')}</p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "LangEval cut our red-teaming time by 80%. The automated attack bots found edge cases we never thought of.",
                                author: "Sarah Chen",
                                role: "Staff AI Engineer at FinTech Corp",
                                avatar: "SC"
                            },
                            {
                                quote: "The visual builder allowed our product managers to design complex test scenarios without bugging the engineering team.",
                                author: "Michael Ross",
                                role: "Head of Product at HealthBot",
                                avatar: "MR"
                            },
                            {
                                quote: "Finally, a way to trace token costs and latency per step. Essential for our production monitoring.",
                                author: "David Kim",
                                role: "CTO at AgentFlow",
                                avatar: "DK"
                            }
                        ].map((t, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all backdrop-blur-sm h-full flex flex-col">
                                    <div className="mb-6">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className="text-yellow-500 text-lg">★</span>
                                        ))}
                                    </div>
                                    <blockquote className="text-slate-300 text-lg leading-relaxed flex-1 mb-6">
                                        "{t.quote}"
                                    </blockquote>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
                                            {t.avatar}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">{t.author}</div>
                                            <div className="text-slate-500 text-sm">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Architecture Deep Dive */}
            <section className="py-32 bg-slate-900/30 border-y border-white/5">
                <div className="container mx-auto px-6 text-center">
                    <FadeIn>
                        <h2 className="text-3xl font-bold text-white mb-16">{t('BuiltOnGiants.title')}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                            {[
                                { name: "LangGraph", role: "Orchestration" },
                                { name: "AutoGen", role: "Multi-Agent Sim" },
                                { name: "DeepEval", role: "Scoring & Metrics" },
                                { name: "Langfuse", role: "Tracing & Debug" },
                            ].map((tech) => (
                                <div key={tech.name} className="p-6 rounded-xl bg-[#0B0F19] border border-white/5">
                                    <div className="text-indigo-400 font-bold text-xl mb-2">{tech.name}</div>
                                    <div className="text-sm text-slate-500">{tech.role}</div>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* FAQ & CTA */}
            <section className="py-32">
                <div className="container mx-auto px-6 max-w-4xl">
                    <FadeIn>
                        <div className="bg-gradient-to-br from-indigo-900/50 to-violet-900/50 rounded-3xl p-12 text-center border border-indigo-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 blur-[100px] -z-10" />

                            <h2 className="text-4xl font-bold text-white mb-6">{t('CTA.title')}</h2>
                            <p className="text-lg text-indigo-200 mb-8 max-w-2xl mx-auto">
                                {t('CTA.description')}
                            </p>

                            <Link href="/dashboard">
                                <Button size="lg" className="h-14 px-10 bg-white text-indigo-900 hover:bg-indigo-50 text-lg rounded-full font-bold shadow-2xl shadow-indigo-900/20">
                                    <RocketIcon className="w-5 h-5 mr-2" /> {t('CTA.button')}
                                </Button>
                            </Link>
                            <p className="mt-6 text-sm text-indigo-300/60">{t('CTA.footer')}</p>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <footer className="border-t border-white/5 py-12 bg-[#05080F]">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <div className="w-6 h-6 rounded bg-slate-800" />
                        <span>{t('Footer.platform')}</span>
                    </div>
                    <div className="flex gap-8">
                        <Link href="/privacy" className="hover:text-white transition-colors">{t('Footer.privacy')}</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">{t('Footer.terms')}</Link>
                        <a href="https://github.com/langeval/langeval" className="hover:text-white transition-colors">{t('Footer.reddit')}</a>
                        <a href="https://github.com/langeval/langeval" className="hover:text-white transition-colors">{t('Footer.github')}</a>
                    </div>
                </div>
            </footer>

        </div>
    );
}
