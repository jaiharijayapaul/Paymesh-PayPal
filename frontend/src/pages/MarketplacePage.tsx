import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Provider } from '../types';
import {
  Store,
  Search,
  Star,
  Clock,
  ShieldCheck,
  Filter,
  ArrowRight,
  Sparkles,
  Tag
} from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All Services' },
  { id: 'logo_design', label: 'Logo Design' },
  { id: 'web_development', label: 'Web Development' },
  { id: 'video_editing', label: 'Video Editing' },
  { id: 'ai_automation', label: 'AI Automation' },
  { id: 'presentation_design', label: 'Presentation Design' },
  { id: 'content_writing', label: 'Content Writing' },
];

export const MarketplacePage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const data = await api.marketplace.listProviders({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        min_rating: minRating,
      });
      setProviders(data);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [selectedCategory, minRating]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProviders();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Store className="w-7 h-7 text-emerald-400" />
            <span>Service <span className="gradient-text">Marketplace</span></span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse verified providers eligible for autonomous agent evaluation and price negotiation.
          </p>
        </div>

        <div className="text-xs px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-300 font-mono">
          <span>Seeded Demo Marketplace</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by provider name, skills, or description..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Providers Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Loading verified providers...
        </div>
      ) : providers.length === 0 ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          No providers found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 rounded-2xl p-6 transition-all shadow-xl hover:shadow-violet-950/20 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {provider.name}
                      </h3>
                      {provider.is_verified && (
                        <span title="Verified Provider">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 block mt-0.5 line-clamp-1">
                      {provider.tagline}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-300 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{provider.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {provider.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[11px]">List Starting Rate</span>
                    <span className="font-bold text-white text-sm">
                      ${provider.starting_price} {provider.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Delivery SLA</span>
                    <span className="font-medium text-slate-300 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {provider.delivery_days} Days
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                  {provider.category.replace(/_/g, ' ')}
                </span>
                <Link
                  to={`/marketplace/${provider.id}`}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  <span>View Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
