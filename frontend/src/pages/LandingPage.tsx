import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Logo } from '../components/Logo';
import {
  Bot,
  ShieldCheck,
  Scale,
  CreditCard,
  ArrowRight,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  TrendingUp,
  Cpu
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
        {/* Futuristic Ambient Glow Backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/20 via-cyan-500/20 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-violet-600/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-medium mb-8 backdrop-blur-md shadow-lg shadow-cyan-950/40">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Multi-Agent Commerce Network • PayPal Sandbox Orders v2</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Connect Intelligence. <br />
            <span className="gradient-text">Transact Trustfully.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            PayMesh empowers buyers to delegate service discovery, provider evaluation, and price negotiation to autonomous AI agents — backed by deterministic policy engines and strict human sign-off before PayPal settlement.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/workspace"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:opacity-95 transition-all shadow-xl shadow-violet-600/25 flex items-center justify-center gap-2 group"
            >
              <span>Launch AI Command Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/marketplace"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <StoreIcon className="w-4 h-4 text-cyan-400" />
              <span>Browse Service Marketplace</span>
            </Link>
          </div>

          {/* Interactive Flow Preview Card */}
          <div className="mt-16 max-w-4xl mx-auto bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">paymesh-agent-network.live</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 font-mono">
                5 Coordinated Agents
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-left">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] font-mono text-violet-400 uppercase">Agent 01</div>
                <div className="font-semibold text-xs text-white">Intent Agent</div>
                <p className="text-[11px] text-slate-400">Extracts budget cap ($100), deadline (3d), and category.</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] font-mono text-cyan-400 uppercase">Agent 02</div>
                <div className="font-semibold text-xs text-white">Discovery Agent</div>
                <p className="text-[11px] text-slate-400">Scans database for verified designers meeting quality criteria.</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] font-mono text-emerald-400 uppercase">Agent 03</div>
                <div className="font-semibold text-xs text-white">Evaluation Agent</div>
                <p className="text-[11px] text-slate-400">Ranks candidates across 5 dimensions with clear scoring.</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] font-mono text-amber-400 uppercase">Agent 04</div>
                <div className="font-semibold text-xs text-white">Negotiation Agent</div>
                <p className="text-[11px] text-slate-400">Negotiates $110 down to $98 against merchant floor.</p>
              </div>
              <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-3.5 space-y-1 bg-emerald-950/10">
                <div className="text-[11px] font-mono text-emerald-400 uppercase">Human Approval</div>
                <div className="font-semibold text-xs text-white">PayPal Checkout</div>
                <p className="text-[11px] text-slate-300">Mandatory human click authorizes $98 PayPal order.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Designed for High-Assurance AI Commerce
            </h2>
            <p className="mt-3 text-slate-400 text-base">
              Autonomous agents should never have unchecked access to your wallet. PayMesh establishes deterministic security gates at every milestone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 hover:border-violet-500/40 transition-colors space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Agent Negotiation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Buyer and provider merchant agents negotiate iteratively. Financial constraints, reservation prices, and offer deadlines are enforced by immutable backend code.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 hover:border-cyan-500/40 transition-colors space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Deterministic Policy Engine</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Before any transaction is presented for signature, the policy engine verifies budget caps, user limits, currency parity, provider verification, and duplicates.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 hover:border-emerald-500/40 transition-colors space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">PayPal Sandbox Orders v2</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Authentic PayPal checkout flow. Token acquisition, client-side button authorization, server-side capture verification, and webhook event processing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

function StoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}
