'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Download, AlertTriangle, Info, AlertCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { mockEvalResults, mockExperiments } from '@/data/mockData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ---- Metric cards ----
function MetricCard({ metric }: { metric: typeof mockEvalResults.metrics[0] }) {
  const isHallucination = metric.name === 'Hallucination Rate';
  const delta = isHallucination
    ? metric.baseScore - metric.customScore
    : metric.customScore - metric.baseScore;
  const improved = delta > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="text-xs text-slate-500 mb-1">{metric.name}</div>
      <div className="text-3xl font-bold text-slate-900 mb-2">
        {isHallucination ? `${(metric.customScore * 100).toFixed(1)}%` : metric.customScore.toFixed(2)}
      </div>
      <div className={cn('flex items-center gap-1 text-xs font-medium', improved ? 'text-emerald-600' : 'text-red-500')}>
        {improved ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {isHallucination
          ? `${(delta * 100).toFixed(1)}pp lower than base`
          : `+${(delta * 100).toFixed(0)}pp over base`}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
        Base model: {isHallucination ? `${(metric.baseScore * 100).toFixed(1)}%` : metric.baseScore.toFixed(2)}
      </div>
    </div>
  );
}

// ---- Bar chart data ----
const chartData = mockEvalResults.metrics.map(m => ({
  name: m.name,
  'Base Model': m.name === 'Hallucination Rate' ? parseFloat((m.baseScore * 100).toFixed(1)) : parseFloat(m.baseScore.toFixed(2)),
  'Customized': m.name === 'Hallucination Rate' ? parseFloat((m.customScore * 100).toFixed(1)) : parseFloat(m.customScore.toFixed(2)),
}));

// ---- Sample row ----
function SampleRow({ sample, index }: { sample: typeof mockEvalResults.perSample[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-4"
      >
        <span className="text-xs text-slate-400 font-mono w-6 flex-shrink-0">{index + 1}</span>
        <span className="flex-1 text-xs text-slate-600 truncate">{sample.prompt}</span>
        <span className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0',
          sample.score >= 0.9 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          sample.score >= 0.8 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
        )}>
          {sample.score.toFixed(2)}
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 bg-slate-50/50 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-4 pt-3">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Base Model Response</div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600 leading-relaxed">{sample.baseResponse}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Customized Response</div>
              <div className="bg-white border border-blue-100 rounded-lg p-3 text-xs text-slate-700 leading-relaxed bg-blue-50/30">{sample.customResponse}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main ----
export default function ResultsPage() {
  const params = useParams();
  const expId = params.id as string;
  const runId = params.runId as string;
  const experiment = mockExperiments.find(e => e.id === expId) ?? mockExperiments[0];
  const run = experiment.runs.find(r => r.id === runId) ?? experiment.runs[0];

  const insightIcons = { warning: AlertTriangle, info: Info, error: AlertCircle };
  const insightColors = {
    warning: 'bg-amber-50 border-amber-100 text-amber-800',
    info: 'bg-blue-50 border-blue-100 text-blue-800',
    error: 'bg-red-50 border-red-100 text-red-800',
  };
  const insightIconColors = { warning: 'text-amber-500', info: 'text-blue-500', error: 'text-red-500' };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-slate-700 transition-colors">Experiments</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/experiments/${expId}`} className="hover:text-slate-700 transition-colors">{experiment.name}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">Results — {run.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Evaluation Results</h1>
          <p className="text-sm text-slate-500 mt-1">{run.name} · {run.method} · {run.datasetName}</p>
        </div>
        <Button
          variant="outline"
          className="border-slate-200 text-slate-600 gap-2"
          onClick={() => toast.success('Exported successfully', { description: 'Results saved as results.csv' })}
        >
          <Download className="w-4 h-4" /> Export Results
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {mockEvalResults.metrics.map(m => <MetricCard key={m.name} metric={m} />)}
      </div>

      {/* Comparison chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-5">Base vs. Customized Model</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(v, name) => [v ?? 0, name]}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
            <Bar dataKey="Base Model" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Customized" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Per-sample table */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Per-sample Results</h2>
            <span className="text-xs text-slate-400">{mockEvalResults.perSample.length} samples · click to expand</span>
          </div>
          <div>
            {mockEvalResults.perSample.map((s, i) => <SampleRow key={s.id} sample={s} index={i} />)}
          </div>
        </div>

        {/* Error insights */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Error Insights</h2>
          {mockEvalResults.errorInsights.map((insight, i) => {
            const Icon = insightIcons[insight.type];
            return (
              <div key={i} className={cn('rounded-xl border p-4', insightColors[insight.type])}>
                <div className="flex items-start gap-3">
                  <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', insightIconColors[insight.type])} />
                  <div>
                    <div className="text-xs font-semibold mb-1">{insight.title}</div>
                    <p className="text-xs leading-relaxed opacity-80">{insight.description}</p>
                    <div className="mt-2 text-[10px] font-mono opacity-60">{insight.count} samples affected</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
