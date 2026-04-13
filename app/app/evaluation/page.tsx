'use client';

import { useState, useEffect } from 'react';
import { Plus, BarChart2, CheckCircle2, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { datasetCatalog } from '@/data/mockData';
import EvaluationPanel from '@/components/evaluation/EvaluationPanel';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'modelforge_eval_runs';

interface StandaloneEvalRun {
  id: string;
  datasetId: string;
  datasetName: string;
  createdAt: string;
  completed: boolean;
}

const SEED_RUNS: StandaloneEvalRun[] = [
  {
    id: 'eval-seed-1',
    datasetId: 'fin-qa',
    datasetName: 'Financial Q&A Dataset',
    createdAt: '2026-04-01T10:30:00Z',
    completed: true,
  },
  {
    id: 'eval-seed-2',
    datasetId: 'contract-v2',
    datasetName: 'Contract Corpus v2',
    createdAt: '2026-04-03T14:20:00Z',
    completed: true,
  },
];

function evalRunLabel(run: StandaloneEvalRun, index: number) {
  return `Eval #${index + 1} — ${run.datasetName}`;
}

export default function EvaluationPage() {
  const [runs, setRuns]               = useState<StandaloneEvalRun[]>([]);
  const [loaded, setLoaded]           = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [pendingDataset, setPendingDataset] = useState('');

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed: StandaloneEvalRun[] = stored ? JSON.parse(stored) : SEED_RUNS;
      setRuns(parsed);
      setSelectedId(parsed[parsed.length - 1]?.id ?? null);
    } catch {
      setRuns(SEED_RUNS);
      setSelectedId(SEED_RUNS[SEED_RUNS.length - 1].id);
    }
    setLoaded(true);
  }, []);

  const persist = (next: StandaloneEvalRun[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const handleNewEval = () => {
    const newRun: StandaloneEvalRun = {
      id: `eval-${Date.now()}`,
      datasetId: '',
      datasetName: '',
      createdAt: new Date().toISOString(),
      completed: false,
    };
    const next = [...runs, newRun];
    persist(next);
    setRuns(next);
    setSelectedId(newRun.id);
    setPendingDataset('');
  };

  const handleRunComplete = (runId: string, datasetId: string) => {
    const ds = datasetCatalog.find(d => d.id === datasetId);
    const next = runs.map(r =>
      r.id === runId
        ? { ...r, completed: true, datasetId, datasetName: ds?.name ?? datasetId }
        : r
    );
    persist(next);
    setRuns(next);
  };

  if (!loaded) return null;

  const selectedRun = runs.find(r => r.id === selectedId) ?? null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel — eval history */}
      <div className="w-[280px] flex-shrink-0 border-r border-slate-200 flex flex-col bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Evaluation</h2>
              <p className="text-xs text-slate-400">Standalone eval runs</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-widest px-2 pb-1.5">History</div>
          {runs.length === 0 && (
            <p className="text-sm text-slate-400 px-2 py-4 text-center">No eval runs yet.</p>
          )}
          {runs.map((run, i) => (
            <button
              key={run.id}
              onClick={() => setSelectedId(run.id)}
              className={cn(
                'w-full text-left rounded-lg px-4 py-3 transition-all duration-150 border',
                selectedId === run.id ? 'bg-violet-50 border-violet-200' : 'hover:bg-slate-50 border-transparent'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn('text-sm font-semibold truncate max-w-[150px]', selectedId === run.id ? 'text-violet-900' : 'text-slate-700')}>
                  Eval #{i + 1}
                </span>
                {run.completed ? (
                  <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0">
                    Done
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-slate-100 text-slate-500 border-slate-200 flex-shrink-0">
                    Draft
                  </span>
                )}
              </div>
              {run.datasetName ? (
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {run.datasetName}
                </div>
              ) : (
                <div className="text-xs text-slate-300 italic">No dataset selected</div>
              )}
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200">
          <Button
            onClick={handleNewEval}
            variant="outline"
            className="w-full border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> New Evaluation
          </Button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto bg-slate-50/40">
        {!selectedRun ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-12">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-1">No eval run selected</p>
              <p className="text-sm text-slate-400">Start a new evaluation or select one from the history.</p>
            </div>
            <Button onClick={handleNewEval} className="bg-violet-600 hover:bg-violet-700 text-white gap-2 mt-2">
              <Plus className="w-4 h-4" /> New Evaluation
            </Button>
          </div>
        ) : (
          <div className="p-6 space-y-5 max-w-4xl">
            {/* Header */}
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Eval #{runs.findIndex(r => r.id === selectedRun.id) + 1}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(selectedRun.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>

            {/* Dataset selector (or read-only chip for completed runs) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Dataset</h3>
              {selectedRun.completed ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">{selectedRun.datasetName}</span>
                  <span className="text-xs text-slate-400 ml-2">
                    {datasetCatalog.find(d => d.id === selectedRun.datasetId)?.size ?? ''}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">
                    Select the dataset containing prompts, model responses, and optional ground truth
                  </Label>
                  <Select
                    value={pendingDataset}
                    onValueChange={v => setPendingDataset(v ?? '')}
                  >
                    <SelectTrigger className="border-slate-200 text-sm max-w-sm">
                      <SelectValue placeholder="Choose a dataset…" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasetCatalog.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          <span className="font-medium">{d.name}</span>
                          <span className="text-xs text-slate-400 ml-2">{d.size} · {d.type}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pendingDataset && (
                    <p className="text-xs text-slate-400">
                      {datasetCatalog.find(d => d.id === pendingDataset)?.size} samples loaded
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Evaluation panel — shared component */}
            {(selectedRun.completed || pendingDataset) ? (
              <EvaluationPanel
                key={selectedRun.id}
                initialHasResults={selectedRun.completed}
                onRunComplete={() => handleRunComplete(selectedRun.id, pendingDataset)}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                Select a dataset above to configure and run evaluation.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
