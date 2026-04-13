'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, Plus, CheckCircle2, Loader2, Circle,
  ArrowRight, Trash2, Play, Lock,
  MessageSquare, Wand2, Cpu, Circle as CircleIcon,
  Upload, Sparkles, BookMarked, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  mockEvalResults, datasetCatalog, baseModelCatalog,
  type Run, type RunStatus, type StepStatus,
} from '@/data/mockData';
import InferencePanel from '@/components/runs/InferencePanel';
import EvaluationPanel from '@/components/evaluation/EvaluationPanel';
import { useExperiments } from '@/context/ExperimentsContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---- Types ----
type FTMethod = 'SFT' | 'LoRA' | 'QLoRA' | 'DPO' | 'RLHF';

const FT_FIELDS: Record<FTMethod, { key: string; label: string; default: string | number }[]> = {
  LoRA:  [{ key: 'rank', label: 'LoRA Rank', default: 16 }, { key: 'alpha', label: 'Alpha', default: 32 }, { key: 'dropout', label: 'Dropout', default: 0.05 }, { key: 'learningRate', label: 'Learning Rate', default: 0.0002 }, { key: 'epochs', label: 'Epochs', default: 3 }],
  QLoRA: [{ key: 'quantBits', label: 'Quant Bits', default: 4 }, { key: 'rank', label: 'LoRA Rank', default: 8 }, { key: 'alpha', label: 'Alpha', default: 16 }, { key: 'learningRate', label: 'Learning Rate', default: 0.0003 }, { key: 'epochs', label: 'Epochs', default: 2 }],
  SFT:   [{ key: 'learningRate', label: 'Learning Rate', default: 0.00005 }, { key: 'epochs', label: 'Epochs', default: 1 }, { key: 'batchSize', label: 'Batch Size', default: 4 }],
  DPO:   [{ key: 'beta', label: 'Beta', default: 0.1 }, { key: 'learningRate', label: 'Learning Rate', default: 0.00001 }, { key: 'epochs', label: 'Epochs', default: 1 }],
  RLHF:  [{ key: 'rewardModel', label: 'Reward Model', default: 'internal-reward-v2' }, { key: 'klCoeff', label: 'KL Coefficient', default: 0.02 }],
};

const runStatusConfig: Record<RunStatus, { badge: string; label: string }> = {
  Draft:      { badge: 'bg-slate-100 text-slate-500 border-slate-200',     label: 'Draft' },
  Configuring:{ badge: 'bg-purple-50 text-purple-700 border-purple-200',   label: 'Configuring' },
  Training:   { badge: 'bg-amber-50 text-amber-700 border-amber-200',      label: 'Training' },
  Inferring:  { badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',         label: 'Inferring' },
  Evaluating: { badge: 'bg-violet-50 text-violet-700 border-violet-200',   label: 'Evaluating' },
  Completed:  { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Completed' },
  Failed:     { badge: 'bg-red-50 text-red-700 border-red-200',            label: 'Failed' },
};

// ---- Job events by method ----
function getJobEvents(method: string): string[] {
  if (method === 'prompt' || method === 'Prompt Customization') {
    return [
      'Initializing job environment',
      'Validating prompt templates',
      'Checking compatibility with base model',
      'Generating few-shot example embeddings',
      'Applying system prompt configuration',
      'Running prompt validation suite',
      'Registering customization profile',
      'Job completed successfully',
    ];
  }
  const ftMethod = method === 'LoRA' || method === 'QLoRA' || method === 'SFT' || method === 'DPO' || method === 'RLHF' ? method : 'LoRA';
  return [
    'Initializing job environment',
    'Loading training dataset',
    `Setting up ${ftMethod} adapter`,
    'Compiling base model for training',
    'Training epoch 1/3 — loss: 0.842',
    'Training epoch 2/3 — loss: 0.631',
    'Training epoch 3/3 — loss: 0.448',
    'Saving model checkpoint',
    'Registering fine-tuned model',
    'Job completed successfully',
  ];
}

// ---- Pipeline status bar ----
function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'running')   return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
  return <Circle className="w-4 h-4 text-slate-300" />;
}

function PipelineBar({ run }: { run: Run }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-200">
      {run.pipeline.map((step, i) => (
        <div key={step.name} className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium',
            step.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            step.status === 'running'   ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                          'bg-white border-slate-200 text-slate-400'
          )}>
            <StepIcon status={step.status} />
            {step.name}
          </div>
          {i < run.pipeline.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ---- Locked Tab Placeholder ----
function LockedTab({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
      <Lock className="w-8 h-8 text-slate-300" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ---- Method Selector cards ----
const METHODS = [
  {
    id: 'prompt' as const,
    icon: MessageSquare,
    title: 'Prompt Customization',
    description: 'Shape model behavior with system prompts, templates, and few-shot examples — no parameter changes.',
  },
  {
    id: 'finetune' as const,
    icon: Cpu,
    title: 'Fine-tuning',
    description: 'Adjust model weights using SFT, LoRA, QLoRA, DPO, or RLHF for deeper task specialization.',
  },
  {
    id: 'both' as const,
    icon: Wand2,
    title: 'Both',
    description: 'Combine prompt customization with fine-tuning for maximum control over model behavior.',
  },
];

// ---- Read-only Config Display ----
function ReadOnlyConfig({ config, method }: { config: Record<string, string | number | boolean>; method: string }) {
  const entries = Object.entries(config).filter(([k]) => !['dataset', 'evalMetrics'].includes(k));
  if (entries.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-3">
      {entries.map(([key, value]) => (
        <div key={key} className="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
          </div>
          <div className="text-sm font-medium text-slate-800 truncate">{String(value)}</div>
        </div>
      ))}
    </div>
  );
}

// ---- Job Events Card ----
interface JobEventsCardProps {
  events: string[];
  completedCount: number;
  progress: number;
  done: boolean;
}

function JobEventsCard({ events, completedCount, progress, done }: JobEventsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Customization Job</h3>
        {done ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running
          </span>
        )}
      </div>

      {!done && (
        <div className="px-5 pt-4 pb-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      <div className="px-5 py-3 space-y-2.5">
        {events.map((evt, i) => {
          const isDone    = i < completedCount;
          const isActive  = i === completedCount && !done;
          const isPending = !isDone && !isActive;
          return (
            <div key={i} className="flex items-center gap-2.5">
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
              ) : (
                <CircleIcon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              )}
              <span className={cn('text-xs', isDone ? 'text-slate-700' : isPending ? 'text-slate-400' : 'text-blue-600 font-medium')}>
                {evt}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Customization Tab ----
interface CustomizationTabProps {
  run: Run;
  expId: string;
  onDirty: () => void;
}

function CustomizationTab({ run, expId, onDirty }: CustomizationTabProps) {
  const { updateRun } = useExperiments();

  const custStepStatus = run.pipeline[0]?.status ?? 'pending';

  // Method chosen locally (for pending step, new runs)
  const [pickedMethod, setPickedMethod] = useState<'prompt' | 'finetune' | 'both' | null>(null);

  // Form state
  const defaultFTMethod: FTMethod = (() => {
    if (run.method.includes('QLoRA')) return 'QLoRA';
    if (run.method.includes('LoRA'))  return 'LoRA';
    if (run.method.includes('SFT'))   return 'SFT';
    if (run.method.includes('DPO'))   return 'DPO';
    if (run.method.includes('RLHF'))  return 'RLHF';
    return 'LoRA';
  })();
  const [systemPrompt, setSystemPrompt] = useState(
    (run.config.systemPrompt as string) || 'You are a financial email classifier specialized in retail banking customer service.'
  );
  const [userTemplate, setUserTemplate]     = useState('Classify the following email: {email}');
  const [assistantTemplate, setAssistantTemplate] = useState('Category: {category} — Priority: {priority}\n\n{explanation}');
  const [examples, setExamples] = useState([
    { user: 'I cannot access my account.', assistant: 'Category: Digital Access Issue — Priority: High' },
  ]);
  const [ftMethod, setFtMethod] = useState<FTMethod>(defaultFTMethod);
  const [ftConfig, setFtConfig] = useState<Record<string, string | number>>(
    Object.fromEntries(FT_FIELDS[defaultFTMethod].map(f => [f.key, (run.config[f.key] as string | number) ?? f.default]))
  );

  useEffect(() => {
    setFtConfig(Object.fromEntries(FT_FIELDS[ftMethod].map(f => [f.key, f.default])));
  }, [ftMethod]);

  // Job simulation state
  const [jobEvents, setJobEvents]         = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [jobProgress, setJobProgress]     = useState(0);
  const [jobRunning, setJobRunning]       = useState(false);

  const markDirty = () => onDirty();

  const showPrompt = pickedMethod === 'prompt' || pickedMethod === 'both';
  const showFT     = pickedMethod === 'finetune' || pickedMethod === 'both';

  // Playground state
  const [playPrompt, setPlayPrompt]         = useState('');
  const [playResponse, setPlayResponse]     = useState('');
  const [playRunning, setPlayRunning]       = useState(false);
  const [optimizing, setOptimizing]         = useState(false);

  const handleTestPrompt = async () => {
    if (!playPrompt.trim()) return;
    setPlayRunning(true);
    setPlayResponse('');
    await new Promise(r => setTimeout(r, 1200));
    setPlayResponse(
      `Category: Digital Access Issue — Priority: High\n\nBased on the provided context and the system prompt configuration, the model identifies this as a Tier-1 support escalation. The customer is experiencing login difficulties. Recommended action: Verify account status and escalate to Tier-2 if unresolved within 15 minutes.`
    );
    setPlayRunning(false);
  };

  const handleOptimizePrompt = async () => {
    setOptimizing(true);
    await new Promise(r => setTimeout(r, 1800));
    setSystemPrompt(prev =>
      `You are an expert financial email classification assistant specialized in retail banking customer service for a regulated financial institution.\n\nYour role is to:\n1. Accurately classify incoming customer emails into predefined categories\n2. Assess priority level (High/Medium/Low) based on urgency and regulatory implications\n3. Provide a concise explanation to support the classification decision\n\nAlways respond in a structured format: Category → Priority → Explanation.\n\n---\nOriginal intent: ${prev.split('\n')[0]}`
    );
    markDirty();
    setOptimizing(false);
    toast.success('Prompt optimized', { description: 'The system prompt has been improved for clarity and performance.' });
  };

  const handleSaveToRegistry = () => {
    toast.success('Prompt saved to registry', {
      description: 'Your prompt is now available in the Prompt Registry for reuse across experiments.',
    });
  };

  const handleStartCustomization = async () => {
    if (!pickedMethod) return;

    // Capture config before starting
    const savedConfig: Record<string, string | number | boolean> = {
      customizationMethod: pickedMethod,
      ...(showPrompt ? {
        systemPrompt,
        userTemplate,
        assistantTemplate,
        fewShotExamples: examples.length,
      } : {}),
      ...(showFT ? {
        ftMethod,
        ...ftConfig,
      } : {}),
    };

    // Get events for this method
    const methodLabel = showFT ? ftMethod : 'prompt';
    const events = getJobEvents(methodLabel);
    setJobEvents(events);
    setCompletedCount(0);
    setJobProgress(0);
    setJobRunning(true);

    // Mark step as running in context + save config
    updateRun(expId, run.id, 'Configuring', [
      { name: 'Customization', status: 'running' },
      { name: 'Inference',     status: 'pending' },
      { name: 'Evaluation',    status: 'pending' },
    ], savedConfig);

    // Simulate events
    for (let i = 0; i < events.length; i++) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 300));
      setCompletedCount(i + 1);
      setJobProgress(Math.round(((i + 1) / events.length) * 100));
    }

    // Done
    setJobRunning(false);
    updateRun(expId, run.id, 'Completed', [
      { name: 'Customization', status: 'completed' },
      { name: 'Inference',     status: 'pending' },
      { name: 'Evaluation',    status: 'pending' },
    ]);
    toast.success('Customization complete', { description: 'Inference tab is now unlocked.' });
  };

  // ---- COMPLETED STATE: read-only summary + events ----
  if (custStepStatus === 'completed') {
    const completedEvents = getJobEvents(
      (run.config.ftMethod as string) || run.method || 'LoRA'
    );
    return (
      <div className="p-6 space-y-5">
        {/* Completion banner */}
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium text-emerald-800">Customization complete</span>
          <span className="text-xs text-emerald-600 ml-auto">
            {run.method !== 'TBD' ? run.method : (run.config.customizationMethod as string) ?? 'Prompt Customization'}
          </span>
        </div>

        {/* Config summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Configuration Used</h3>
          <ReadOnlyConfig config={run.config} method={run.method} />
          {Object.keys(run.config).length === 0 && (
            <p className="text-xs text-slate-400">No configuration stored.</p>
          )}
        </div>

        {/* Completed job events */}
        <JobEventsCard
          events={completedEvents}
          completedCount={completedEvents.length}
          progress={100}
          done={true}
        />
      </div>
    );
  }

  // ---- RUNNING STATE: progress card ----
  if (custStepStatus === 'running' || jobRunning) {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
          <span className="text-sm font-medium text-blue-800">Customization job in progress…</span>
        </div>

        <JobEventsCard
          events={jobEvents.length > 0 ? jobEvents : getJobEvents('LoRA')}
          completedCount={completedCount}
          progress={jobProgress}
          done={false}
        />
      </div>
    );
  }

  // ---- PENDING STATE: method picker or config form ----
  if (!pickedMethod) {
    return (
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Choose Customization Method</h3>
          <p className="text-xs text-slate-500">Select how you want to customize the base model for this run.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2">
          {METHODS.map(({ id, icon: Icon, title, description }) => (
            <button
              key={id}
              onClick={() => setPickedMethod(id)}
              className="text-left rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 p-5 transition-all duration-150 group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="font-semibold text-slate-800 text-sm mb-1.5 group-hover:text-blue-700">{title}</div>
              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Config form
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => setPickedMethod(null)} className="text-blue-500 hover:underline">← Change method</button>
        <span>·</span>
        <span className="font-medium text-slate-700">
          {METHODS.find(m => m.id === pickedMethod)?.title}
        </span>
      </div>

      {showPrompt && (
        <>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Prompt Customization</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveToRegistry}
                className="text-xs border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 gap-1.5 h-7"
              >
                <BookMarked className="w-3.5 h-3.5" /> Save to Registry
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOptimizePrompt}
                disabled={optimizing}
                className="text-xs border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 gap-1.5 h-7"
              >
                {optimizing
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Optimizing…</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Prompt Optimizer</>}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">System Prompt</Label>
            <Textarea
              value={systemPrompt}
              onChange={e => { setSystemPrompt(e.target.value); markDirty(); }}
              rows={4}
              className="text-xs resize-none border-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">User Template</Label>
              <Input value={userTemplate} onChange={e => { setUserTemplate(e.target.value); markDirty(); }} className="text-xs border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Assistant Template</Label>
              <Input value={assistantTemplate} onChange={e => { setAssistantTemplate(e.target.value); markDirty(); }} className="text-xs border-slate-200" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600">Few-shot Examples ({examples.length})</Label>
              <button onClick={() => { setExamples(e => [...e, { user: '', assistant: '' }]); markDirty(); }} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {examples.map((ex, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-400">Example {i + 1}</span>
                  <button onClick={() => { setExamples(e => e.filter((_, j) => j !== i)); markDirty(); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                </div>
                <Input value={ex.user} onChange={e => { setExamples(prev => prev.map((x, j) => j === i ? { ...x, user: e.target.value } : x)); markDirty(); }} placeholder="User message…" className="text-xs h-7 bg-white border-slate-200" />
                <Input value={ex.assistant} onChange={e => { setExamples(prev => prev.map((x, j) => j === i ? { ...x, assistant: e.target.value } : x)); markDirty(); }} placeholder="Assistant response…" className="text-xs h-7 bg-white border-slate-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Playground */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-800">Prompt Playground</h3>
            <span className="text-[10px] text-slate-400 ml-1">Test your customized model with sample inputs</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Test Prompt</Label>
            <div className="relative">
              <Textarea
                value={playPrompt}
                onChange={e => setPlayPrompt(e.target.value)}
                placeholder="Enter a test prompt to see how the model responds with your current configuration…"
                rows={3}
                className="text-xs resize-none border-slate-200 pr-24"
              />
              <Button
                size="sm"
                onClick={handleTestPrompt}
                disabled={playRunning || !playPrompt.trim()}
                className="absolute bottom-2 right-2 gap-1.5 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {playRunning
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Running</>
                  : <><Send className="w-3 h-3" /> Test</>}
              </Button>
            </div>
          </div>

          {(playRunning || playResponse) && (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Model Response</Label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[72px] relative">
                {playRunning ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating response…
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{playResponse}</p>
                )}
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {showFT && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Fine-tuning Configuration</h3>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            {(Object.keys(FT_FIELDS) as FTMethod[]).map(m => (
              <button key={m} onClick={() => { setFtMethod(m); markDirty(); }} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', ftMethod === m ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                {m}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {FT_FIELDS[ftMethod].map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs text-slate-600">{f.label}</Label>
                <Input value={ftConfig[f.key] ?? f.default} onChange={e => { setFtConfig(c => ({ ...c, [f.key]: e.target.value })); markDirty(); }} className="text-xs border-slate-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={handleStartCustomization} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
        <Play className="w-4 h-4" /> Start Customization
      </Button>
    </div>
  );
}

// ---- Inference Tab ----
interface InferenceTabProps {
  run: Run;
  expId: string;
  custDone: boolean;
}

function InferenceTab({ run, expId, custDone }: InferenceTabProps) {
  const { updateRun } = useExperiments();

  if (!custDone) {
    return <LockedTab message="Complete Customization first to unlock Inference." />;
  }

  const handleResultsReady = () => {
    updateRun(expId, run.id, 'Completed', [
      { name: 'Customization', status: 'completed' },
      { name: 'Inference',     status: 'completed' },
      { name: 'Evaluation',    status: 'pending' },
    ]);
  };

  return (
    <div className="p-6">
      <InferencePanel
        initialDataset={datasetCatalog.find(d => d.name === run.datasetName)?.id ?? datasetCatalog[0].id}
        initialHasResults={run.pipeline[1]?.status === 'completed'}
        onResultsReady={handleResultsReady}
      />
    </div>
  );
}

// ---- Evaluation Tab — uses shared EvaluationPanel ----
// Do NOT add evaluation UI here. All changes belong in:
//   components/evaluation/EvaluationPanel.tsx
function EvaluationTab({ run, inferDone }: { run: Run; inferDone: boolean }) {
  if (!inferDone) {
    return <LockedTab message="Complete Inference first to unlock Evaluation." />;
  }
  return (
    <div className="p-6">
      <EvaluationPanel initialHasResults={run.pipeline[2]?.status === 'completed'} />
    </div>
  );
}

// ---- Main Page ----
export default function ExperimentDetailPage() {
  const params  = useParams();
  const expId   = params.id as string;

  const { experiments, loaded, addRun } = useExperiments();
  const experiment = experiments.find(e => e.id === expId) ?? experiments[0];

  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('customization');

  // Modal state
  const [modalOpen, setModalOpen]         = useState(false);
  const [newRunName, setNewRunName]       = useState('');
  const [newRunModel, setNewRunModel]     = useState('');
  const [modelSource, setModelSource]     = useState<'catalog' | 'upload'>('catalog');
  const [uploadedModel, setUploadedModel] = useState<string>('');

  // Unsaved changes guard
  const [isDirty, setIsDirty]           = useState(false);
  const [pendingRunId, setPendingRunId] = useState<string | null>(null);
  const [warnOpen, setWarnOpen]         = useState(false);

  useEffect(() => {
    if (loaded && !selectedRunId) {
      const exp = experiments.find(e => e.id === expId) ?? experiments[0];
      setSelectedRunId(exp?.runs[0]?.id);
    }
  }, [loaded, expId, experiments, selectedRunId]);

  // Reset dirty + tab when selected run changes
  const prevRunIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (selectedRunId && selectedRunId !== prevRunIdRef.current) {
      prevRunIdRef.current = selectedRunId;
      setIsDirty(false);
      setActiveTab('customization');
    }
  }, [selectedRunId]);

  if (!loaded || !experiment) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  const selectedRun = experiment.runs.find(r => r.id === selectedRunId) ?? experiment.runs[0];

  const custDone  = selectedRun ? selectedRun.pipeline[0]?.status === 'completed' : false;
  const inferDone = selectedRun ? selectedRun.pipeline[1]?.status === 'completed' : false;

  const handleSelectRun = (runId: string) => {
    if (isDirty && runId !== selectedRunId) {
      setPendingRunId(runId);
      setWarnOpen(true);
    } else {
      setSelectedRunId(runId);
    }
  };

  const handleCreateRun = () => {
    const modelName = modelSource === 'upload' ? uploadedModel : newRunModel;
    if (!newRunName.trim() || !modelName) return;
    const newRun = addRun(expId, newRunName.trim(), modelName);
    setNewRunName('');
    setNewRunModel('');
    setUploadedModel('');
    setModelSource('catalog');
    setModalOpen(false);
    setSelectedRunId(newRun.id);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Unsaved changes warning */}
      <AlertDialog open={warnOpen} onOpenChange={setWarnOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in this run. Switch anyway and lose them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsDirty(false);
              setWarnOpen(false);
              if (pendingRunId) setSelectedRunId(pendingRunId);
              setPendingRunId(null);
            }}>
              Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Run Modal */}
      <Dialog open={modalOpen} onOpenChange={open => {
        setModalOpen(open);
        if (!open) { setNewRunName(''); setNewRunModel(''); setUploadedModel(''); setModelSource('catalog'); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Run</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Run name <span className="text-red-400">*</span></Label>
              <Input
                autoFocus
                placeholder="e.g. LoRA experiment v2"
                value={newRunName}
                onChange={e => setNewRunName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateRun()}
                className="border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Base model <span className="text-red-400">*</span></Label>

              {/* Source toggle */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                {(['catalog', 'upload'] as const).map(src => (
                  <button
                    key={src}
                    onClick={() => { setModelSource(src); setNewRunModel(''); setUploadedModel(''); }}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                      modelSource === src ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {src === 'catalog' ? 'Select from catalog' : 'Upload files'}
                  </button>
                ))}
              </div>

              {modelSource === 'catalog' ? (
                <Select value={newRunModel} onValueChange={v => setNewRunModel(v ?? '')}>
                  <SelectTrigger className="border-slate-200 text-sm">
                    <SelectValue placeholder="Select a model…" />
                  </SelectTrigger>
                  <SelectContent>
                    {baseModelCatalog.map(m => (
                      <SelectItem key={m.id} value={m.name}>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-slate-400 ml-2 font-mono">{m.params} · {m.context} ctx</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <label className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 cursor-pointer transition-colors',
                  uploadedModel
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                )}>
                  <input
                    type="file"
                    accept=".bin,.safetensors,.pt,.gguf,.ggml"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setUploadedModel(f.name.replace(/\.[^.]+$/, ''));
                    }}
                  />
                  {uploadedModel ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-700">{uploadedModel}</span>
                      <span className="text-[10px] text-emerald-500">Click to replace</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">Click to upload model files</span>
                      <span className="text-[10px] text-slate-400">.bin · .safetensors · .pt · .gguf · .ggml</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateRun}
              disabled={!newRunName.trim() || (modelSource === 'catalog' ? !newRunModel : !uploadedModel)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Left Panel */}
      <div className="w-[280px] flex-shrink-0 border-r border-slate-200 flex flex-col bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
            <Link href="/" className="hover:text-slate-700 transition-colors">Experiments</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium truncate">{experiment.name}</span>
          </nav>
          <h2 className="font-bold text-slate-900 text-base leading-tight">{experiment.name}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border',
              experiment.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              experiment.status === 'Active'    ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-slate-100 text-slate-500 border-slate-200')}>{experiment.status}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2 pb-1.5">Runs</div>
          {experiment.runs.map(run => {
            const sc = runStatusConfig[run.status] ?? runStatusConfig.Draft;
            return (
              <button key={run.id} onClick={() => handleSelectRun(run.id)} className={cn(
                'w-full text-left rounded-lg px-4 py-3 transition-all duration-150 border',
                selectedRunId === run.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent'
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-sm font-semibold truncate max-w-[140px]', selectedRunId === run.id ? 'text-blue-900' : 'text-slate-700')}>{run.name}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0', sc.badge)}>{sc.label}</span>
                </div>
                {run.baseModel && (
                  <div className="text-xs font-mono text-slate-400">{run.baseModel}</div>
                )}
                <div className="text-xs text-slate-400 mt-0.5">{new Date(run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-200">
          <Button onClick={() => setModalOpen(true)} variant="outline" className="w-full border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Run
          </Button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto">
        {experiment.runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-12">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-1">No runs yet</p>
              <p className="text-sm text-slate-400">Create your first run to start customizing this model.</p>
            </div>
            <Button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 mt-2">
              <Plus className="w-4 h-4" /> Create First Run
            </Button>
          </div>
        ) : selectedRun ? (
          <div>
            <PipelineBar run={selectedRun} />
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-slate-200 bg-white px-6">
                <TabsList className="h-auto bg-transparent p-0 gap-0">
                  {[
                    { value: 'customization', label: 'Customization', locked: false },
                    { value: 'inference',     label: 'Inference',     locked: !custDone },
                    { value: 'evaluation',    label: 'Evaluation',    locked: !inferDone },
                  ].map(({ value, label, locked }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      disabled={locked}
                      className={cn(
                        'px-5 py-3 text-sm font-medium border-b-2 border-transparent rounded-none bg-transparent transition-colors',
                        locked
                          ? 'text-slate-300 cursor-not-allowed gap-1.5'
                          : 'text-slate-500 data-[state=active]:text-blue-600 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent hover:text-slate-700'
                      )}
                    >
                      {locked && <Lock className="w-3 h-3 inline mr-1" />}
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <TabsContent value="customization" className="mt-0">
                <CustomizationTab
                  run={selectedRun}
                  expId={expId}
                  onDirty={() => setIsDirty(true)}
                />
              </TabsContent>
              <TabsContent value="inference" className="mt-0">
                <InferenceTab
                  run={selectedRun}
                  expId={expId}
                  custDone={custDone}
                />
              </TabsContent>
              <TabsContent value="evaluation" className="mt-0">
                <EvaluationTab run={selectedRun} inferDone={inferDone} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">Select a run</div>
        )}
      </div>
    </div>
  );
}
