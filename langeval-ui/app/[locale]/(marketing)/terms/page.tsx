"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Scale, AlertCircle, CheckCircle } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-indigo-500/30">

            {/* Header */}
            <div className="border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <div className="font-bold text-white tracking-tight">LangEval Legal</div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-20 max-w-5xl">
                <div className="flex flex-col lg:flex-row gap-16">

                    {/* Sidebar / Table of Contents */}
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-32 space-y-8">
                            <div>
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-400" />
                                    Terms of Service
                                </h3>
                                <ul className="space-y-3 text-sm border-l border-white/10 pl-4">
                                    <li><a href="#acceptance" className="text-slate-400 hover:text-indigo-400 block transition-colors">1. Acceptance</a></li>
                                    <li><a href="#license" className="text-slate-400 hover:text-indigo-400 block transition-colors">2. License & Limits</a></li>
                                    <li><a href="#liability" className="text-slate-400 hover:text-indigo-400 block transition-colors">3. Liability Limits</a></li>
                                    <li><a href="#termination" className="text-slate-400 hover:text-indigo-400 block transition-colors">4. Termination</a></li>
                                    <li><a href="#governing" className="text-slate-400 hover:text-indigo-400 block transition-colors">5. Governing Law</a></li>
                                </ul>
                            </div>
                            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                                <p className="text-xs text-indigo-200 mb-2 font-medium">Compliance Contact</p>
                                <a href="mailto:solana8800@gmail.com" className="text-sm font-bold text-white hover:text-indigo-400">solana8800@gmail.com</a>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Terms of Service</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Effective Date</span>
                                <span>February 14, 2026</span>
                            </div>
                        </div>

                        <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-indigo-400 prose-strong:text-white">
                            <p className="lead text-xl text-slate-400">
                                Welcome to LangEval. These Terms of Service ("Terms") constitute a legally binding agreement between you ("Customer") and LangEval Inc. regarding your use of our AI evaluation platform and SDKs.
                            </p>

                            <hr className="border-white/10 my-12" />

                            <section id="acceptance">
                                <h2 className="flex items-center gap-3">
                                    <Scale className="w-6 h-6 text-indigo-400" /> 1. Acceptance of Terms
                                </h2>
                                <p>
                                    By registering for an account, installing our SDK, or accessing our services, you confirm that you differencing authority to bind your organization to these terms. If you do not agree, you must not access the Service.
                                </p>
                            </section>

                            <section id="license">
                                <h2 className="flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-indigo-400" /> 2. License & Usage Limits
                                </h2>
                                <p>
                                    Subject to these Terms, LangEval grants you a limited, non-exclusive, non-transferable license to:
                                </p>
                                <ul>
                                    <li>Use the LangEval Platform for internal testing and evaluation of AI models.</li>
                                    <li>Integrate the `langeval-sdk` into your applications.</li>
                                </ul>
                                <p>
                                    <strong>Restrictions:</strong> You may not reverse engineer the platform, use the service to build a competitive product, or exceed the rate limits specified in your plan.
                                </p>
                            </section>

                            <section id="liability">
                                <h2 className="flex items-center gap-3">
                                    <AlertCircle className="w-6 h-6 text-indigo-400" /> 3. Limitation of Liability
                                </h2>
                                <p>
                                    To the maximum extent permitted by law, LangEval shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits or data.
                                </p>
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-200 mt-4">
                                    <strong>Red Teaming Disclaimer:</strong> Our adversarial simulation tools are designed for safety testing. You are responsible for ensuring that your use of these tools complies with the Terms of Service of the LLM providers you are testing (e.g., OpenAI, Anthropic).
                                </div>
                            </section>

                            <section id="termination">
                                <h2>4. Termination</h2>
                                <p>
                                    We may suspend or terminate your access immediately if you violate these Terms, particularly regarding the malicious use of our red-teaming infrastructure. You may terminate your account at any time by contacting support.
                                </p>
                            </section>

                            <section id="governing">
                                <h2>5. Governing Law</h2>
                                <p>
                                    These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 py-12 bg-[#05080F]">
                <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
                    &copy; 2026 LangEval Platform. All rights reserved.
                </div>
            </div>
        </div>
    );
}
