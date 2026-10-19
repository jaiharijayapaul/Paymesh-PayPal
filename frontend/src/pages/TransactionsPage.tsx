import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Payment, Order } from '../types';
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
  ColDef,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
  Receipt,
  PackageCheck,
  CreditCard,
  Zap,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Loader2,
  Terminal,
  Send,
  Download,
  FileSpreadsheet,
  Search,
  Sparkles,
  Table
} from 'lucide-react';
import { generatePaymentReceiptPDF } from '../utils/pdfReceipt';

ModuleRegistry.registerModules([AllCommunityModule]);

const darkGridTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: '#070b14',
  foregroundColor: '#cbd5e1',
  headerBackgroundColor: '#0f172a',
  headerTextColor: '#94a3b8',
  borderColor: '#1e293b',
  rowHoverColor: '#1e293b88',
});

interface WebhookItem {
  id: string;
  paypal_event_id: string;
  event_type: string;
  resource_type: string;
  summary: string;
  status: string;
  created_at: string;
}

export const TransactionsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'webhooks'>('orders');

  // Webhook Simulator Modal State
  const [showSimModal, setShowSimModal] = useState(false);
  const [simEventType, setSimEventType] = useState('PAYMENT.CAPTURE.COMPLETED');
  const [simAmount, setSimAmount] = useState('98.00');
  const [simTargetPaymentId, setSimTargetPaymentId] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // AG Grid State & Handlers
  const [gridApi, setGridApi] = useState<GridApi<Payment> | null>(null);
  const [quickFilter, setQuickFilter] = useState('');
  const [viewMode, setViewMode] = useState<'ag-grid' | 'standard'>('ag-grid');

  const onQuickFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuickFilter(val);
    if (gridApi) {
      gridApi.setGridOption('quickFilterText', val);
    }
  };

  const handleExportCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `paymesh_settlements_${new Date().toISOString().slice(0, 10)}.csv`,
      });
    }
  };

  const paymentColDefs: ColDef<Payment>[] = [
    {
      field: 'created_at',
      headerName: 'Settlement Time',
      sortable: true,
      filter: true,
      minWidth: 170,
      valueFormatter: (p) =>
        p.value
          ? `${new Date(p.value).toLocaleDateString()} ${new Date(p.value).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : '—',
    },
    {
      field: 'amount',
      headerName: 'Amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      minWidth: 130,
      valueFormatter: (p) => `$${Number(p.value || 0).toFixed(2)} ${p.data?.currency || 'USD'}`,
      cellClass: 'font-semibold text-white',
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      minWidth: 130,
      cellRenderer: (p: any) => {
        const isComp = p.value === 'COMPLETED';
        return (
          <span
            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
              isComp
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
            }`}
          >
            {p.value}
          </span>
        );
      },
    },
    {
      field: 'paypal_order_id',
      headerName: 'PayPal Order ID',
      sortable: true,
      filter: true,
      minWidth: 180,
      cellRenderer: (p: any) => (
        <span className="font-mono text-cyan-400 text-xs">{p.value || '—'}</span>
      ),
    },
    {
      field: 'paypal_capture_id',
      headerName: 'PayPal Capture ID',
      sortable: true,
      filter: true,
      minWidth: 180,
      cellRenderer: (p: any) => (
        <span className="font-mono text-slate-400 text-xs">{p.value || '—'}</span>
      ),
    },
    {
      field: 'payer_email',
      headerName: 'Payer Account',
      sortable: true,
      filter: true,
      minWidth: 190,
      valueGetter: (p) => p.data?.payer_email || 'sandbox-buyer@paymesh.ai',
    },
    {
      headerName: 'Audit Receipt',
      minWidth: 160,
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => {
        const payment = p.data;
        if (!payment || payment.status !== 'COMPLETED') {
          return <span className="text-slate-600 text-xs">—</span>;
        }
        return (
          <button
            onClick={async () => {
              try {
                const receipt = await api.payments.getReceipt(payment.id);
                generatePaymentReceiptPDF(receipt);
              } catch (e) {
                console.error('Receipt download failed:', e);
              }
            }}
            className="px-2.5 py-1 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-semibold text-[11px] inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Download PDF</span>
          </button>
        );
      },
    },
  ];

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const [payData, orderData, whData] = await Promise.all([
        api.payments.list(),
        api.payments.listOrders(),
        api.webhooks.listEvents().catch(() => []),
      ]);
      setPayments(payData);
      setOrders(orderData);
      setWebhooks(whData);
    } catch (err) {
      console.error('Failed to load transaction data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimError(null);
    setSimResult(null);

    try {
      const res = await api.webhooks.simulate({
        event_type: simEventType,
        payment_id: simTargetPaymentId || undefined,
        amount: simAmount,
        currency: 'USD',
      });
      setSimResult(res);
      fetchRecords();
    } catch (err: any) {
      setSimError(err.message || 'Failed to simulate webhook.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Receipt className="w-7 h-7 text-indigo-400" />
            <span>Transactions & <span className="gradient-text">Audit Ledger</span></span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Auditable ledger of PayPal Sandbox captures, fulfillment statuses, and asynchronous webhook events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSimModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-amber-600 to-indigo-600 hover:opacity-95 shadow-md flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate PayPal Webhook</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
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
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'webhooks'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Webhooks ({webhooks.length})
            </button>
          </div>
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

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <span>Created: {new Date(order.created_at).toLocaleString()}</span>
                    <span className="font-mono text-cyan-400">Payment ID: {order.payment_id.slice(0, 8)}</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const receipt = await api.payments.getReceipt(order.payment_id);
                        generatePaymentReceiptPDF(receipt);
                      } catch (e) {
                        console.error('Receipt download failed:', e);
                      }
                    }}
                    className="px-2.5 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-semibold text-[11px] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PDF Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'payments' ? (
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
          <div className="space-y-4">
            {/* AG Grid Controls Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-linear-to-r from-cyan-950 to-indigo-950 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AG Grid Community v36</span>
                </div>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {payments.length} {payments.length === 1 ? 'record' : 'records'} indexed
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search / Quick Filter */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickFilter}
                    onChange={onQuickFilterChange}
                    placeholder="Search ledger..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
                  />
                </div>

                {/* Export CSV Button */}
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  title="Export to CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>

                {/* View Mode Switcher */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setViewMode('ag-grid')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      viewMode === 'ag-grid'
                        ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AG Grid
                  </button>
                  <button
                    onClick={() => setViewMode('standard')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      viewMode === 'standard'
                        ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Standard
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'ag-grid' ? (
              /* AG Grid Interactive View */
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-2">
                <div style={{ height: 440, width: '100%' }}>
                  <AgGridReact<Payment>
                    theme={darkGridTheme}
                    rowData={payments}
                    columnDefs={paymentColDefs}
                    pagination={true}
                    paginationPageSize={10}
                    paginationPageSizeSelector={[10, 25, 50]}
                    onGridReady={(params: GridReadyEvent<Payment>) => {
                      setGridApi(params.api);
                      params.api.sizeColumnsToFit();
                    }}
                    defaultColDef={{
                      resizable: true,
                      sortable: true,
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Standard Table View */
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
                        <th className="py-3 px-4 text-right">Official Receipt</th>
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
                          <td className="py-3 px-4 text-right">
                            {p.status === 'COMPLETED' ? (
                              <button
                                onClick={async () => {
                                  try {
                                    const receipt = await api.payments.getReceipt(p.id);
                                    generatePaymentReceiptPDF(receipt);
                                  } catch (e) {
                                    console.error('Receipt download failed:', e);
                                  }
                                }}
                                className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </button>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Webhooks View */
        webhooks.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
            <Radio className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Webhook Events Logged</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Simulate PayPal Webhook" above to trigger an asynchronous PayPal notification with deduplication checks.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event ID</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Summary</th>
                    <th className="py-3 px-4">Processing State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {webhooks.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-300">
                        {w.paypal_event_id}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-300">
                        {w.event_type}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-md truncate">
                        {w.summary}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Webhook Event Simulator Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">PayPal Webhook Simulator</h3>
                  <p className="text-xs text-slate-400">Dispatch asynchronous events and verify idempotency.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {simError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{simError}</span>
              </div>
            )}

            {simResult && (
              <div className="space-y-2 p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-xl text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Webhook Ingested & Verified
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/20">
                    {simResult.status}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-400 pt-1">
                  <div>Event ID: <span className="text-cyan-300">{simResult.event_id}</span></div>
                  <div>Event Type: <span className="text-amber-300">{simResult.event_type}</span></div>
                </div>
              </div>
            )}

            <form onSubmit={handleSimulateWebhook} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">PayPal Event Type</label>
                <select
                  value={simEventType}
                  onChange={(e) => setSimEventType(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                >
                  <option value="PAYMENT.CAPTURE.COMPLETED">PAYMENT.CAPTURE.COMPLETED</option>
                  <option value="PAYMENT.CAPTURE.DENIED">PAYMENT.CAPTURE.DENIED</option>
                  <option value="PAYMENT.CAPTURE.PENDING">PAYMENT.CAPTURE.PENDING</option>
                </select>
                <span className="text-[10px] text-slate-500">Official PayPal Orders v2 Webhook Event Schema.</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Simulated Amount ($ USD)</label>
                <input
                  type="text"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {payments.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Target Payment Record (Optional)</label>
                  <select
                    value={simTargetPaymentId}
                    onChange={(e) => setSimTargetPaymentId(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  >
                    <option value="">None (Generic Event)</option>
                    {payments.map((p) => (
                      <option key={p.id} value={p.id}>
                        Payment ${p.amount} ({p.id.slice(0, 8)}) - Current Status: {p.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-amber-600 to-indigo-600 hover:opacity-95 shadow-md flex items-center gap-2 transition-all"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Event...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Webhook</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
