'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { mockExperiments, type Experiment, type Run, type RunStatus, type PipelineStep } from '@/data/mockData';

const STORAGE_KEY = 'modelforge_experiments';

interface ExperimentsContextValue {
  experiments: Experiment[];
  loaded: boolean;
  addExperiment: (exp: Experiment) => void;
  addRun: (experimentId: string, runName: string, baseModel: string) => Run;
  updateRun: (
    experimentId: string,
    runId: string,
    status: RunStatus,
    pipeline?: PipelineStep[],
    config?: Record<string, string | number | boolean>
  ) => void;
}

const ExperimentsContext = createContext<ExperimentsContextValue | null>(null);

export function ExperimentsProvider({ children }: { children: React.ReactNode }) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setExperiments(stored ? JSON.parse(stored) : mockExperiments);
    } catch {
      setExperiments(mockExperiments);
    }
    setLoaded(true);
  }, []);

  const persist = (next: Experiment[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const addExperiment = useCallback((exp: Experiment) => {
    setExperiments(prev => {
      const next = [exp, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const addRun = useCallback((experimentId: string, runName: string, baseModel: string): Run => {
    const newRun: Run = {
      id: `run-${Date.now()}`,
      name: runName,
      method: 'TBD',
      baseModel,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      pipeline: [
        { name: 'Customization', status: 'pending' },
        { name: 'Inference',     status: 'pending' },
        { name: 'Evaluation',    status: 'pending' },
      ],
      config: {},
      datasetName: '',
    };
    setExperiments(prev => {
      const next = prev.map(exp =>
        exp.id === experimentId
          ? { ...exp, runs: [...exp.runs, newRun] }
          : exp
      );
      persist(next);
      return next;
    });
    return newRun;
  }, []);

  const updateRun = useCallback((
    experimentId: string,
    runId: string,
    status: RunStatus,
    pipeline?: PipelineStep[],
    config?: Record<string, string | number | boolean>
  ) => {
    setExperiments(prev => {
      const next = prev.map(exp => {
        if (exp.id !== experimentId) return exp;
        return {
          ...exp,
          runs: exp.runs.map(run => {
            if (run.id !== runId) return run;
            return {
              ...run,
              status,
              ...(pipeline ? { pipeline } : {}),
              ...(config !== undefined ? { config: { ...run.config, ...config } } : {}),
            };
          }),
        };
      });
      persist(next);
      return next;
    });
  }, []);

  return (
    <ExperimentsContext.Provider value={{ experiments, loaded, addExperiment, addRun, updateRun }}>
      {children}
    </ExperimentsContext.Provider>
  );
}

export function useExperiments() {
  const ctx = useContext(ExperimentsContext);
  if (!ctx) throw new Error('useExperiments must be used inside ExperimentsProvider');
  return ctx;
}
