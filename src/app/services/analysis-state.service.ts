import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import {
  AnalysisInputFile,
  AnalysisResult,
  createInitialAnalysisResult,
  FileKind,
  SpectrumMode,
  WorkflowStage,
} from '../models/analysis-result';

export interface EnabledModulesState {
  sampleIntake: boolean;
  nileRed: boolean;
  ftir: boolean;
  integratedResults: boolean;
}

export interface AnalysisState {
  analysisResult: AnalysisResult;
  activeStep: WorkflowStage;
  analysisStarted: boolean;
  uploadedFiles: AnalysisInputFile[];
  uploadedFileName: string | null;
  uploadedFileExtension: string | null;
  uploadedFileKind: FileKind | null;
  spectrumMode: SpectrumMode | null;
  fileIntegrity: boolean;
  enabledModules: EnabledModulesState;
  moduleRestrictions: {
    nileRed: string | null;
    ftir: string | null;
  };
  validationMessage: string | null;
  completedSteps: WorkflowStage[];
}

const INITIAL_STATE: AnalysisState = {
  analysisResult: createInitialAnalysisResult(),
  activeStep: 'sample-intake',
  analysisStarted: false,
  uploadedFiles: [],
  uploadedFileName: null,
  uploadedFileExtension: null,
  uploadedFileKind: null,
  spectrumMode: null,
  fileIntegrity: false,
  enabledModules: {
    sampleIntake: true,
    nileRed: false,
    ftir: false,
    integratedResults: false,
  },
  moduleRestrictions: {
    nileRed: 'Sube una imagen (.jpg, .png, .tif) para habilitar Visión artificial.',
    ftir: 'Sube un espectro (.csv, .txt, .jdx, .spc) para habilitar Clasificación química.',
  },
  validationMessage: null,
  completedSteps: [],
};

@Injectable({ providedIn: 'root' })
export class AnalysisStateService {
  private readonly stateSubject = new BehaviorSubject<AnalysisState>(INITIAL_STATE);

  readonly state$: Observable<AnalysisState> = this.stateSubject.asObservable();

  get snapshot(): AnalysisState {
    return this.stateSubject.value;
  }

  checkFileIntegrity(file: File | null | undefined): boolean {
    return !!file && file.size > 0;
  }

  detectFileKind(extension: string): FileKind | null {
    const normalized = extension.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'tif', 'tiff'].includes(normalized)) {
      return 'image';
    }

    if (['csv', 'txt', 'jdx', 'spc'].includes(normalized)) {
      return 'spectrum';
    }

    return null;
  }

  uploadFiles(files: File[], spectrumMode: SpectrumMode = 'ftir'): void {
    if (!files.length) {
      return;
    }

    const acceptedFiles: AnalysisInputFile[] = [];
    const rejectedMessages: string[] = [];

    for (const file of files) {
      const extension = this.getExtension(file.name);
      const kind = this.detectFileKind(extension);
      const integrity = this.checkFileIntegrity(file);

      if (!kind) {
        rejectedMessages.push(`${file.name}: formato no permitido.`);
        continue;
      }

      if (!integrity) {
        rejectedMessages.push(`${file.name}: archivo vacío.`);
        continue;
      }

      acceptedFiles.push(
        kind === 'image'
          ? {
              id: this.createFileId(file),
              fileName: file.name,
              extension,
              kind,
              integrity,
              imageBlob: file,
              spectralData: null,
              spectrumMode: null,
            }
          : {
              id: this.createFileId(file),
              fileName: file.name,
              extension,
              kind,
              integrity,
              imageBlob: null,
              spectralData: this.buildSimulatedSpectrum(file.name, spectrumMode),
              spectrumMode,
            },
      );
    }

    const mergedFiles = this.mergeFiles(this.snapshot.uploadedFiles, acceptedFiles);
    this.applyFilesState(mergedFiles, spectrumMode, rejectedMessages.join(' '));
  }

  removeUploadedFile(fileId: string): void {
    const remaining = this.snapshot.uploadedFiles.filter((file) => file.id !== fileId);
    this.applyFilesState(remaining, this.snapshot.spectrumMode ?? 'ftir', null);
  }

  resetUpload(): void {
    this.stateSubject.next(INITIAL_STATE);
  }

  setSpectrumMode(mode: SpectrumMode): void {
    const snapshot = this.snapshot;

    if (!snapshot.uploadedFiles.some((file) => file.kind === 'spectrum')) {
      return;
    }

    const updatedFiles = snapshot.uploadedFiles.map((file) =>
      file.kind === 'spectrum'
        ? {
            ...file,
            spectrumMode: mode,
            spectralData: this.buildSimulatedSpectrum(file.fileName, mode),
          }
        : file,
    );

    this.patchState({
      spectrumMode: mode,
      uploadedFiles: updatedFiles,
      analysisResult: {
        ...snapshot.analysisResult,
        updatedAt: new Date().toISOString(),
        inputFiles: updatedFiles,
          inputFile: updatedFiles.at(-1) ?? null,
      },
    });
  }

  canProceed(step: WorkflowStage): boolean {
    const state = this.snapshot;

    if (step === 'sample-intake') {
      return true;
    }

    if (!state.analysisStarted) {
      return false;
    }

    if (step === 'nile-red') {
      return state.enabledModules.nileRed;
    }

    if (step === 'ftir-classification') {
      return state.enabledModules.ftir;
    }

    // integrated-results requires ALL enabled tests to be completed
    if (step === 'integrated-results') {
      if (!state.enabledModules.integratedResults) {
        return false;
      }

      // If nile-red is enabled, it must be completed
      if (state.enabledModules.nileRed && !state.completedSteps.includes('nile-red')) {
        return false;
      }

      // If ftir is enabled, it must be completed
      if (state.enabledModules.ftir && !state.completedSteps.includes('ftir-classification')) {
        return false;
      }

      // At least one of the enabled modules must be completed
      return state.completedSteps.includes('nile-red') || state.completedSteps.includes('ftir-classification');
    }

    return state.enabledModules.integratedResults;
  }

  nextEnabledStep(currentStep: WorkflowStage): WorkflowStage | null {
    const order: WorkflowStage[] = ['sample-intake', 'nile-red', 'ftir-classification', 'integrated-results'];
    const startIndex = order.indexOf(currentStep);

    for (let index = startIndex + 1; index < order.length; index += 1) {
      const candidate = order[index];

      if (this.canProceed(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  startAnalysis(): void {
    const snapshot = this.snapshot;

    if (!snapshot.fileIntegrity) {
      return;
    }

    let nextStep: WorkflowStage | null = null;

    if (snapshot.enabledModules.nileRed) {
      nextStep = 'nile-red';
    } else if (snapshot.enabledModules.ftir) {
      nextStep = 'ftir-classification';
    } else if (snapshot.enabledModules.integratedResults) {
      nextStep = 'integrated-results';
    }

    if (!nextStep) {
      return;
    }

    this.patchState({
      analysisStarted: true,
      activeStep: nextStep,
      analysisResult: {
        ...snapshot.analysisResult,
        updatedAt: new Date().toISOString(),
        currentStep: nextStep,
        status: 'processing',
      },
    });
  }

  navigateToStep(step: WorkflowStage): void {
    if (!this.canProceed(step)) {
      return;
    }

    this.patchState({
      activeStep: step,
      analysisResult: {
        ...this.snapshot.analysisResult,
        updatedAt: new Date().toISOString(),
        currentStep: step,
      },
    });
  }

  resetValidationMessage(): void {
    this.patchState({ validationMessage: null });
  }

  completeStep(step: WorkflowStage): void {
    const state = this.snapshot;
    
    if (state.completedSteps.includes(step)) {
      return;
    }

    const updatedCompletedSteps = [...state.completedSteps, step];

    this.patchState({
      completedSteps: updatedCompletedSteps,
      analysisResult: {
        ...state.analysisResult,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  private patchState(patch: Partial<AnalysisState>): void {
    this.stateSubject.next({
      ...this.snapshot,
      ...patch,
    });
  }

  private getExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  private buildSimulatedSpectrum(fileName: string, mode: SpectrumMode): number[] {
    const seed = `${fileName}:${mode}`.length;

    return Array.from({ length: 24 }, (_, index) => {
      const raw = Math.sin((index + 1) * 0.45 + seed) * 0.35 + 0.55;
      return Number(Math.max(0.05, Math.min(1, raw)).toFixed(4));
    });
  }

  private applyFilesState(
    files: AnalysisInputFile[],
    spectrumMode: SpectrumMode,
    validationMessage: string | null,
  ): void {
    const hasImage = files.some((file) => file.kind === 'image');
    const hasSpectrum = files.some((file) => file.kind === 'spectrum');
    const latestFile = files.at(-1) ?? null;

    const enabledModules: EnabledModulesState = {
      sampleIntake: true,
      nileRed: hasImage,
      ftir: hasSpectrum,
      integratedResults: hasImage || hasSpectrum,
    };

    this.patchState({
      uploadedFiles: files,
      uploadedFileName: latestFile?.fileName ?? null,
      uploadedFileExtension: latestFile?.extension ?? null,
      uploadedFileKind: latestFile?.kind ?? null,
      spectrumMode: hasSpectrum ? spectrumMode : null,
      fileIntegrity: files.length > 0,
      analysisStarted: false,
      validationMessage,
      enabledModules,
      moduleRestrictions: {
        nileRed: hasImage ? null : 'No disponible: sube una imagen (.jpg, .png, .tif).',
        ftir: hasSpectrum ? null : 'No disponible: sube un espectro (.csv, .txt, .jdx, .spc).',
      },
      activeStep: 'sample-intake',
      completedSteps: [],
      analysisResult: {
        ...this.snapshot.analysisResult,
        updatedAt: new Date().toISOString(),
        currentStep: 'sample-intake',
        status: 'draft',
        inputFiles: files,
        inputFile: latestFile,
      },
    });
  }

  private mergeFiles(current: AnalysisInputFile[], incoming: AnalysisInputFile[]): AnalysisInputFile[] {
    const map = new Map<string, AnalysisInputFile>();

    for (const file of current) {
      map.set(file.id, file);
    }

    for (const file of incoming) {
      map.set(file.id, file);
    }

    return Array.from(map.values());
  }

  private createFileId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }
}
