import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Provider } from '../types';
import {
  ShieldCheck,
  Star,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Bot,
  Zap,
  Tag
} from 'lucide-react';

export const ProviderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.marketplace.getProvider(id)
        .then((data) => setProvider(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="py-24 text-center text-slate-500">Loading provider details...</div>;
  }

  if (!provider) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-400">Provider record not found.</div>
        <Link to="/marketplace" className="text-cyan-400 text-sm hover:underline">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  let parsedSkills: string[] = [];
  try {
    if (provider.skills) parsedSkills = JSON.parse(provider.skills);
  } catch {
    parsedSkills = provider.skills ? provider.skills.split(',') : [];
  }

  let parsedSamples: string[] = [];
  try {
    if (provider.portfolio_samples) parsedSamples = JSON.parse(provider.portfolio_samples);
  } catch {
    parsedSamples = [];
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Service Marketplace</span>
      </button>

      {/* Profile Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{provider.name}</h1>
              {provider.is_verified && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Verified Agency
                </span>
              )}
            </div>
            <p className="text-sm text-cyan-300/90 font-medium mt-1">{provider.tagline}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {provider.rating} ({provider.review_count} client reviews)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Standard Delivery: {provider.delivery_days} Days
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 text-right shrink-0 w-full sm:w-auto">
            <span className="text-xs text-slate-500 block">Catalog Price</span>
            <span className="text-3xl font-black text-white">
              ${provider.starting_price} <span className="text-sm font-normal text-cyan-400">{provider.currency}</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-medium block mt-1">
              ✓ Negotiable via AI Agent
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">About Provider</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">{provider.description}</p>
          </div>

          {parsedSkills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Verified Skill Stack</h3>
              <div className="flex flex-wrap gap-2">
                {parsedSkills.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsedSamples.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Verified Portfolio Works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parsedSamples.map((sample, i) => (
                  <div key={i} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{sample}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Delegate to Agent Button */}
          <div className="pt-4">
            <button
              onClick={() => navigate(`/workspace?demo=true`)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:opacity-95 shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Delegate Project to AI Agent for this Provider</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
