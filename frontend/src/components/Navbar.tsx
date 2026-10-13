import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  Bot,
  Store,
  ShieldCheck,
  Receipt,
  Settings,
  LogOut,
  User,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#080c14]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="hover:opacity-90 transition-opacity">
            <Logo size="md" showTagline={false} />
          </Link>

          {/* Nav Links for Authenticated Users */}
          {user ? (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-violet-400" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/workspace"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>AI Workspace</span>
              </Link>

              <Link
                to="/marketplace"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Marketplace</span>
              </Link>

              <Link
                to="/approvals"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Approvals</span>
              </Link>

              <Link
                to="/transactions"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <Receipt className="w-4 h-4 text-indigo-400" />
                <span>Transactions</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/marketplace"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Browse Marketplace
              </Link>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Right Profile & Sandbox Indicator */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>PayPal Sandbox</span>
              </div>

              <Link
                to="/settings"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Account Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow">
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
