import React from 'react';
import { AgentAction } from '../types';
import {
  Brain,
  Search,
  BarChart3,
  Scale,
  ShieldCheck,
  UserCheck,
  CreditCard,
  PackageCheck,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface AgentTimelineProps {
  actions: AgentAction[];
  taskStatus: string;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ actions, taskStatus }) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'INTENT_EXTRACTION':
        return <Brain className="w-4 h-4 text-violet-400" />;
      case 'PROVIDER_DISCOVERY':
        return <Search className="w-4 h-4 text-cyan-400" />;
      case 'CANDIDATE_EVALUATION':
        return <BarChart3 className="w-4 h-4 text-emerald-400" />;
      case 'NEGOTIATION_ROUND':
        return <Scale className="w-4 h-4 text-amber-400" />;
      case 'POLICY_VERIFICATION':
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
      case 'APPROVAL_GRANTED':
        return <UserCheck className="w-4 h-4 text-cyan-300" />;
      case 'PAYMENT_CAPTURED_AND_FULFILLED':
        return <PackageCheck className="w-4 h-4 text-green-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            Multi-Agent Activity Timeline
          </h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full border border-violet-500/30 bg-violet-950/40 text-violet-300 font-mono">
          State: {taskStatus}
        </span>
      </div>

      {actions.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          No agent actions recorded yet. Launch the task pipeline to begin autonomous orchestration.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-linear-to-b before:from-violet-500 before:via-cyan-500 before:to-emerald-500">
          {actions.map((action, idx) => (
            <div key={action.id || idx} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
                {getActionIcon(action.action_type)}
              </div>

              {/* Action Content Card */}
              <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-cyan-300">
                    {action.agent_name}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(action.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-300 mb-1.5">
                  Action: <span className="text-slate-100">{action.action_type.replace(/_/g, ' ')}</span>
                </div>

                {action.reasoning && (
                  <p className="text-xs text-slate-400 bg-slate-950/50 rounded p-2 border border-slate-800/80 leading-relaxed font-sans">
                    {action.reasoning}
                  </p>
                )}

                {action.output_data && (
                  <details className="mt-2 text-[11px] text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-400 select-none">
                      Inspect Agent Structured Payload
                    </summary>
                    <pre className="mt-1.5 p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">
                      {action.output_data}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
