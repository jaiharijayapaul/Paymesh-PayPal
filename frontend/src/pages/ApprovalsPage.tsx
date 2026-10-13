import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Approval, Payment } from '../types';
import { PayPalButton } from '../components/PayPalButton';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Lock,
  Loader2,
  Check,
  Scale
} from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeApprovalId, setActiveApprovalId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<Record<string, Payment>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await api.approvals.listPending();
      setApprovals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (approvalId: string) => {
    try {
      setLoading(true);
      const updated = await api.approvals.approve(approvalId, 'Approved by operator via Approval Center.');
      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? updated : a))
      );
      setActiveApprovalId(approvalId);
    } catch (err: any) {
      setError(err.message || 'Failed to approve transaction.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      setLoading(true);
      const updated = await api.approvals.reject(approvalId, 'Rejected by human operator.');
      setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
    } catch (err: any) {
      setError(err.message || 'Failed to reject transaction.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (approvalId: string, payment: Payment) => {
    setPaymentSuccess((prev) => ({ ...prev, [approvalId]: payment }));
    fetchApprovals();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <span>Human Approval <span className="gradient-text">Center</span></span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic financial policy reviews and cryptographic authorization locks.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
          Strict Human Sign-Off Enforced
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {loading && approvals.length === 0 ? (
        <div className="py-24 text-center text-slate-500">
          Loading pending approvals...
        </div>
      ) : approvals.length === 0 ? (
        <div className="py-24 bg-slate-900/60 border border-slate-800 rounded-3xl text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">All Clear! No Pending Approvals</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All AI-negotiated transactions have either been processed or rejected. Launch a new task in the workspace to see approvals here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {approvals.map((approval) => {
            let policyData: any = null;
            try {
              if (approval.policy_details) policyData = JSON.parse(approval.policy_details);
            } catch {
              policyData = null;
            }

            return (
              <div
                key={approval.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
              >
                {/* Top Row: Provider & Amount */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-cyan-400 block mb-1">
                      Offer Version v{approval.offer_version} • Approval ID: {approval.id.slice(0, 8)}
                    </span>
                    <h2 className="text-xl font-bold text-white">
                      Transaction Authorization Package
                    </h2>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-5 py-3 text-right">
                    <span className="text-[11px] text-slate-400 block">Negotiated Lock Amount</span>
                    <span className="text-2xl font-black text-white">
                      ${approval.approved_amount} <span className="text-sm font-normal text-cyan-400">{approval.currency}</span>
                    </span>
                  </div>
                </div>

                {/* Deterministic Policy Engine Checks Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Deterministic Policy Verification (6 Automated Rules)</span>
                  </h4>

                  {policyData?.checks && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {policyData.checks.map((chk: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-slate-300">
                              {chk.rule_name.replace(/_/g, ' ')}
                            </span>
                            {chk.passed ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold">
                                PASS
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 font-bold">
                                FAIL
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{chk.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expiry and Binding Details */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Offer Valid Until: {new Date(approval.expires_at).toLocaleString()}
                  </span>
                  <span className="font-mono text-emerald-400">
                    Policy Engine Status: VERIFIED
                  </span>
                </div>

                {/* Actions: Approve or Reject, or render PayPalButton if already Approved */}
                {approval.status === 'PENDING' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-3">
                    <button
                      onClick={() => handleApprove(approval.id)}
                      className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-emerald-600 to-teal-500 hover:opacity-95 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Proceed to PayPal Checkout (${approval.approved_amount})</span>
                    </button>

                    <button
                      onClick={() => handleReject(approval.id)}
                      className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-semibold text-sm text-slate-400 hover:text-rose-400 bg-slate-950/80 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-500/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Proposal</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2">
                    {paymentSuccess[approval.id] ? (
                      <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs">
                        Payment verified & order captured via PayPal Sandbox!
                      </div>
                    ) : (
                      <PayPalButton
                        approvalId={approval.id}
                        amount={approval.approved_amount}
                        currency={approval.currency}
                        onSuccess={(p) => handlePaymentSuccess(approval.id, p)}
                        onError={(err) => setError(err)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
