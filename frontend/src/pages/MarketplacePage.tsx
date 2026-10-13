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
  Tag,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
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

  // Onboard Provider Modal State
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState<string | null>(null);
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    category: 'web_development',
    starting_price: '150.00',
    minimum_price: '110.00',
    delivery_days: 3,
    skills: 'React, TypeScript, Tailwind CSS',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

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

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError(null);
    setOnboardSuccess(null);

    const startPrice = parseFloat(formData.starting_price);
    const minPrice = parseFloat(formData.minimum_price);

    if (isNaN(startPrice) || isNaN(minPrice)) {
      setOnboardError('Please enter valid numerical prices.');
      return;
    }

    if (minPrice > startPrice) {
      setOnboardError('Minimum reserve price cannot exceed the starting list price.');
      return;
    }

    try {
      setSubmitting(true);
      const newProvider = await api.marketplace.createProvider({
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description,
        category: formData.category,
        starting_price: startPrice,
        minimum_price: minPrice,
        currency: 'USD',
        delivery_days: Number(formData.delivery_days) || 3,
        rating: 4.9,
        review_count: 14,
        is_available: true,
        is_verified: true,
        skills: JSON.stringify(formData.skills.split(',').map((s) => s.trim())),
        avatar_url: formData.avatar_url,
      });

      setOnboardSuccess(`Successfully onboarded "${newProvider.name}"!`);
      fetchProviders();
      setTimeout(() => {
        setShowOnboardModal(false);
        setOnboardSuccess(null);
        setFormData({
          name: '',
          tagline: '',
          description: '',
          category: 'web_development',
          starting_price: '150.00',
          minimum_price: '110.00',
          delivery_days: 3,
          skills: 'React, TypeScript, Tailwind CSS',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        });
      }, 1500);
    } catch (err: any) {
      setOnboardError(err.message || 'Failed to onboard provider.');
    } finally {
      setSubmitting(false);
    }
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOnboardModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-emerald-600 to-cyan-500 hover:opacity-95 shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Provider</span>
          </button>
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

      {/* Onboard Service Provider Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Onboard Service Provider</h3>
                  <p className="text-xs text-slate-400">Register a merchant entity with autonomous reserve rules.</p>
                </div>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {onboardSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{onboardSuccess}</span>
              </div>
            )}

            {onboardError && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{onboardError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProvider} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Provider / Studio Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Cloud Solutions"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Tagline *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. High-Performance Full-Stack & Next.js Systems"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="web_development">Web Development</option>
                    <option value="logo_design">Logo Design</option>
                    <option value="video_editing">Video Editing</option>
                    <option value="ai_automation">AI Automation</option>
                    <option value="presentation_design">Presentation Design</option>
                    <option value="content_writing">Content Writing</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Delivery SLA (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={formData.delivery_days}
                    onChange={(e) => setFormData({ ...formData, delivery_days: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Public Starting Price ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="5"
                    required
                    value={formData.starting_price}
                    onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Initial public list price.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Minimum Reserve Price ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="5"
                    required
                    value={formData.minimum_price}
                    onChange={(e) => setFormData({ ...formData, minimum_price: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-amber-400/90">Merchant Agent reserve floor.</span>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Key Skills (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js, TypeScript, PostgreSQL, Tailwind"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Service Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe deliverables, engineering standards, and scope..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-emerald-600 to-cyan-500 hover:opacity-95 shadow-md flex items-center gap-2 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Onboarding...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Onboard Provider</span>
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
