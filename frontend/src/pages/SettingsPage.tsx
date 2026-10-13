import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Settings,
  ShieldCheck,
  DollarSign,
  Star,
  Clock,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [maxAmount, setMaxAmount] = useState(500);
  const [minRating, setMinRating] = useState(4.0);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [mandatoryApproval, setMandatoryApproval] = useState(true);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.preferences) {
      setPreferredCurrency(user.preferences.preferred_currency);
      setMaxAmount(user.preferences.max_transaction_amount);
      setMinRating(user.preferences.min_provider_rating);
      setDeliveryDays(user.preferences.preferred_delivery_days);
      setMandatoryApproval(user.preferences.mandatory_payment_approval);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.auth.updatePreferences({
        preferred_currency: preferredCurrency,
        max_transaction_amount: maxAmount,
        min_provider_rating: minRating,
        preferred_delivery_days: deliveryDays,
        mandatory_payment_approval: mandatoryApproval,
      });
      await refreshUser();
      setMessage('Commerce governance policies successfully updated!');
    } catch (err: any) {
      setMessage(err.message || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Settings className="w-7 h-7 text-cyan-400" />
          <span>Operator Policy & <span className="gradient-text">Governance Settings</span></span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure financial caps, rating thresholds, and human-in-the-loop policies enforced by the AI network.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Maximum Single-Transaction Budget Cap ($)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              The Deterministic Policy Engine will strictly reject any agent offer exceeding this ceiling.
            </p>
            <input
              type="number"
              min="1"
              max="10000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(Number(e.target.value))}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Minimum Provider Rating Threshold (Stars)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Discovery Agents will automatically filter out providers below this historical score.
            </p>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="5.0"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Preferred Delivery SLA (Days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(Number(e.target.value))}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Preferred Settlement Currency
            </label>
            <select
              value={preferredCurrency}
              onChange={(e) => setPreferredCurrency(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
            >
              <option value="USD">USD — United States Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-white block">Mandatory Human Sign-Off</span>
              <span className="text-xs text-slate-400">
                AI agents are forbidden from executing PayPal checkout without explicit manual operator approval.
              </span>
            </div>
            <input
              type="checkbox"
              checked={mandatoryApproval}
              disabled
              className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-800 focus:ring-0 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-95 shadow-md flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Preferences...' : 'Save Governance Policies'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
