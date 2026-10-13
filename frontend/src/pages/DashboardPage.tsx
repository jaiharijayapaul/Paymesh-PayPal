import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardSummary, DashboardActivityItem, Approval } from '../types';
import {
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scale,
  RefreshCw,
  Plus
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<DashboardActivityItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, actRes, appRes] = await Promise.all([
        api.dashboard.getSummary(),
        api.dashboard.getActivity(),
        api.approvals.listPending()
      ]);
      setSummary(sumRes);
      setActivity(actRes);
      setPendingApprovals(appRes);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with Title and Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Autonomous Commerce <span className="gradient-text">Command Center</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-agent activity, transaction ledgers, and human governance oversight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/workspace"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-violet-600 to-cyan-500 hover:opacity-95 shadow-md shadow-violet-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Commerce Task</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row: Real values calculated from persisted records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Pending Human Approvals */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {summary ? summary.pending_approvals : 0}
            </span>
            <span className="text-xs text-amber-400 font-medium">Requires signature</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Awaiting explicit buyer authorization before PayPal capture.
          </p>
        </div>

        {/* Metric 2: Estimated Negotiated Savings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Negotiated Savings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">
              ${summary ? Number(summary.estimated_negotiated_savings || 0).toFixed(2) : '0.00'}
            </span>
            <span className="text-xs text-emerald-300 font-mono">
              ({summary ? Number(summary.average_offer_discount_pct || 0) : 0}% avg)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Saved by Buyer Agent negotiating with Provider Merchant Agents.
          </p>
        </div>

        {/* Metric 3: Completed Sandbox Payments */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">PayPal Sandbox Volume</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              ${summary ? Number(summary.total_sandbox_transaction_value || 0).toFixed(2) : '0.00'}
            </span>
            <span className="text-xs text-cyan-400 font-medium">
              {summary ? summary.completed_sandbox_payments : 0} orders
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Total captured sandbox funds verified server-side.
          </p>
        </div>

        {/* Metric 4: Active Multi-Agent Tasks */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Tasks / Orders</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {summary ? summary.active_tasks : 0}
            </span>
            <span className="text-xs text-violet-300">
              ({summary ? summary.orders_in_progress : 0} in progress)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Autonomous discovery, evaluation, or delivery stages.
          </p>
        </div>
      </div>

      {/* Pending Approvals Alert Banner (if any) */}
      {pendingApprovals.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {pendingApprovals.length} Transaction{pendingApprovals.length > 1 ? 's' : ''} Awaiting Your Approval
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                AI agents completed negotiation and passed deterministic risk checks. Human authorization is mandatory.
              </p>
            </div>
          </div>
          <Link
            to="/approvals"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Review & Authorize</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Grid: Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Chronological Real Agent Activity Feed */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Real-Time Multi-Agent Activity Ledger
              </h3>
            </div>
            <span className="text-xs text-slate-400">Persisted Records</span>
          </div>

          {activity.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No recent activity recorded. Submit a prompt in the AI Workspace to start!
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      {item.status && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-cyan-300">
                          {item.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {item.amount !== undefined && item.amount !== null && (
                      <span className="text-xs font-bold text-emerald-400 block mt-1">
                        ${Number(item.amount).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Quick 3-Minute Demo Launcher Card */}
        <div className="space-y-6">
          <div className="bg-linear-to-br from-violet-950/40 via-slate-900/90 to-cyan-950/40 border border-violet-500/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-950/60 text-violet-300 text-xs font-medium">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>3-Minute Master Demo Flow</span>
            </div>

            <h3 className="text-lg font-bold text-white">Experience End-to-End Autonomous Commerce</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Launch the official hackathon demonstration: An end-to-end task requiring $100 budget cap, 3-day deadline, candidate ranking, negotiation from $110 to $98, policy checks, and PayPal Sandbox Checkout.
            </p>

            <Link
              to="/workspace?demo=true"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-linear-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-all text-center"
            >
              <span>Launch 3-Minute Master Demo</span>
              <ArrowRight className="w-3.5 h-3.5 inline" />
            </Link>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Environment Verification</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="font-mono text-cyan-400">PayPal Sandbox v2</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">AI Reasoning:</span>
                <span className="font-mono text-violet-400">Structured Pydantic</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Policy Authorization:</span>
                <span className="font-mono text-emerald-400">Deterministic Guard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
