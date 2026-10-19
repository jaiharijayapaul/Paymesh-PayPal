import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Task, Offer, Approval, Payment } from '../types';
import { AgentTimeline } from '../components/AgentTimeline';
import { PayPalButton } from '../components/PayPalButton';
import { generatePaymentReceiptPDF } from '../utils/pdfReceipt';
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
  AlertCircle,
  Download,
  Award,
  Radio,
  Check,
  Building,
  Clock,
  DollarSign
} from 'lucide-react';

const MASTER_DEMO_PROMPT =
  "Find me a professional logo designer for my startup. My maximum budget is $100, delivery must be within 3 days, and I prefer providers rated above 4.5. Negotiate the best reasonable price and ask me before making any payment.";

export const WorkspacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [currentApproval, setCurrentApproval] = useState<Approval | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Streaming Agent Workspace State
  const [streamLogs, setStreamLogs] = useState<{ id: string; time: string; agent: string; message: string; phase?: string }[]>([]);
  const [streamingActive, setStreamingActive] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  // Pre-fill demo prompt if requested via query param
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
    setStreamingActive(true);
    setStreamLogs([]);
    setPaymentSuccess(null);
    setCurrentOffer(null);
    setAllOffers([]);
    setCurrentApproval(null);

    try {
      // Step 1: Create Task via Personal Intent Agent
      const createdTask = await api.tasks.create(prompt);
      setCurrentTask(createdTask);

      setStreamLogs([
        {
          id: 'init-1',
          time: new Date().toLocaleTimeString(),
          agent: 'Personal Intent Agent',
          phase: 'INTENT',
          message: 'Initiated autonomous multi-agent pipeline. Extracting financial bounds & constraints...',
        },
      ]);

      // Step 2: Connect to Real-Time SSE Stream
      api.tasks.stream(
        createdTask.id,
        async (event) => {
          setStreamLogs((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              time: new Date().toLocaleTimeString(),
              agent: event.agent || 'Agent Orchestrator',
              phase: event.phase || 'COORDINATION',
              message: event.message,
            },
          ]);

          if (event.event === 'PIPELINE_COMPLETE') {
            setStreamingActive(false);
            setLoading(false);

            // Fetch refreshed task, all competitive offers, and pending approvals
            const [refreshedTask, offers, pending] = await Promise.all([
              api.tasks.get(createdTask.id),
              api.offers.listForTask(createdTask.id),
              api.approvals.listPending(),
            ]);

            setCurrentTask(refreshedTask);
            setAllOffers(offers);
            const proposed = offers.find((o) => o.status === 'PROPOSED') || offers[0];
            if (proposed) {
              setCurrentOffer(proposed);
            }
            const taskApproval = pending.find((a) => a.task_id === createdTask.id);
            if (taskApproval) {
              setCurrentApproval(taskApproval);
            }
          } else if (event.event === 'STEP_FAILED') {
            setStreamingActive(false);
            setLoading(false);
            setError(event.message || 'Execution halted by agent guardrail.');
            const refreshedTask = await api.tasks.get(createdTask.id);
            setCurrentTask(refreshedTask);
          }
        },
        async (err) => {
          console.warn('SSE stream closed, falling back to sync check:', err);
          try {
            const executedTask = await api.tasks.execute(createdTask.id);
            setCurrentTask(executedTask);
            const [offers, pending] = await Promise.all([
              api.offers.listForTask(executedTask.id),
              api.approvals.listPending(),
            ]);
            setAllOffers(offers);
            if (offers.length > 0) {
              setCurrentOffer(offers.find((o) => o.status === 'PROPOSED') || offers[0]);
            }
            const taskApproval = pending.find((a) => a.task_id === executedTask.id);
            if (taskApproval) setCurrentApproval(taskApproval);
          } catch (e: any) {
            setError(e.message || 'Pipeline execution failed.');
          } finally {
            setStreamingActive(false);
            setLoading(false);
          }
        }
      );
    } catch (err: any) {
      setError(err.message || 'Execution error in multi-agent pipeline.');
      setStreamingActive(false);
      setLoading(false);
    }
  };

  const handleSelectOffer = async (offerId: string) => {
    try {
      setLoading(true);
      await api.offers.select(offerId);
      if (currentTask) {
        const [refreshedTask, offers, pending] = await Promise.all([
          api.tasks.get(currentTask.id),
          api.offers.listForTask(currentTask.id),
          api.approvals.listPending(),
        ]);
        setCurrentTask(refreshedTask);
        setAllOffers(offers);
        const selected = offers.find((o) => o.id === offerId);
        if (selected) setCurrentOffer(selected);
        const taskApproval = pending.find((a) => a.task_id === currentTask.id);
        if (taskApproval) setCurrentApproval(taskApproval);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch offer.');
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
    if (currentTask) {
      api.tasks.get(currentTask.id).then((t) => setCurrentTask(t));
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      setDownloadingReceipt(true);
      const receipt = await api.payments.getReceipt(paymentId);
      generatePaymentReceiptPDF(receipt);
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF receipt.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Bot className="w-7 h-7 text-cyan-400" />
            <span>AI Command <span className="gradient-text">Workspace</span></span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Delegate commerce tasks to autonomous agents with real-time SSE streaming, competitive multi-bidding, and PayPal Sandbox settlement.
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
                  <span>Autonomous Orchestration Active...</span>
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

      {/* Feature 1: Real-Time Streaming Thought Feed */}
      {(streamingActive || streamLogs.length > 0) && (
        <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                {streamingActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${streamingActive ? 'bg-cyan-500' : 'bg-emerald-500'}`}></span>
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Real-Time Autonomous Agent Stream (SSE Live Feed)</span>
              </h3>
            </div>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono ${
              streamingActive ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 animate-pulse' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
            }`}>
              {streamingActive ? 'STREAMING ACTIVE' : 'STREAM SYNCHRONIZED'}
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs font-mono">
            {streamLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 p-2 rounded bg-slate-900/60 border border-slate-800/80 animate-fadeIn">
                <span className="text-[10px] text-slate-500 shrink-0">{log.time}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-violet-950/60 text-violet-300 border border-violet-500/30 shrink-0">
                  {log.agent}
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Orchestration Dashboard */}
      {currentTask && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols */}
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

            {/* Feature 2: Competitive Multi-Provider Bidding Matrix */}
            {allOffers && allOffers.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">
                      Competitive Multi-Vendor Bidding Matrix
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {allOffers.length} Competing Providers Negotiated in Parallel
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {allOffers.map((offer) => {
                    const isWinning = offer.id === currentOffer?.id;
                    const savings = Number(offer.original_price) - Number(offer.final_price);
                    const savingsPct = offer.original_price > 0 ? ((savings / Number(offer.original_price)) * 100).toFixed(1) : '0';

                    return (
                      <div
                        key={offer.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          isWinning
                            ? 'bg-linear-to-b from-violet-950/40 to-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            {isWinning ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                                <Award className="w-3 h-3 text-cyan-300" />
                                <span>Designated Winning Bid</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                Competitive Counteroffer
                              </span>
                            )}
                            <span className="text-xs font-bold text-amber-400">{offer.provider.rating}★</span>
                          </div>

                          <h4 className="text-sm font-bold text-white">{offer.provider.name}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{offer.provider.tagline}</p>

                          {/* Pricing Comparison */}
                          <div className="mt-4 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">Catalog Rate:</span>
                              <span className="text-slate-400 line-through">${offer.original_price}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-300 font-medium">Negotiated Bid:</span>
                              <span className="text-base font-extrabold text-emerald-400">${offer.final_price}</span>
                            </div>
                            <div className="pt-1 border-t border-slate-800 flex justify-between items-center text-[11px]">
                              <span className="text-slate-400">Discount:</span>
                              <span className="text-emerald-300 font-mono font-semibold">
                                -${savings.toFixed(2)} ({savingsPct}%)
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>SLA Delivery: <strong className="text-slate-200">{offer.delivery_days} Days</strong></span>
                            <span>Rounds: <strong className="text-slate-200">{offer.negotiations.length}</strong></span>
                          </div>
                        </div>

                        {/* Switch Bid Button */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          {isWinning ? (
                            <div className="w-full py-1.5 text-center text-[11px] font-semibold text-cyan-300 bg-cyan-950/40 rounded border border-cyan-500/20 flex items-center justify-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Active Winning Proposal</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSelectOffer(offer.id)}
                              disabled={loading}
                              className="w-full py-1.5 px-2 rounded text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
                            >
                              <span>Switch to this Bid</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Candidate Evaluation & Comparison Cards */}
            {currentTask.candidates && currentTask.candidates.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Evaluation Agent 5-Dimension Scoring</span>
                  </h3>
                  <span className="text-xs text-slate-400">{currentTask.candidates.length} Providers Scored</span>
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
                      Agent Negotiation Dialogue: {currentOffer.provider.name}
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
                    <span className="text-white font-medium">{currentOffer?.provider.name}</span>
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

                {/* If Not Yet Approved */}
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

                {/* If Approved: Show PayPal Sandbox Checkout */}
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

                {/* Feature 3: Payment Capture & Download Official Cryptographic PDF Receipt */}
                {paymentSuccess && (
                  <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <PackageCheck className="w-5 h-5" />
                      <span>Payment Verified & Order Fulfilled!</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div>PayPal Capture ID: <span className="font-mono text-cyan-300">{paymentSuccess.paypal_capture_id}</span></div>
                      <div>Amount Settled: <span className="font-bold text-white">${paymentSuccess.amount} {paymentSuccess.currency}</span></div>
                      <div>Merchant Notification: <span className="text-emerald-300">Order confirmed. Deliverables kickoff complete.</span></div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => handleDownloadReceipt(paymentSuccess.id)}
                        disabled={downloadingReceipt}
                        className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-linear-to-r from-cyan-600 to-blue-600 hover:opacity-95 text-white transition-all flex items-center justify-center gap-2 shadow"
                      >
                        {downloadingReceipt ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Generating PDF...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Official Verifiable PDF Receipt</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => navigate('/transactions')}
                        className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>View in Order History</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
