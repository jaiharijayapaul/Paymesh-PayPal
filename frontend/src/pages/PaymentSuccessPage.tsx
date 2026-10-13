import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, Receipt } from 'lucide-react';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const payerId = searchParams.get('PayerID');

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PayPal Sandbox Verified</span>
          </div>
          <h2 className="text-2xl font-black text-white">Payment Authorized!</h2>
          <p className="text-xs text-slate-400">
            PayPal has successfully approved your sandbox checkout transaction.
          </p>
        </div>

        {(token || payerId) && (
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-left space-y-2 text-xs font-mono">
            {token && (
              <div className="flex justify-between">
                <span className="text-slate-500">Order Token:</span>
                <span className="text-cyan-300">{token}</span>
              </div>
            )}
            {payerId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Payer ID:</span>
                <span className="text-amber-300">{payerId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Gateway State:</span>
              <span className="text-emerald-400 font-bold">APPROVED</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Link
            to="/transactions"
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-cyan-500 hover:opacity-95 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>View Transactions Ledger</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
