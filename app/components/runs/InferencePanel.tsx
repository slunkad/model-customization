'use client';

import { useState } from 'react';
import { Play, Loader2, Upload, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockEvalResults } from '@/data/mockData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MOCK_ROWS = mockEvalResults.perSample.map((s, i) => ({
  id: s.id,
  prompt: s.prompt,
  groundTruth: ['Digital Access Issue', 'Account Maintenance', 'Transaction Dispute', 'New Product Inquiry', 'Card Services'][i],
  modelResponse: s.customResponse,
}));

interface InferencePanelProps {
  initialDataset?: string;
  initialHasResults?: boolean;
  onResultsReady?: () => void;
}

export default function InferencePanel({
  initialHasResults = false,
  onResultsReady,
}: InferencePanelProps) {
  const [running, setRunning]                   = useState(false);
  const [progress, setProgress]                 = useState(0);
  const [hasResults, setHasResults]             = useState(initialHasResults);
  const [uploadedDataset, setUploadedDataset]   = useState<string>('');
  const [uploadedSize, setUploadedSize]         = useState<string>('');

  const canRun = !!uploadedDataset || initialHasResults;

  const handleRun = async () => {
    if (!canRun) return;
    setRunning(true);
    setHasResults(false);
    setProgress(0);
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 80));
      setProgress(i);
    }
    setRunning(false);
    setHasResults(true);
    onResultsReady?.();
    toast.success('Inference complete', {
      description: `Generated responses for ${MOCK_ROWS.length} prompts.`,
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Inference Configuration</h3>

        {/* Upload zone */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-600 font-medium">Evaluation Dataset <span className="text-red-400">*</span></span>

          <label className={cn(
            'flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 cursor-pointer transition-colors',
            uploadedDataset
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/20'
          )}>
            <input
              type="file"
              accept=".csv,.jsonl,.json,.parquet"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  setUploadedDataset(f.name);
                  setUploadedSize(`${(f.size / 1024).toFixed(1)} KB`);
                  setHasResults(false);
                }
              }}
            />
            {uploadedDataset ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-800 truncate">{uploadedDataset}</p>
                  <p className="text-[10px] text-emerald-500">{uploadedSize}</p>
                </div>
                <span className="text-[10px] text-emerald-500 flex-shrink-0">Click to replace</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-600">Upload eval dataset</p>
                  <p className="text-[10px] text-slate-400">CSV · JSONL · JSON · Parquet</p>
                </div>
              </>
            )}
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
          <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Batching and distributed inference are handled automatically. Upload your dataset and click Run.
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRun}
            disabled={running || !canRun}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {running
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Running…</>
              : <><Play className="w-4 h-4" /> {hasResults ? 'Re-run Inference' : 'Run Inference'}</>}
          </Button>
          {!canRun && (
            <span className="text-xs text-slate-400">Upload a dataset to run inference.</span>
          )}
        </div>

        {running && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Generating responses…</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </div>

      {hasResults && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Results</h3>
            <span className="text-xs text-slate-400">
              {MOCK_ROWS.length} prompts{uploadedDataset ? ` · ${uploadedDataset}` : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-500 w-8">#</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-500 w-[30%]">Prompt</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-500 w-[20%]">Ground Truth</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Fine-tuned Model Response</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ROWS.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-slate-50/40' : ''}>
                    <td className="px-4 py-3 text-slate-400 font-mono">{row.id}</td>
                    <td className="px-4 py-3 text-slate-600 leading-relaxed">{row.prompt}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {row.groundTruth}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 leading-relaxed">{row.modelResponse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
