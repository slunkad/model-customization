'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useExperiments } from '@/context/ExperimentsContext';
import { toast } from 'sonner';

export default function NewExperimentPage() {
  const router = useRouter();
  const { addExperiment } = useExperiments();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const newId = `exp-${Date.now()}`;
    addExperiment({
      id: newId,
      name,
      description,
      status: 'Draft',
      lastUpdated: new Date().toISOString(),
      runs: [],
    });

    toast.success('Experiment created', { description: `"${name}" is ready. Configure your first run.` });
    router.push(`/experiments/${newId}`);
  };

  return (
    <div className="p-8 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link href="/" className="hover:text-slate-700 transition-colors">Experiments</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">New Experiment</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create Experiment</h1>
          <p className="text-sm text-slate-500">Define a new model customization experiment.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-700">
            Experiment Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g. Customer Email Classifier"
            value={name}
            onChange={e => setName(e.target.value)}
            className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
            required
          />
          <p className="text-xs text-slate-400">A descriptive name for your use case.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the goal of this experiment and the problem you're solving..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="border-slate-200 focus:border-blue-400 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={!name || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Creating...' : 'Create Experiment'}
          </Button>
          <Link href="/">
            <Button type="button" variant="outline" className="border-slate-200 text-slate-600">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
