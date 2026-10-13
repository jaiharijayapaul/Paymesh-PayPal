import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Payment, Order } from '../types';
import {
  Receipt,
  PackageCheck,
  CreditCard
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments'>('orders');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const [payData, orderData] = await Promise.all([
        api.payments.list(),
        api.payments.listOrders(),
      ]);
      setPayments(payData);
      setOrders(orderData);
    } catch (err) {
      console.error('Failed to load transaction data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Receipt className="w-7 h-7 text-indigo-400" />
            <span>Transactions & <span className="gradient-text">Active Orders</span></span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Auditable ledger of PayPal Sandbox captures, fulfillment statuses, and merchant responses.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fulfilled Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'payments'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PayPal Payments ({payments.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-500">Loading ledger records...</div>
      ) : activeTab === 'orders' ? (
        /* Orders View */
        orders.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
            <PackageCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Fulfilled Orders Yet</h3>
            <p className="text-xs text-slate-500">
              When a payment captures in PayPal Sandbox, the provider order will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-cyan-400 block mb-1">
                      Order ID: {order.id.slice(0, 8)}
                    </span>
                    <h3 className="text-base font-bold text-white">Service Order Fulfilled</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 font-mono font-semibold">
                      {order.fulfillment_status}
                    </span>
                    <span className="text-lg font-black text-white">
                      ${order.total_amount} <span className="text-xs font-normal text-cyan-400">{order.currency}</span>
                    </span>
                  </div>
                </div>

                {order.merchant_acknowledgment && (
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">
                      Merchant Agent Notification:
                    </span>
                    <p className="text-emerald-300/90 leading-relaxed font-sans">
                      {order.merchant_acknowledgment}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Created: {new Date(order.created_at).toLocaleString()}</span>
                  <span className="font-mono text-cyan-400">Payment ID: {order.payment_id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Payments View */
        payments.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No PayPal Payments Recorded</h3>
            <p className="text-xs text-slate-500">
              Captures executed through PayPal smart buttons will be logged here.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">PayPal Order ID</th>
                    <th className="py-3 px-4">PayPal Capture ID</th>
                    <th className="py-3 px-4">Buyer Payer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        ${p.amount} {p.currency}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-300">
                        {p.paypal_order_id || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {p.paypal_capture_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {p.payer_email || 'sandbox-buyer@paymesh.ai'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};
