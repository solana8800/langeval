"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link as I18nLink } from "@/i18n/routing";
import { ArrowLeft, ArrowRight, GithubIcon } from "lucide-react";

export default function LoginPage() {
    const t = useTranslations("Login");

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl: "/dashboard" });
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col items-center justify-center relative p-6">

            {/* Background Effects matching landing page */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md z-10"
            >
                {/* Logo Section */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    <I18nLink href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                            <span className="font-bold text-white text-xl">E</span>
                        </div>
                        <span className="font-bold text-2xl text-white tracking-tight">LangEval</span>
                    </I18nLink>
                </div>

                {/* Glassmorphic Card */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>

                    <div className="relative bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                        <div className="text-center space-y-2 mb-8">
                            <h1 className="text-3xl font-bold text-white tracking-tight">{t("title")}</h1>
                            <p className="text-indigo-400 font-medium text-sm px-4 py-1.5 bg-indigo-500/10 rounded-full inline-block border border-indigo-500/20">
                                {t("subtitle")}
                            </p>
                            <p className="text-slate-400 text-sm pt-2 leading-relaxed">
                                {t("description")}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Button
                                className="w-full h-12 flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-200 border-0 rounded-xl font-bold shadow-lg shadow-white/5 transition-all text-base"
                                onClick={handleGoogleLogin}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {t("googleButton")}
                            </Button>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/5"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-transparent px-2 text-slate-500 font-mono tracking-widest">{t("demoNotice") ? "OR" : ""}</span>
                                </div>
                            </div>

                            {t("demoNotice") && (
                                <I18nLink href="/dashboard" className="block">
                                    <Button variant="outline" className="w-full h-auto py-3 border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl text-sm transition-all group flex items-center justify-center text-center">
                                        <span className="whitespace-normal leading-tight">{t("demoNotice")}</span>
                                        <ArrowRight className="w-4 h-4 ml-2 shrink-0 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </I18nLink>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <I18nLink href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors text-sm font-medium">
                                <ArrowLeft className="w-4 h-4" />
                                {t("backToHome")}
                            </I18nLink>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="mt-8 text-center text-xs text-slate-600 font-medium"
                >
                    {t("footer")}
                </motion.div>
            </motion.div>
        </div>
    );
}
