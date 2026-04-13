'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MessageSquare, Cpu, Layers, Plus, Trash2, Send, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockChatResponses, datasetCatalog } from '@/data/mockData';
import { useExperiments } from '@/context/ExperimentsContext';
import InferencePanel from '@/components/runs/InferencePanel';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ---- Types ----
type Method = 'prompt' | 'finetune' | 'both';
type FTMethod = 'SFT' | 'LoRA' | 'QLoRA' | 'DPO' | 'RLHF';

const STEPS = ['Method', 'Customize', 'Inference', 'Evaluation', 'Review'];

const FT_CONFIGS: Record<FTMethod, { label: string; fields: { key: string; label: string; type: string; default: string | number }[] }> = {
  LoRA: {
    label: 'LoRA',
    fields: [
      { key: 'rank', label: 'LoRA Rank', type: 'number', default: 16 },
      { key: 'alpha', label: 'Alpha', type: 'number', default: 32 },
      { key: 'dropout', label: 'Dropout', type: 'number', default: 0.05 },
      { key: 'targetModules', label: 'Target Modules', type: 'text', default: 'q_proj,v_proj' },
      { key: 'epochs', label: 'Epochs', type: 'number', default: 3 },
      { key: 'learningRate', label: 'Learning Rate', type: 'number', default: 0.0002 },
    ],
  },
  QLoRA: {
    label: 'QLoRA',
    fields: [
      { key: 'quantBits', label: 'Quantization Bits', type: 'number', default: 4 },
      { key: 'rank', label: 'LoRA Rank', type: 'number', default: 8 },
      { key: 'alpha', label: 'Alpha', type: 'number', default: 16 },
      { key: 'dropout', label: 'Dropout', type: 'number', default: 0.05 },
      { key: 'epochs', label: 'Epochs', type: 'number', default: 2 },
      { key: 'learningRate', label: 'Learning Rate', type: 'number', default: 0.0003 },
    ],
  },
  SFT: {
    label: 'SFT',
    fields: [
      { key: 'learningRate', label: 'Learning Rate', type: 'number', default: 0.00005 },
      { key: 'epochs', label: 'Epochs', type: 'number', default: 1 },
      { key: 'batchSize', label: 'Batch Size', type: 'number', default: 4 },
      { key: 'warmupSteps', label: 'Warmup Steps', type: 'number', default: 100 },
    ],
  },
  DPO: {
    label: 'DPO',
    fields: [
      { key: 'beta', label: 'Beta', type: 'number', default: 0.1 },
      { key: 'learningRate', label: 'Learning Rate', type: 'number', default: 0.00001 },
      { key: 'epochs', label: 'Epochs', type: 'number', default: 1 },
    ],
  },
  RLHF: {
    label: 'RLHF',
    fields: [
      { key: 'rewardModel', label: 'Reward Model', type: 'text', default: 'internal-reward-v2' },
      { key: 'klCoeff', label: 'KL Coefficient', type: 'number', default: 0.02 },
      { key: 'episodes', label: 'Episodes', type: 'number', default: 100 },
    ],
  },
};

const EVAL_METRICS = {
  Programmatic: ['BLEU', 'ROUGE-L', 'Exact Match', 'F1'],
  'LM Judges': ['GPT-4-as-Judge', 'Prometheus', 'Custom Judge'],
  'Task-specific': ['Faithfulness', 'Toxicity', 'Hallucination Rate'],
};

// ---- Step Indicator ----
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            i === current ? 'bg-blue-600 text-white' :
            i < current  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                           'bg-slate-100 text-slate-400'
          )}>
            {i < current ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
            {step}
          </div>
          {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1" />}
        </div>
      ))}
    </div>
  );
}

// ---- Step 1: Method ----
function MethodStep({ selected, onChange }: { selected: Method | null; onChange: (m: Method) => void }) {
  const options = [
    { id: 'prompt' as Method, icon: MessageSquare, label: 'Prompt Customization', desc: 'Adjust system prompt, templates, and few-shot examples — no parameter changes. Fast to iterate, no GPU required.' },
    { id: 'finetune' as Method, icon: Cpu, label: 'Fine-tuning', desc: 'Tune model weights on your domain data using SFT, LoRA, QLoRA, DPO, or RLHF. Higher accuracy, more configuration.' },
    { id: 'both' as Method, icon: Layers, label: 'Both', desc: 'Combine prompt customization with fine-tuning for maximum control. Recommended for production deployments.' },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {options.map(({ id, icon: Icon, label, desc }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'text-left rounded-xl border-2 p-5 transition-all duration-150',
            selected === id
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
          )}
        >
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', selected === id ? 'bg-blue-600' : 'bg-slate-100')}>
            <Icon className={cn('w-5 h-5', selected === id ? 'text-white' : 'text-slate-400')} />
          </div>
          <div className="font-semibold text-sm text-slate-800 mb-1.5">{label}</div>
          <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
        </button>
      ))}
    </div>
  );
}

// ---- Step 2: Customize ----
function CustomizeStep({ method, promptConfig, setPromptConfig, ftMethod, setFtMethod, ftConfig, setFtConfig, dataset, setDataset }: {
  method: Method;
  promptConfig: { system: string; userTemplate: string; assistantTemplate: string; examples: { user: string; assistant: string }[] };
  setPromptConfig: React.Dispatch<React.SetStateAction<typeof promptConfig>>;
  ftMethod: FTMethod;
  setFtMethod: (m: FTMethod) => void;
  ftConfig: Record<string, string | number>;
  setFtConfig: React.Dispatch<React.SetStateAction<typeof ftConfig>>;
  dataset: string;
  setDataset: (s: string) => void;
}) {
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState<{ role: string; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMsgs(m => [...m, { role: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setChatMsgs(m => [...m, { role: 'assistant', text: mockChatResponses.default }]);
    setChatLoading(false);
  };

  return (
    <div className="space-y-6">
      {(method === 'prompt' || method === 'both') && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" /> Prompt Customization
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">System Prompt</Label>
                <Textarea
                  value={promptConfig.system}
                  onChange={e => setPromptConfig(p => ({ ...p, system: e.target.value }))}
                  placeholder="You are a financial email classifier specialized in..."
                  rows={4}
                  className="text-xs resize-none border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">User Template</Label>
                <Input value={promptConfig.userTemplate} onChange={e => setPromptConfig(p => ({ ...p, userTemplate: e.target.value }))} className="text-xs border-slate-200" placeholder="Classify the following email: {email}" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Assistant Template</Label>
                <Input value={promptConfig.assistantTemplate} onChange={e => setPromptConfig(p => ({ ...p, assistantTemplate: e.target.value }))} className="text-xs border-slate-200" placeholder="Category: {category} — Priority: {priority}" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-600">Few-shot Examples ({promptConfig.examples.length})</Label>
                  <button onClick={() => setPromptConfig(p => ({ ...p, examples: [...p.examples, { user: '', assistant: '' }] }))} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {promptConfig.examples.map((ex, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">Example {i + 1}</span>
                      <button onClick={() => setPromptConfig(p => ({ ...p, examples: p.examples.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <Input value={ex.user} onChange={e => setPromptConfig(p => ({ ...p, examples: p.examples.map((x, j) => j === i ? { ...x, user: e.target.value } : x) }))} placeholder="User message..." className="text-xs h-7 border-slate-200 bg-white" />
                    <Input value={ex.assistant} onChange={e => setPromptConfig(p => ({ ...p, examples: p.examples.map((x, j) => j === i ? { ...x, assistant: e.target.value } : x) }))} placeholder="Assistant response..." className="text-xs h-7 border-slate-200 bg-white" />
                  </div>
                ))}
              </div>
            </div>
            {/* Playground */}
            <div className="flex flex-col gap-3 bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-600">Playground</div>
              <div className="flex-1 space-y-2 min-h-[180px]">
                {chatMsgs.map((m, i) => (
                  <div key={i} className={cn('text-xs px-3 py-2 rounded-lg max-w-[90%]', m.role === 'user' ? 'bg-blue-600 text-white ml-auto' : 'bg-white border border-slate-200 text-slate-700')}>{m.text}</div>
                ))}
                {chatLoading && <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 w-fit"><Loader2 className="w-3 h-3 animate-spin text-slate-400" /></div>}
              </div>
              <div className="flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Test your prompt..." className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-400" />
                <button onClick={sendChat} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-blue-700"><Send className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(method === 'finetune' || method === 'both') && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" /> Fine-tuning Configuration
          </h3>
          {/* Method tabs */}
          <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
            {(Object.keys(FT_CONFIGS) as FTMethod[]).map(m => (
              <button key={m} onClick={() => setFtMethod(m)} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', ftMethod === m ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                {m}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {FT_CONFIGS[ftMethod].fields.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs text-slate-600">{f.label}</Label>
                <Input
                  type={f.type}
                  value={ftConfig[f.key] ?? f.default}
                  onChange={e => setFtConfig(c => ({ ...c, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                  className="text-xs border-slate-200"
                />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Training Dataset</Label>
            <Select value={dataset} onValueChange={(v) => setDataset(v ?? '')}>
              <SelectTrigger className="border-slate-200 text-sm max-w-xs">
                <SelectValue placeholder="Select dataset..." />
              </SelectTrigger>
              <SelectContent>
                {datasetCatalog.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="font-medium">{d.name}</span>
                    <span className="text-xs text-slate-400 ml-2">{d.size}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Step 3: Inference ----
function InferenceStep({ onResultsReady }: { onResultsReady: () => void }) {
  return <InferencePanel onResultsReady={onResultsReady} />;
}

// ---- Step 4: Evaluation ----
function EvaluationStep({ selected, toggle }: { selected: Set<string>; toggle: (m: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 max-w-2xl">
      {Object.entries(EVAL_METRICS).map(([group, metrics]) => (
        <div key={group}>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{group}</div>
          <div className="flex flex-wrap gap-2">
            {metrics.map(metric => (
              <button
                key={metric}
                onClick={() => toggle(metric)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                  selected.has(metric)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                )}
              >
                {selected.has(metric) && <Check className="w-3 h-3 inline mr-1" />}
                {metric}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Step 5: Review ----
function ReviewStep({ method, ftMethod, ftConfig, evalMetrics, inferenceDataset }: {
  method: Method; ftMethod: FTMethod; ftConfig: Record<string, string | number>; evalMetrics: Set<string>; inferenceDataset: string;
}) {
  const ds = datasetCatalog.find(d => d.id === inferenceDataset);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl space-y-5">
      <h3 className="font-semibold text-slate-800 text-sm">Run Configuration Summary</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b border-slate-100">
          <span className="text-slate-500">Customization Method</span>
          <span className="font-medium text-slate-800 capitalize">{method === 'both' ? 'Prompt Customization + Fine-tuning' : method === 'prompt' ? 'Prompt Customization' : 'Fine-tuning'}</span>
        </div>
        {(method === 'finetune' || method === 'both') && (
          <>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Fine-tuning Method</span>
              <span className="font-medium text-slate-800">{ftMethod}</span>
            </div>
            {Object.entries(ftConfig).slice(0, 4).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-mono text-xs">{k}</span>
                <span className="font-mono text-xs text-slate-800">{String(v)}</span>
              </div>
            ))}
          </>
        )}
        <div className="flex justify-between py-2 border-b border-slate-100">
          <span className="text-slate-500">Inference Dataset</span>
          <span className="font-medium text-slate-800">{ds?.name ?? '—'}</span>
        </div>
        <div className="py-2">
          <span className="text-slate-500">Evaluation Metrics</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[...evalMetrics].map(m => (
              <span key={m} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2 py-0.5 rounded-full">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main ----
export default function RunWizardPage() {
  const params = useParams();
  const router = useRouter();
  const expId = params.id as string;
  const { experiments, loaded } = useExperiments();
  const experiment = experiments.find(e => e.id === expId) ?? experiments[0];
  if (!loaded || !experiment) return null;

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<Method | null>(null);
  const [promptConfig, setPromptConfig] = useState({
    system: 'You are a financial email classifier specialized in retail banking.',
    userTemplate: 'Classify the following email: {email}',
    assistantTemplate: 'Category: {category} — Priority: {priority}\n\n{explanation}',
    examples: [{ user: 'I cannot access my account.', assistant: 'Category: Digital Access Issue — Priority: High' }],
  });
  const [ftMethod, setFtMethod] = useState<FTMethod>('LoRA');
  const [ftConfig, setFtConfig] = useState<Record<string, string | number>>({});
  const [trainDataset, setTrainDataset] = useState('');
  const [inferDone, setInferDone] = useState(false);
  const [evalMetrics, setEvalMetrics] = useState<Set<string>>(new Set(['BLEU', 'ROUGE-L', 'Hallucination Rate']));
  const [launching, setLaunching] = useState(false);

  const toggleMetric = (m: string) => setEvalMetrics(prev => { const s = new Set(prev); s.has(m) ? s.delete(m) : s.add(m); return s; });

  const canNext = () => {
    if (step === 0) return !!method;
    if (step === 1) return true;
    if (step === 2) return inferDone;
    if (step === 3) return evalMetrics.size > 0;
    return true;
  };

  const handleLaunch = async () => {
    setLaunching(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success('Run launched!', { description: 'Your run is queued and will start shortly.' });
    router.push(`/experiments/${expId}`);
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-slate-700 transition-colors">Experiments</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/experiments/${expId}`} className="hover:text-slate-700 transition-colors">{experiment.name}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">New Run</span>
      </nav>

      <h1 className="text-xl font-bold text-slate-900 mb-6">Configure Run</h1>

      <StepBar current={step} />

      <div className="min-h-[400px]">
        {step === 0 && <MethodStep selected={method} onChange={setMethod} />}
        {step === 1 && method && (
          <CustomizeStep
            method={method}
            promptConfig={promptConfig} setPromptConfig={setPromptConfig}
            ftMethod={ftMethod} setFtMethod={setFtMethod}
            ftConfig={ftConfig} setFtConfig={setFtConfig}
            dataset={trainDataset} setDataset={setTrainDataset}
          />
        )}
        {step === 2 && <InferenceStep onResultsReady={() => setInferDone(true)} />}
        {step === 3 && <EvaluationStep selected={evalMetrics} toggle={toggleMetric} />}
        {step === 4 && method && <ReviewStep method={method} ftMethod={ftMethod} ftConfig={ftConfig} evalMetrics={evalMetrics} inferenceDataset="" />}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-200">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="border-slate-200 text-slate-600">
            Back
          </Button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleLaunch} disabled={launching} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            {launching ? <><Loader2 className="w-4 h-4 animate-spin" /> Launching...</> : '🚀 Launch Run'}
          </Button>
        )}
      </div>
    </div>
  );
}
