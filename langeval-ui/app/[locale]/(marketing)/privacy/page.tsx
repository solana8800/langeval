"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPage() {
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
                                    <Shield className="w-4 h-4 text-indigo-400" />
                                    Privacy Policy
                                </h3>
                                <ul className="space-y-3 text-sm border-l border-white/10 pl-4">
                                    <li><a href="#collection" className="text-slate-400 hover:text-indigo-400 block transition-colors">1. Data Collection</a></li>
                                    <li><a href="#usage" className="text-slate-400 hover:text-indigo-400 block transition-colors">2. How We Use Data</a></li>
                                    <li><a href="#sharing" className="text-slate-400 hover:text-indigo-400 block transition-colors">3. Data Sharing</a></li>
                                    <li><a href="#security" className="text-slate-400 hover:text-indigo-400 block transition-colors">4. Security Measures</a></li>
                                    <li><a href="#rights" className="text-slate-400 hover:text-indigo-400 block transition-colors">5. Your Rights</a></li>
                                </ul>
                            </div>
                            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                                <p className="text-xs text-indigo-200 mb-2 font-medium">Have questions?</p>
                                <a href="mailto:solana8800@gmail.com" className="text-sm font-bold text-white hover:text-indigo-400">solana8800@gmail.com</a>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Privacy Policy</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Version 2.1</span>
                                <span>Last Updated: February 14, 2026</span>
                            </div>
                        </div>

                        <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-indigo-400 prose-strong:text-white">
                            <p className="lead text-xl text-slate-400">
                                At LangEval, we believe that trust is the foundation of AI evaluation. This policy outlines our comprehensive approach to handling your data with the security and transparency required for enterprise deployments.
                            </p>

                            <hr className="border-white/10 my-12" />

                            <section id="collection">
                                <h2 className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 text-lg font-bold">1</span>
                                    Data Collection
                                </h2>
                                <p>
                                    We minimize data collection to what is strictly necessary for providing our evaluation services. When you use our SDK or platform, we may process:
                                </p>
                                <ul>
                                    <li><strong>Account Information:</strong> Name, email address, strictly for authentication and billing.</li>
                                    <li><strong>Evaluation Traces:</strong> Inputs and outputs of your AI Agents sent via our SDK. PII Masking is enabled by default to ensure sensitive customer data does not leave your premises in raw form.</li>
                                    <li><strong>Usage Telemetry:</strong> Anonymized metrics on SDK version, latency, and error rates to improve system stability.</li>
                                </ul>
                            </section>

                            <section id="usage">
                                <h2 className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 text-lg font-bold">2</span>
                                    How We Use Data
                                </h2>
                                <p>
                                    Your evaluation data belongs to you. We do not train our internal models on your evaluation datasets or agent outputs. We strict use your data to:
                                </p>
                                <ul>
                                    <li>Provide real-time scoring and observability dashboards.</li>
                                    <li>Generate automated red-teaming reports.</li>
                                    <li>Detect anomalies in your agent's performance.</li>
                                </ul>
                            </section>

                            <section id="sharing">
                                <h2 className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 text-lg font-bold">3</span>
                                    Data Sharing & Subprocessors
                                </h2>
                                <p>
                                    We do not sell your data. We share data only with trusted infrastructure providers (e.g., AWS, Cloudflare) bound by strict DPA (Data Processing Agreements). A full list of subprocessors is available upon request.
                                </p>
                            </section>

                            <section id="security">
                                <h2 className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 text-lg font-bold">4</span>
                                    Security Measures
                                </h2>
                                <p>
                                    We implement defense-in-depth security strategies:
                                </p>
                                <div className="grid md:grid-cols-2 gap-4 not-prose my-6">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <Lock className="w-5 h-5 text-indigo-400 mb-2" />
                                        <h4 className="font-bold text-white text-sm mb-1">Encryption</h4>
                                        <p className="text-xs text-slate-400">AES-256 encryption at rest and TLS 1.3 in transit.</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <Eye className="w-5 h-5 text-indigo-400 mb-2" />
                                        <h4 className="font-bold text-white text-sm mb-1">Access Control</h4>
                                        <p className="text-xs text-slate-400">Strict role-based access (RBAC) and audit logging.</p>
                                    </div>
                                </div>
                            </section>

                            <section id="rights">
                                <h2 className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 text-lg font-bold">5</span>
                                    Your Rights
                                </h2>
                                <p>
                                    Under GDPR, CCPA, and other privacy laws, you have the right to request access, correction, or deletion of your personal data. You can export all your evaluation data via our API at any time.
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
