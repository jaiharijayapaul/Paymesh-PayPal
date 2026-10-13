import React, { useState } from 'react';
import { api } from '../api/client';
import { Payment } from '../types';
import { CreditCard, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Lock, ExternalLink } from 'lucide-react';

interface PayPalButtonProps {
  approvalId: string;
  amount: number;
  currency: string;
  onSuccess: (payment: Payment) => void;
  onError: (errorMsg: string) => void;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({
  approvalId,
  amount,
  currency,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState<any | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleInitiatePayPal = async () => {
    setLoading(true);
    try {
      // Step 1: Request backend to create PayPal Sandbox Order
      const res = await api.payments.createOrder(approvalId);
      setOrderCreated(res);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      onError(err.message || 'Failed to initialize PayPal order.');
    }
  };

  const handleCapturePayPal = async () => {
    if (!orderCreated) return;
    setIsCapturing(true);
    try {
      // Step 2: Request backend to capture and verify PayPal Sandbox Order
      const payment = await api.payments.captureOrder(
        orderCreated.payment_id,
        orderCreated.paypal_order_id
      );
      setIsCapturing(false);
      onSuccess(payment);
    } catch (err: any) {
      setIsCapturing(false);
      onError(err.message || 'Failed to capture PayPal payment.');
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
      {/* Sandbox Badge Notice */}
      <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
        <span className="flex items-center gap-1.5 text-amber-400 font-semibold uppercase tracking-wider text-[11px]">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          PayPal Sandbox Environment
        </span>
        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
          <Lock className="w-3 h-3 text-cyan-400" /> Server-Verified Checkout
        </span>
      </div>

      <div className="flex items-center justify-between py-1">
        <div>
          <div className="text-xs text-slate-400">Total Authorized Amount</div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${Number(amount || 0).toFixed(2)} <span className="text-sm font-normal text-cyan-400">{currency}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Security Gate</div>
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 justify-end">
            <ShieldCheck className="w-3.5 h-3.5" /> Policy Checks Passed
          </div>
        </div>
      </div>

      {!orderCreated ? (
        <button
          onClick={handleInitiatePayPal}
          disabled={loading}
          className="w-full relative group overflow-hidden rounded-lg p-0.5 font-semibold text-sm transition-all shadow-lg hover:shadow-cyan-500/20"
        >
          <div className="absolute inset-0 bg-linear-to-r from-violet-600 via-indigo-600 to-cyan-500 rounded-lg group-hover:opacity-90 transition-opacity" />
          <div className="relative px-5 py-3.5 bg-slate-950/40 rounded-[7px] flex items-center justify-center gap-3 text-white">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Generating PayPal Sandbox Order...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 text-cyan-300" />
                <span>Launch PayPal Sandbox Order (${Number(amount || 0).toFixed(2)})</span>
              </>
            )}
          </div>
        </button>
      ) : (
        <div className="space-y-3 animate-fadeIn">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Order Reference ID:</span>
              <span className="font-mono text-cyan-300">{orderCreated.paypal_order_id}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Gateway State:</span>
              <span className="text-amber-300 font-medium">Ready for Server Capture</span>
            </div>
          </div>

          {orderCreated.approval_url && (
            <a
              href={orderCreated.approval_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-lg border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open PayPal Sandbox Gateway (Optional)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={handleCapturePayPal}
            disabled={isCapturing}
            className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Sandbox Capture...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Complete Order Capture</span>
              </>
            )}
          </button>
        </div>
      )}

      <p className="text-[11px] text-slate-500 text-center leading-normal">
        Transactions operate in PayPal Sandbox Orders v2. No live financial accounts are charged. All captures are verified server-side.
      </p>
    </div>
  );
};
