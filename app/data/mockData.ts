export type ExperimentStatus = 'Completed' | 'Active' | 'Draft';
export type RunStatus = 'Draft' | 'Configuring' | 'Training' | 'Inferring' | 'Evaluating' | 'Completed' | 'Failed';
export type StepStatus = 'completed' | 'running' | 'pending' | 'failed';

export interface PipelineStep {
  name: string;
  status: StepStatus;
}

export interface Run {
  id: string;
  name: string;
  method: string;
  baseModel?: string;
  status: RunStatus;
  createdAt: string;
  pipeline: PipelineStep[];
  config: Record<string, string | number | boolean>;
  datasetName: string;
  customizationMethod?: 'prompt' | 'finetune' | 'both';
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  baseModel?: string;  // optional — base model is now set per-run
  status: ExperimentStatus;
  lastUpdated: string;
  runs: Run[];
}

export interface SampleRow {
  id: number;
  prompt: string;
  baseResponse: string;
  customResponse: string;
  score: number;
}

export interface ErrorInsight {
  type: 'warning' | 'info' | 'error';
  title: string;
  description: string;
  count: number;
}

export interface MetricResult {
  name: string;
  baseScore: number;
  customScore: number;
  unit?: string;
}

export interface EvalResults {
  metrics: MetricResult[];
  perSample: SampleRow[];
  errorInsights: ErrorInsight[];
}

// ------- Mock Experiments -------

export const mockExperiments: Experiment[] = [
  {
    id: 'exp-1',
    name: 'Customer Email Classifier',
    description: 'Fine-tune a model to classify incoming customer emails into support categories for the retail banking division.',
    baseModel: 'Llama-3-8B',
    status: 'Completed',
    lastUpdated: '2026-04-02T14:32:00Z',
    runs: [
      {
        id: 'run-1',
        name: 'Baseline Prompt',
        method: 'Prompt Customization',
        baseModel: 'Llama-3-8B',
        status: 'Completed',
        createdAt: '2026-03-28T09:00:00Z',
        datasetName: 'Financial Q&A Dataset',
        pipeline: [
          { name: 'Customization', status: 'completed' },
          { name: 'Inference', status: 'completed' },
          { name: 'Evaluation', status: 'completed' },
        ],
        config: {
          method: 'Prompt Customization',
          systemPrompt: 'You are a financial email classifier...',
          fewShotExamples: 5,
          dataset: 'Financial Q&A Dataset',
          evalMetrics: 'BLEU, F1, Exact Match',
        },
      },
      {
        id: 'run-2',
        name: 'LoRA Fine-tune v1',
        method: 'LoRA Fine-tuning',
        baseModel: 'Llama-3-8B',
        status: 'Completed',
        createdAt: '2026-03-30T11:15:00Z',
        datasetName: 'Financial Q&A Dataset',
        pipeline: [
          { name: 'Customization', status: 'completed' },
          { name: 'Inference', status: 'completed' },
          { name: 'Evaluation', status: 'completed' },
        ],
        config: {
          method: 'LoRA',
          loraRank: 16,
          loraAlpha: 32,
          loraDropout: 0.05,
          targetModules: 'q_proj,v_proj',
          learningRate: 0.0002,
          epochs: 3,
          batchSize: 8,
          dataset: 'Financial Q&A Dataset',
          evalMetrics: 'BLEU, ROUGE-L, F1, Hallucination Rate',
        },
      },
      {
        id: 'run-3',
        name: 'LoRA Fine-tune v2',
        method: 'LoRA Fine-tuning',
        baseModel: 'Llama-3-8B',
        status: 'Inferring',
        createdAt: '2026-04-02T08:00:00Z',
        datasetName: 'Financial Q&A Dataset',
        pipeline: [
          { name: 'Customization', status: 'completed' },
          { name: 'Inference', status: 'running' },
          { name: 'Evaluation', status: 'pending' },
        ],
        config: {
          method: 'LoRA',
          loraRank: 32,
          loraAlpha: 64,
          loraDropout: 0.1,
          targetModules: 'q_proj,k_proj,v_proj,o_proj',
          learningRate: 0.0001,
          epochs: 5,
          batchSize: 16,
          dataset: 'Financial Q&A Dataset',
          evalMetrics: 'BLEU, ROUGE-L, F1, Hallucination Rate',
        },
      },
    ],
  },
  {
    id: 'exp-2',
    name: 'Contract Summarizer',
    description: 'Adapt a model to generate concise legal summaries of vendor contracts for the procurement team.',
    baseModel: 'Mistral-7B',
    status: 'Active',
    lastUpdated: '2026-04-03T16:45:00Z',
    runs: [
      {
        id: 'run-4',
        name: 'QLoRA 4-bit',
        method: 'QLoRA Fine-tuning',
        baseModel: 'Mistral-7B',
        status: 'Completed',
        createdAt: '2026-04-01T10:00:00Z',
        datasetName: 'Contract Corpus v2',
        pipeline: [
          { name: 'Customization', status: 'completed' },
          { name: 'Inference', status: 'completed' },
          { name: 'Evaluation', status: 'completed' },
        ],
        config: {
          method: 'QLoRA',
          quantizationBits: 4,
          loraRank: 8,
          loraAlpha: 16,
          loraDropout: 0.05,
          learningRate: 0.0003,
          epochs: 2,
          batchSize: 4,
          dataset: 'Contract Corpus v2',
          evalMetrics: 'ROUGE-L, Faithfulness, Hallucination Rate',
        },
      },
      {
        id: 'run-5',
        name: 'SFT Full',
        method: 'SFT Fine-tuning',
        baseModel: 'Mistral-7B',
        status: 'Draft',
        createdAt: '2026-04-03T16:00:00Z',
        datasetName: 'Contract Corpus v2',
        pipeline: [
          { name: 'Customization', status: 'pending' },
          { name: 'Inference', status: 'pending' },
          { name: 'Evaluation', status: 'pending' },
        ],
        config: {
          method: 'SFT',
          learningRate: 0.00005,
          epochs: 1,
          batchSize: 4,
          dataset: 'Contract Corpus v2',
          evalMetrics: 'ROUGE-L, Faithfulness',
        },
      },
    ],
  },
  {
    id: 'exp-3',
    name: 'Risk Report Generator',
    description: 'Customize a large model to produce structured risk assessment reports from raw analyst notes.',
    baseModel: 'Llama-3-70B',
    status: 'Draft',
    lastUpdated: '2026-04-04T09:10:00Z',
    runs: [
      {
        id: 'run-6',
        name: 'DPO Alignment',
        method: 'DPO Fine-tuning',
        baseModel: 'Llama-3-70B',
        status: 'Draft',
        createdAt: '2026-04-04T09:00:00Z',
        datasetName: 'Risk Assessment Prompts',
        pipeline: [
          { name: 'Customization', status: 'pending' },
          { name: 'Inference', status: 'pending' },
          { name: 'Evaluation', status: 'pending' },
        ],
        config: {
          method: 'DPO',
          beta: 0.1,
          learningRate: 0.00001,
          epochs: 1,
          batchSize: 2,
          dataset: 'Risk Assessment Prompts',
          evalMetrics: 'BLEU, F1, Toxicity',
        },
      },
    ],
  },
];

// ------- Evaluation Results -------

export const mockEvalResults: EvalResults = {
  metrics: [
    { name: 'BLEU', baseScore: 0.61, customScore: 0.82 },
    { name: 'ROUGE-L', baseScore: 0.58, customScore: 0.74 },
    { name: 'F1', baseScore: 0.71, customScore: 0.88 },
    { name: 'Hallucination Rate', baseScore: 0.18, customScore: 0.042, unit: 'lower is better' },
  ],
  perSample: [
    {
      id: 1,
      prompt: 'Classify the following email: "I cannot access my online banking account since yesterday morning."',
      baseResponse: 'Technical issue or account problem.',
      customResponse: 'Category: Digital Access Issue — Priority: High. Customer reports inability to access online banking for >24hrs. Recommend escalation to Tier 2 support.',
      score: 0.94,
    },
    {
      id: 2,
      prompt: 'Classify: "Please update my mailing address to 45 Park Ave, New York, NY 10016."',
      baseResponse: 'Address change request.',
      customResponse: 'Category: Account Maintenance — Address Update. Action required: Identity verification before processing. Route to: Operations team.',
      score: 0.91,
    },
    {
      id: 3,
      prompt: 'Classify: "I was charged twice for the same transaction on March 28."',
      baseResponse: 'Billing issue or duplicate charge.',
      customResponse: 'Category: Transaction Dispute — Duplicate Charge. Date: March 28. Priority: High. Initiate chargeback review per Reg E guidelines.',
      score: 0.89,
    },
    {
      id: 4,
      prompt: 'Classify: "I want to apply for a home equity line of credit."',
      baseResponse: 'Loan application.',
      customResponse: 'Category: New Product Inquiry — HELOC Application. Route to: Retail Lending team. Required docs: Income verification, property appraisal.',
      score: 0.87,
    },
    {
      id: 5,
      prompt: 'Classify: "My debit card was declined at a grocery store even though I have funds."',
      baseResponse: 'Card issue.',
      customResponse: 'Category: Card Services — Declined Transaction. Likely causes: Daily limit exceeded, fraud hold, or chip reader error. Immediate action: Verify account status and fraud flags.',
      score: 0.73,
    },
  ],
  errorInsights: [
    {
      type: 'warning',
      title: 'Hallucinations in edge cases',
      description: '4.2% of responses contain factual inconsistencies, concentrated in ambiguous multi-category emails where intent is unclear.',
      count: 21,
    },
    {
      type: 'info',
      title: 'Response length variance',
      description: '12% of responses are significantly longer than expected (>200 tokens). Consider adding a length constraint to the system prompt.',
      count: 60,
    },
    {
      type: 'error',
      title: 'Category mismatch on regulatory queries',
      description: 'Emails referencing CFPB, Reg E, or compliance topics are occasionally miscategorized. Additional training data recommended.',
      count: 8,
    },
  ],
};

// ------- Training Logs -------

export const mockLogs: string[] = [
  '[2026-04-02 08:00:01] INFO  Initializing training environment on GPU cluster',
  '[2026-04-02 08:00:03] INFO  Loading base model: Llama-3-8B (fp16)',
  '[2026-04-02 08:00:18] INFO  Model loaded: 8.03B parameters, 15.2GB VRAM',
  '[2026-04-02 08:00:19] INFO  Applying LoRA adapters: rank=32, alpha=64',
  '[2026-04-02 08:00:20] INFO  Trainable parameters: 41.9M / 8030M (0.52%)',
  '[2026-04-02 08:00:21] INFO  Loading dataset: Financial Q&A Dataset (12,450 samples)',
  '[2026-04-02 08:00:22] INFO  Train/val split: 11,205 / 1,245',
  '[2026-04-02 08:00:23] INFO  Starting training — Epoch 1/5',
  '[2026-04-02 08:04:11] INFO  Epoch 1 | Step 100/701 | Loss: 2.341 | LR: 1.00e-04',
  '[2026-04-02 08:08:02] INFO  Epoch 1 | Step 200/701 | Loss: 1.987 | LR: 9.85e-05',
  '[2026-04-02 08:12:45] INFO  Epoch 1 | Step 400/701 | Loss: 1.653 | LR: 9.50e-05',
  '[2026-04-02 08:17:30] INFO  Epoch 1 complete | Train Loss: 1.521 | Val Loss: 1.612',
  '[2026-04-02 08:17:31] INFO  Starting training — Epoch 2/5',
  '[2026-04-02 08:25:10] INFO  Epoch 2 complete | Train Loss: 1.247 | Val Loss: 1.318',
  '[2026-04-02 08:25:11] INFO  Starting training — Epoch 3/5',
  '[2026-04-02 08:32:55] INFO  Epoch 3 complete | Train Loss: 1.089 | Val Loss: 1.143',
  '[2026-04-02 08:32:56] INFO  Checkpoint saved: ./checkpoints/epoch-3',
  '[2026-04-02 08:41:20] INFO  Epoch 4 complete | Train Loss: 0.982 | Val Loss: 1.047',
  '[2026-04-02 08:49:38] INFO  Epoch 5 complete | Train Loss: 0.931 | Val Loss: 1.002',
  '[2026-04-02 08:49:40] INFO  Training complete. Best checkpoint: epoch-5 (val_loss=1.002)',
];

// ------- Chart Data -------

export const mockChartData = Array.from({ length: 10 }, (_, i) => ({
  epoch: i + 1,
  trainLoss: parseFloat((2.4 - i * 0.16 + Math.random() * 0.05).toFixed(3)),
  valLoss: parseFloat((2.6 - i * 0.16 + Math.random() * 0.08).toFixed(3)),
  learningRate: parseFloat((1e-4 * Math.pow(0.97, i)).toExponential(2)),
}));

// ------- Training Data Insights -------

export const mockTrainingInsights = [
  { index: 1, input: 'I cannot access my online banking account.', target: 'Digital Access Issue', tokens: 12 },
  { index: 2, input: 'Please update my mailing address.', target: 'Account Maintenance', tokens: 8 },
  { index: 3, input: 'I was charged twice for the same transaction.', target: 'Transaction Dispute', tokens: 10 },
  { index: 4, input: 'I want to apply for a home equity line of credit.', target: 'New Product Inquiry', tokens: 11 },
  { index: 5, input: 'My debit card was declined at a grocery store.', target: 'Card Services', tokens: 10 },
];

// ------- Validation Insights -------

export const mockValidationInsights = {
  best: [
    { prompt: 'Cannot log into mobile app since update.', baseScore: 0.61, customScore: 0.94, category: 'Digital Access Issue' },
    { prompt: 'Charged a fee I did not authorize.', baseScore: 0.58, customScore: 0.92, category: 'Fee Dispute' },
    { prompt: 'Apply for auto loan refinancing.', baseScore: 0.63, customScore: 0.91, category: 'New Product Inquiry' },
  ],
  worst: [
    { prompt: 'Question about CFPB complaint process.', baseScore: 0.42, customScore: 0.54, category: 'Regulatory Inquiry' },
    { prompt: 'Both a fraud concern and address change needed.', baseScore: 0.39, customScore: 0.51, category: 'Multi-category' },
    { prompt: 'My account was flagged but I did nothing wrong.', baseScore: 0.44, customScore: 0.57, category: 'Account Review' },
  ],
};

// ------- Catalogs -------

export const baseModelCatalog = [
  { id: 'llama-3-8b', name: 'Llama-3-8B', params: '8B', context: '8K' },
  { id: 'llama-3-70b', name: 'Llama-3-70B', params: '70B', context: '8K' },
  { id: 'mistral-7b', name: 'Mistral-7B', params: '7B', context: '32K' },
  { id: 'falcon-40b', name: 'Falcon-40B', params: '40B', context: '4K' },
];

export const datasetCatalog = [
  { id: 'fin-qa', name: 'Financial Q&A Dataset', size: '12,450 samples', type: 'Classification' },
  { id: 'contract-v2', name: 'Contract Corpus v2', size: '3,200 samples', type: 'Summarization' },
  { id: 'risk-prompts', name: 'Risk Assessment Prompts', size: '1,800 samples', type: 'Generation' },
];

// ------- Chat Mock Responses -------

export const mockChatResponses: Record<string, string> = {
  default: 'Based on my fine-tuned understanding of your financial domain, I can classify and respond to customer inquiries with high precision. What would you like me to analyze?',
  email: 'Category: Digital Access Issue — Priority: High\n\nThe customer reports inability to access their online banking portal. Recommended action: Escalate to Tier 2 Digital Support. Estimated resolution time: 2-4 hours.',
  classify: 'I have classified this input as: **Transaction Dispute — Duplicate Charge**\n\nConfidence: 96.4%\nPriority: High\nRouting: Operations > Chargeback Team\nRegulatory note: Subject to Reg E (12 CFR 1005)',
};
