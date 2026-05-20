export type WorkflowStage = 'sample-intake' | 'nile-red' | 'ftir-classification' | 'integrated-results';
export type FileKind = 'image' | 'spectrum';
export type SpectrumMode = 'ftir' | 'raman';

export interface AnalysisInputFile {
  id: string;
  fileName: string;
  extension: string;
  kind: FileKind;
  integrity: boolean;
  imageBlob: Blob | null;
  spectralData: number[] | null;
  spectrumMode: SpectrumMode | null;
}

export interface DetectedParticle {
  id: string;
  sizeMicrometers: number;
  probability: number;
}

export interface PolymerPrediction {
  name: string;
  probability: number;
  badge: 'success' | 'info' | 'warning' | 'danger';
}

export interface AnalysisSummaryRow {
  variable: string;
  value: string;
  risk: 'Bajo' | 'Moderado' | 'Alto';
}

export interface AnalysisResult {
  sampleId: string;
  currentStep: WorkflowStage;
  status: 'draft' | 'processing' | 'review' | 'completed';
  updatedAt: string;
  inputFiles: AnalysisInputFile[];
  inputFile: AnalysisInputFile | null;
  nileRed: {
    threshold: number;
    particles: DetectedParticle[];
  };
  ftir: {
    topPolymers: PolymerPrediction[];
  };
  summary: {
    rows: AnalysisSummaryRow[];
    exploratoryScore: number;
  };
}

export const createInitialAnalysisResult = (): AnalysisResult => ({
  sampleId: 'MUESTRA-001',
  currentStep: 'sample-intake',
  status: 'draft',
  updatedAt: new Date().toISOString(),
  inputFiles: [],
  inputFile: null,
  nileRed: {
    threshold: 58,
    particles: [],
  },
  ftir: {
    topPolymers: [],
  },
  summary: {
    rows: [],
    exploratoryScore: 0,
  },
});