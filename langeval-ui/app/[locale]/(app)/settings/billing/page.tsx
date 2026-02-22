"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getBillingPlans, getWorkspaceSubscription, createCheckoutSession, confirmCheckoutSession, getTransactions } from "@/lib/api-client";
import { CheckCircle2Icon, CreditCardIcon, AlertCircleIcon, ZapIcon } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";

export default function BillingPage() {
    const t = useTranslations();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [isYearly, setIsYearly] = useState(false);
    const { currentWorkspace } = useWorkspace();
    const isOwner = currentWorkspace?.role === "OWNER";

    useEffect(() => {
        async function fetchData() {
            try {
                // Determine workspaceId
                const workspaceId = localStorage.getItem("langeval_current_workspace_id");
                if (!workspaceId) throw new Error("No workspace selected");

                // Check for successful checkout and confirm
                const isSuccess = searchParams.get("success");
                const subId = searchParams.get("subscription_id");
                const planId = searchParams.get("plan_id");

                if (isSuccess === "true" && subId) {
                    try {
                        const isYearlyParam = searchParams.get("is_yearly") === "true";
                        await confirmCheckoutSession(subId, planId || undefined, isYearlyParam);
                        // Remove query params to prevent re-triggering
                        router.replace("/settings/billing", { scroll: false });
                    } catch (e) {
                        console.error("Failed to confirm checkout", e);
                    }
                }

                // Fetch data in parallel
                const [plansData, subData, txData] = await Promise.all([
                    getBillingPlans(),
                    getWorkspaceSubscription(workspaceId).catch(() => null),
                    getTransactions(workspaceId).catch(() => [])
                ]);

                // Sort plans to ensure order: Free, Pro, Enterprise
                const order = ["Free", "Pro", "Enterprise"];
                const sortedPlans = (plansData || []).sort((a: any, b: any) =>
                    order.indexOf(a.name) - order.indexOf(b.name)
                );

                setPlans(sortedPlans);
                setSubscription(subData);
                setTransactions(txData || []);

            } catch (err: any) {
                setError(err.message || "Failed to load billing information");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleUpgrade = async (planId: string) => {
        try {
            setCheckoutLoading(planId);

            const res = await createCheckoutSession(planId, isYearly);
            if (res.checkout_url) {
                window.location.href = res.checkout_url;
            }
        } catch (err: any) {
            alert(err.message || "Failed to initiate checkout");
        } finally {
            setCheckoutLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-32 w-full" />
                <div className="grid md:grid-cols-3 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    const currentPlan = subscription?.plan || plans.find(p => p.name === "Free");
    const isPro = currentPlan?.name === "Pro";
    const isEnterprise = currentPlan?.name === "Enterprise";

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        {t("Pricing.billing_title")}
                    </h1>
                    <p className="text-slate-400 text-lg mt-2 font-medium">
                        {t("Pricing.billing_subtitle")}
                    </p>
                </div>
                {subscription?.subscription?.status === 'active' && (
                    <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <CheckCircle2Icon className="w-4 h-4 mr-2" />
                        {t("Pricing.active_subscription")}
                    </Badge>
                )}
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-2">
                    <AlertCircleIcon className="w-5 h-5" /> {error}
                </div>
            )}

            {!isOwner && !loading && (
                <div className="p-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl flex items-center gap-3">
                    <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">{t("Pricing.viewer_notice_title") || "You do not have permission"}</p>
                        <p className="text-sm mt-1">{t("Pricing.viewer_notice_desc") || "Only the Workspace Owner can view invoices and upgrade the subscription. All limits shown here are inherited from the Owner's plan."}</p>
                    </div>
                </div>
            )}

            {/* Current Usage / Plan summary */}
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-[#0B0F19] p-8 md:p-10 shadow-2xl">
                {/* Background glow effects */}
                <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
                <div className="absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8 pb-8 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                <ZapIcon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white">
                                {t("Pricing.current_plan")}: <span className="text-indigo-400 uppercase tracking-tight">{currentPlan?.name || "Free"}</span>
                            </h2>
                        </div>
                        <p className="text-slate-400 text-lg">
                            {t("Pricing.tier_limits", { plan: currentPlan?.name || "Free" })}
                        </p>
                        {subscription?.subscription?.period_end && currentPlan?.name !== "Free" && (
                            <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/50"></span>
                                {subscription.subscription.status === "active" ? t("Pricing.renews_on") : t("Pricing.expires_on")}: <span className="text-slate-300 font-medium">{new Date(subscription.subscription.period_end).toLocaleDateString()}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-[#131B2C] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
                        <div className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-widest group-hover:text-slate-300 transition-colors">
                            {t("Pricing.max_workspaces")}
                        </div>
                        <div className="text-white flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold">{subscription?.usage?.workspaces ?? 0}</span>
                            <span className="text-slate-500 font-bold">/</span>
                            <span className={currentPlan?.features?.max_workspaces < 0 ? "text-xl font-bold" : "text-xl font-bold text-slate-400"}>
                                {currentPlan?.features?.max_workspaces < 0 ? t("Pricing.unlimited") : currentPlan?.features?.max_workspaces || 1}
                            </span>
                        </div>
                    </div>
                    <div className="bg-[#131B2C] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
                        <div className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-widest group-hover:text-slate-300 transition-colors">
                            {t("Pricing.max_scenarios")}
                        </div>
                        <div className="text-white flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold">{subscription?.usage?.scenarios ?? 0}</span>
                            <span className="text-slate-500 font-bold">/</span>
                            <span className={currentPlan?.features?.max_scenarios < 0 ? "text-xl font-bold" : "text-xl font-bold text-slate-400"}>
                                {currentPlan?.features?.max_scenarios < 0 ? t("Pricing.unlimited") : currentPlan?.features?.max_scenarios || 3}
                            </span>
                        </div>
                    </div>
                    <div className="bg-[#131B2C] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
                        <div className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-widest group-hover:text-slate-300 transition-colors">
                            {t("Pricing.monthly_test_runs")}
                        </div>
                        <div className="text-white flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold">{subscription?.usage?.runs ?? 0}</span>
                            <span className="text-slate-500 font-bold">/</span>
                            <span className={currentPlan?.features?.max_runs_per_month < 0 ? "text-xl font-bold" : "text-xl font-bold text-slate-400"}>
                                {currentPlan?.features?.max_runs_per_month < 0 ? t("Pricing.unlimited") : currentPlan?.features?.max_runs_per_month || 50}
                            </span>
                        </div>
                    </div>
                    <div className="bg-[#131B2C] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
                        <div className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-widest group-hover:text-slate-300 transition-colors">
                            {t("Pricing.red_teaming")}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            {currentPlan?.features?.red_teaming ? (
                                <><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse"></div><span className="text-xl font-bold text-white">{t("Pricing.enabled")}</span></>
                            ) : (
                                <><div className="w-3 h-3 rounded-full bg-slate-600"></div><span className="text-xl font-bold text-slate-400">{t("Pricing.disabled")}</span></>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 bg-slate-900/90 rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <h2 className="text-2xl font-bold text-white mb-2 relative z-10 text-center">{t("Pricing.available_plans")}</h2>

                <div className="flex justify-center mb-12 relative z-10">
                    <div className="flex items-center gap-4 bg-[#0B0F19] p-1 rounded-full border border-white/10 mt-6">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isYearly ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                        >
                            {t("Pricing.monthly")}
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isYearly ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                        >
                            {t("Pricing.yearly")}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isYearly ? "bg-white/20 text-white" : "bg-indigo-500/20 text-indigo-400"}`}>
                                {t("Pricing.save20")}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative z-10">
                    {plans.map((plan) => {
                        const isCurrent = currentPlan?.name === plan.name;
                        return (
                            <div key={plan.id} className={`relative p-8 rounded-3xl h-full flex flex-col transition-all ${isCurrent ? "bg-gradient-to-b from-indigo-900/50 to-[#0B0F19] border-2 border-indigo-500 shadow-2xl shadow-indigo-900/20 shadow-indigo-500/20 transform md:-translate-y-2" : "bg-[#0B0F19] border border-white/10 hover:border-white/20"}`}>
                                {isCurrent && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Current Plan
                                    </div>
                                )}
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                    <p className="text-slate-400 text-sm h-10">{t(`Pricing.${plan.name.toLowerCase()}.description`)}</p>
                                </div>
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl text-slate-400 font-bold">$</span>
                                        <span className="text-5xl font-extrabold text-white tracking-tight">{isYearly ? plan.price_annual : plan.price_monthly}</span>
                                        <span className="text-slate-500 mt-1">{isYearly ? t("Pricing.period_yearly") : t(`Pricing.${plan.name.toLowerCase()}.period`)}</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 flex-1 mb-8">
                                    {plan.name === "Free" && (
                                        <>
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                <li key={i} className="flex items-start text-sm text-slate-300">
                                                    <CheckCircle2Icon className={`w-5 h-5 mr-3 shrink-0 ${isCurrent ? "text-indigo-400" : "text-slate-500"}`} />
                                                    <span>{t(`Pricing.free.features.${i}`)}</span>
                                                </li>
                                            ))}
                                        </>
                                    )}
                                    {plan.name === "Pro" && (
                                        <>
                                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                                <li key={i} className="flex items-start text-sm text-slate-300">
                                                    <CheckCircle2Icon className={`w-5 h-5 mr-3 shrink-0 ${isCurrent ? "text-indigo-400" : "text-slate-500"}`} />
                                                    <span>{t(`Pricing.pro.features.${i}`)}</span>
                                                </li>
                                            ))}
                                        </>
                                    )}
                                    {plan.name === "Enterprise" && (
                                        <>
                                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                                <li key={i} className="flex items-start text-sm text-slate-300">
                                                    <CheckCircle2Icon className={`w-5 h-5 mr-3 shrink-0 ${isCurrent ? "text-indigo-400" : "text-slate-500"}`} />
                                                    <span>{t(`Pricing.enterprise.features.${i}`)}</span>
                                                </li>
                                            ))}
                                        </>
                                    )}
                                </ul>
                                <Button
                                    className={`w-full h-12 rounded-xl font-bold text-base transition-all ${isCurrent && plan.name === "Free" ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 cursor-default" : isCurrent && plan.name !== "Free" ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" : "bg-white/5 hover:bg-white/10 text-white border border-white/10"}`}
                                    variant={isCurrent ? "default" : "secondary"}
                                    disabled={
                                        (isCurrent && plan.name === "Free") ||
                                        checkoutLoading === plan.id ||
                                        (isEnterprise && (plan.name === "Pro" || plan.name === "Free")) ||
                                        (isPro && plan.name === "Free") ||
                                        !isOwner
                                    }
                                    onClick={() => handleUpgrade(plan.id)}
                                >
                                    {checkoutLoading === plan.id
                                        ? t("Pricing.processing_button")
                                        : (isCurrent && plan.name === "Free")
                                            ? t("Pricing.active_plan_button")
                                            : (isCurrent && plan.name !== "Free")
                                                ? t("Pricing.extend_subscription")
                                                : ((isEnterprise && (plan.name === "Pro" || plan.name === "Free")) || (isPro && plan.name === "Free"))
                                                    ? t("Pricing.downgrade_unavailable")
                                                    : t("Pricing.upgrade_button")}
                                    {!isCurrent && plan.name !== "Free" && plan.name !== "Pro" && <CreditCardIcon className="w-4 h-4 ml-2" />}
                                    {!isCurrent && plan.name === "Pro" && !isEnterprise && <CreditCardIcon className="w-4 h-4 ml-2" />}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Transaction History Section */}
            <div className="mt-10 bg-slate-900/90 rounded-3xl p-8 border border-white/5 relative z-10">
                <h2 className="text-2xl font-bold text-white mb-6">{t("Pricing.transaction_history")}</h2>
                {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="text-xs uppercase bg-black/20 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">{t("Pricing.date")}</th>
                                    <th className="px-6 py-4 font-semibold">{t("Pricing.paypal_tx_id")}</th>
                                    <th className="px-6 py-4 font-semibold">{t("Pricing.amount")}</th>
                                    <th className="px-6 py-4 font-semibold">{t("Pricing.status.completed").replace('Thành công', 'Trạng thái').replace('Completed', 'Status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transactions.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-white">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {tx.paypal_transaction_id || "-"}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            {tx.currency === "USD" ? "$" : ""}{tx.amount} {tx.currency !== "USD" ? tx.currency : ""}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={tx.status === "completed" ? "default" : "secondary"} className={tx.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}>
                                                {t(`Pricing.status.${tx.status}`)}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 bg-black/20 rounded-xl border-dashed border border-white/10">
                        {t("Pricing.no_transactions")}
                    </div>
                )}
            </div>
        </div>
    );
}
