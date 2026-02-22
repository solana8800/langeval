"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link as I18nLink } from "@/i18n/routing";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Suspense } from "react";

function ErrorContent() {
    const t = useTranslations("AuthError");
    const searchParams = useSearchParams();
    const error = searchParams.get("error") || "Default";

    // Map NextAuth error codes to translations
    const getErrorMessage = (errorCode: string) => {
        return t(errorCode as any) || t("Default");
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col items-center justify-center relative p-6">

            {/* Background Effects matching landing page */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-red-500/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                {/* Logo Section */}
                <div className="flex items-center justify-center gap-3 mb-10 opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        <span className="font-bold text-slate-400 text-xl">E</span>
                    </div>
                    <span className="font-bold text-2xl text-slate-400 tracking-tight">LangEval</span>
                </div>

                {/* Glassmorphic Error Card */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>

                    <div className="relative bg-[#0B0F19]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">{t("title")}</h1>
                        <p className="text-red-400/80 font-medium text-xs mb-6 uppercase tracking-widest">{t("subtitle")}</p>

                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-8">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {getErrorMessage(error)}
                            </p>
                            <p className="text-slate-500 text-[10px] font-mono mt-3 uppercase tracking-tighter">
                                Error Code: {error}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <I18nLink href="/login" className="block">
                                <Button className="w-full h-11 bg-white text-slate-900 hover:bg-slate-200 border-0 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    {t("backToLogin")}
                                </Button>
                            </I18nLink>

                            <I18nLink href="/" className="block">
                                <Button variant="outline" className="w-full h-11 border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    {t("AuthError" as any) /* Dummy to ensure key exists, will use backToHome logic if needed */ ? "Back to home" : ""}
                                </Button>
                            </I18nLink>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <p className="text-slate-500 text-xs italic">
                                {t("contactSupport")}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-500">Loading...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
