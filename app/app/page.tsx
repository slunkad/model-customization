'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FlaskConical, CheckCircle2, Activity, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Experiment, type ExperimentStatus } from '@/data/mockData';
import { useExperiments } from '@/context/ExperimentsContext';

const statusConfig: Record<ExperimentStatus, { label: string; className: string }> = {
  Completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Active:    { label: 'Active',    className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Draft:     { label: 'Draft',     className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

function ExperimentCard({ experiment }: { experiment: Experiment }) {
  const router = useRouter();
  const cfg = statusConfig[experiment.status];
  const completedRuns = experiment.runs.filter(r => r.status === 'Completed').length;

  return (
    <button
      onClick={() => router.push(`/experiments/${experiment.id}`)}
      className="text-left group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base leading-tight group-hover:text-blue-700 transition-colors">
              {experiment.name}
            </h3>
            <span className="text-xs text-slate-400 font-mono">{experiment.id}</span>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>
          {cfg.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
        {experiment.description}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {experiment.baseModel && (
            <span className="flex items-center gap-1 text-slate-400">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600">{experiment.baseModel}</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-slate-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>{completedRuns}/{experiment.runs.length} runs</span>
          </span>
        </div>
        <span className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3" />
          {new Date(experiment.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Hover arrow */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-blue-500 flex items-center gap-1">
          View runs <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { experiments: mockExperiments, loaded } = useExperiments();
  const totalRuns = mockExperiments.reduce((acc, e) => acc + e.runs.length, 0);
  const activeRuns = mockExperiments.reduce((acc, e) => acc + e.runs.filter(r => ['Configuring', 'Training', 'Inferring', 'Evaluating'].includes(r.status)).length, 0);
  const completedRuns = mockExperiments.reduce((acc, e) => acc + e.runs.filter(r => r.status === 'Completed').length, 0);

  if (!loaded) return null;

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Experiments</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your model customization experiments and runs.</p>
        </div>
        <Link href="/experiments/new">
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" />
            New Experiment
          </Button>
        </Link>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Experiments', value: mockExperiments.length, icon: FlaskConical, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Runs', value: activeRuns, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed Runs', value: completedRuns, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Experiment grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockExperiments.map((exp) => (
          <ExperimentCard key={exp.id} experiment={exp} />
        ))}

        {/* Empty card CTA */}
        <Link href="/experiments/new">
          <div className="h-full min-h-[180px] rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer group p-5">
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <span className="text-sm text-slate-400 group-hover:text-blue-500 font-medium transition-colors">New Experiment</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
