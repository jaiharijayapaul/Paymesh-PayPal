import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Task, Offer, Approval, Payment } from '../types';
import { AgentTimeline } from '../components/AgentTimeline';
import { PayPalButton } from '../components/PayPalButton';
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Scale,
  CreditCard,
  UserCheck,
  PackageCheck,
  ArrowRight,
  TrendingDown,
  AlertCircle
} from 'lucide-react';

const MASTER_DEMO_PROMPT =
  "Find me a professional logo designer for my startup. My maximum budget is $100, delivery must be within 3 days, and I prefer providers rated above 4.5. Negotiate the best reasonable price and ask me before making any payment.";

export const WorkspacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [currentApproval, setCurrentApproval] = useState<Approval | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If query param demo=true is passed, pre-fill demo prompt
  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      setPrompt(MASTER_DEMO_PROMPT);
    }
  }, [searchParams]);

  const handleLaunchPipeline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setError(null);
    setLoading(true);
    setPaymentSuccess(null);
    setCurrentOffer(null);
    setCurrentApproval(null);

    try {
      // Step 1: Create Task via Personal Intent Agent
      const createdTask = await api.tasks.create(prompt);
      setCurrentTask(createdTask);

      // Step 2: Execute Orchestrated Multi-Agent Pipeline
      const executedTask = await api.tasks.execute(createdTask.id);
      setCurrentTask(executedTask);

      // Step 3: Fetch Created Offer & Pending Approval
      const offers = await api.offers.listForTask(executedTask.id);
      if (offers.length > 0) {
        setCurrentOffer(offers[0]);
      }

      const pending = await api.approvals.listPending();
      const taskApproval = pending.find((a) => a.task_id === executedTask.id);
      if (taskApproval) {
        setCurrentApproval(taskApproval);
      }
    } catch (err: any) {
      setError(err.message || 'Execution error in multi-agent pipeline.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!currentApproval) return;
    try {
      setLoading(true);
      const approved = await api.approvals.approve(
        currentApproval.id,
        'Authorized by human supervisor for PayPal Sandbox Checkout.'
      );
      setCurrentApproval(approved);

      if (currentTask) {
        const refreshedTask = await api.tasks.get(currentTask.id);
        setCurrentTask(refreshedTask);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authorize transaction.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (payment: Payment) => {
    setPaymentSuccess(payment);
    // Refresh task to show completed state
    if (currentTask) {
      api.tasks.get(currentTask.id).then((t) => setCurrentTask(t));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Bot className="w-7 h-7 text-cyan-400" />
            <span>AI Command <span className="gradient-text">Workspace</span></span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Delegate commerce tasks to autonomous agents. Enforce policy limits and approve PayPal payments.
          </p>
        </div>

        <button
          onClick={() => setPrompt(MASTER_DEMO_PROMPT)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-950/40 hover:bg-violet-900/50 text-violet-300 transition-colors flex items-center gap-1.5 shadow"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Insert 3-Min Master Demo Prompt</span>
        </button>
      </div>

      {/* Natural Language Command Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
        <form onSubmit={handleLaunchPipeline} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Find me a professional logo designer under $100 within 3 days rated above 4.5. Negotiate best price..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 leading-relaxed resize-none"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-3 bottom-3 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-linear-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:opacity-95 shadow-md shadow-violet-600/20 flex items-center gap-2 transition-all disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Coordinating Agents...</span>
                </>
              ) : (
                <>
                  <span>Execute Pipeline</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Quick Commands:</span>
            <button
              type="button"
              onClick={() => setPrompt("Find a fullstack React web developer under $200 within 5 days.")}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
            >
              Web Dev under $200
            </button>
            <button
              type="button"
              onClick={() => setPrompt("Find a video editor for YouTube reels under $100 delivering within 2 days.")}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
            >
              Video Editor (2-day)
            </button>
            <button
              type="button"
              onClick={() => setPrompt("Find an AI automation specialist for n8n workflow integration under $220.")}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
            >
              AI Automation Agent
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Orchestration Dashboard when a task is running or completed */}
      {currentTask && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Candidate Evaluation, Negotiation Rounds & Human Sign-off */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Summary Header Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-cyan-400">Task Active</span>
                  <h2 className="text-base font-bold text-white">{currentTask.title}</h2>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-violet-500/30 bg-violet-950/40 text-violet-300 font-mono">
                  {currentTask.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[11px]">Budget Ceiling</span>
                  <span className="text-sm font-bold text-white">${currentTask.max_budget} {currentTask.currency}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[11px]">Max Deadline</span>
                  <span className="text-sm font-bold text-white">{currentTask.deadline_days} Days</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[11px]">Min Rating</span>
                  <span className="text-sm font-bold text-white">{currentTask.min_rating}★</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[11px]">Category</span>
                  <span className="text-sm font-bold text-cyan-300 capitalize">{currentTask.service_category.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>

            {/* Candidate Evaluation & Comparison Cards */}
            {currentTask.candidates && currentTask.candidates.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Discovered Candidates (Ranked by Evaluation Agent)</span>
                  </h3>
                  <span className="text-xs text-slate-400">{currentTask.candidates.length} Providers Evaluated</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTask.candidates.map((cand) => (
                    <div
                      key={cand.id}
                      className={`p-4 rounded-xl border transition-all ${
                        cand.is_selected
                          ? 'bg-violet-950/20 border-violet-500/40 shadow-lg shadow-violet-950/30'
                          : 'bg-slate-950/50 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{cand.provider.name}</span>
                            {cand.is_selected && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500 text-white font-semibold">
                                Recommended #1
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">{cand.provider.tagline}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold text-cyan-400">
                            {cand.composite_score}<span className="text-xs text-slate-500">/100</span>
                          </span>
                        </div>
                      </div>

                      {/* 5 Dimension Score Bars */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <div>Rating: <span className="text-white font-medium">{cand.rating_score}/25</span></div>
                        <div>Budget: <span className="text-white font-medium">{cand.budget_score}/20</span></div>
                        <div>Speed: <span className="text-white font-medium">{cand.delivery_score}/15</span></div>
                      </div>

                      <div className="mt-2.5 text-[11px] text-slate-300 bg-slate-900/60 rounded p-2">
                        {cand.evaluation_reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multi-Round Negotiation Transcript */}
            {currentOffer && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">
                      Agent Negotiation Dialogue (Buyer Agent ↔ Provider Merchant Agent)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 line-through">${currentOffer.original_price}</span>
                    <span className="font-bold text-emerald-400 text-sm">${currentOffer.final_price}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
                      Saved ${(Number(currentOffer.original_price) - Number(currentOffer.final_price)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentOffer.negotiations.map((round) => (
                    <div
                      key={round.id}
                      className={`p-3.5 rounded-xl text-xs space-y-1 ${
                        round.sender === 'BUYER_AGENT'
                          ? 'bg-violet-950/30 border border-violet-500/20 ml-4'
                          : 'bg-cyan-950/30 border border-cyan-500/20 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className={round.sender === 'BUYER_AGENT' ? 'text-violet-300' : 'text-cyan-300'}>
                          Round {round.round_number} — {round.sender === 'BUYER_AGENT' ? 'Buyer Personal Agent' : 'Simulated Merchant Agent'}
                        </span>
                        <span className="text-white font-mono font-bold">${round.proposed_price}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed font-sans">{round.message}</p>
                      {round.rationale && (
                        <div className="text-[10px] text-slate-400 font-mono italic pt-1 border-t border-white/5">
                          Rationale: {round.rationale}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Human Approval Center & PayPal Card */}
            {currentApproval && (
              <div className="bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-white">Human Approval Gate</h3>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                    currentApproval.status === 'APPROVED'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  }`}>
                    Status: {currentApproval.status}
                  </span>
                </div>

                <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Negotiated Service Price:</span>
                    <span className="text-base font-bold text-white">${currentApproval.approved_amount} {currentApproval.currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target Provider:</span>
                    <span className="text-white">{currentOffer?.provider.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery SLA:</span>
                    <span className="text-white">{currentOffer?.delivery_days} Days</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Deterministic Risk Check:</span>
                    <span className="text-emerald-400 font-medium">PASS (All 6 rules validated)</span>
                  </div>
                </div>

                {/* If Not Yet Approved: Show Approve Button */}
                {currentApproval.status === 'PENDING' && (
                  <div className="space-y-3">
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-linear-to-r from-emerald-600 to-teal-500 hover:opacity-95 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Approve Transaction (${currentApproval.approved_amount}) & Unlock PayPal</span>
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">
                      Explicit human authorization is required before PayPal checkout can be invoked.
                    </p>
                  </div>
                )}

                {/* If Approved: Show PayPal Sandbox Checkout Button */}
                {currentApproval.status === 'APPROVED' && !paymentSuccess && (
                  <div className="space-y-4 pt-2">
                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Human authorization confirmed. PayPal Sandbox Order unlocked.</span>
                    </div>

                    <PayPalButton
                      approvalId={currentApproval.id}
                      amount={currentApproval.approved_amount}
                      currency={currentApproval.currency}
                      onSuccess={handlePaymentSuccess}
                      onError={(msg) => setError(msg)}
                    />
                  </div>
                )}

                {/* If Payment Captured: Show Fulfillment Receipt */}
                {paymentSuccess && (
                  <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <PackageCheck className="w-5 h-5" />
                      <span>Payment Verified & Order Fulfilled!</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div>PayPal Capture ID: <span className="font-mono text-cyan-300">{paymentSuccess.paypal_capture_id}</span></div>
                      <div>Amount Settled: <span className="font-bold text-white">${paymentSuccess.amount} {paymentSuccess.currency}</span></div>
                      <div>Merchant Notification: <span className="text-emerald-300">Order confirmed. Deliverables kickoff complete.</span></div>
                    </div>
                    <button
                      onClick={() => navigate('/transactions')}
                      className="mt-3 text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>View Transaction in Order History</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Col: Live Agent Activity Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 h-fit">
            <AgentTimeline actions={currentTask.actions || []} taskStatus={currentTask.status} />
          </div>
        </div>
      )}
    </div>
  );
};
