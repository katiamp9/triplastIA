import { CommonModule } from '@angular/common';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { FileSelectEvent, FileUpload, FileUploadModule } from 'primeng/fileupload';
import { SelectButtonModule } from 'primeng/selectbutton';

import { AnalysisStateService } from '../../services/analysis-state.service';
import { FileKind, SpectrumMode } from '../../models/analysis-result';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

interface SupportedFormatCard {
  kind: FileKind;
  title: string;
  description: string;
  extensions: string;
  icon: string;
}

const SUPPORTED_FORMATS: SupportedFormatCard[] = [
  {
    kind: 'image',
    title: 'Imágenes',
    description: 'Activa Nile Red / Modo científico',
    extensions: '.jpg · .png · .tif',
    icon: 'pi pi-image',
  },
  {
    kind: 'spectrum',
    title: 'Espectros',
    description: 'Activa FTIR o Raman / Modo clínico',
    extensions: '.csv · .txt · .jdx · .spc',
    icon: 'pi pi-chart-line',
  },
];

const SPECTRUM_MODES: Array<{ label: string; value: SpectrumMode }> = [
  { label: 'FTIR', value: 'ftir' },
  { label: 'Raman', value: 'raman' },
];

@Component({
  selector: 'app-sample-intake-step',
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploadModule, SelectButtonModule, LoadingSpinnerComponent],
  templateUrl: './sample-intake.component.html',
  styleUrl: './sample-intake.component.scss',
})
export class SampleIntakeComponent {
  @ViewChild('fileUpload') private readonly fileUpload?: FileUpload;

  private readonly analysisStateService = inject(AnalysisStateService);

  protected readonly state = toSignal(this.analysisStateService.state$, {
    initialValue: this.analysisStateService.snapshot,
  });

  protected readonly isLoading = signal(false);

  protected selectedSpectrumModeValue: SpectrumMode = 'ftir';

  protected readonly supportedFormats = SUPPORTED_FORMATS;

  protected readonly spectrumModes = SPECTRUM_MODES;

  protected readonly selectedFiles = computed(() => {
    return this.state().uploadedFiles;
  });

  protected readonly showSpectrumModeSelector = computed(
    () => this.state().uploadedFiles.some((file) => file.extension === 'jdx'),
  );

  protected readonly canContinue = computed(() => this.state().fileIntegrity);

  protected onFileSelect(event: FileSelectEvent): void {
    const files = event.files ?? [];

    if (!files.length) {
      return;
    }

    // Upload files immediately
    this.analysisStateService.uploadFiles(files, this.selectedSpectrumModeValue);
    this.fileUpload?.clear();

    // Show loading animation for visual feedback (1 second)
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }

  protected clearSelectedFiles(): void {
    this.analysisStateService.resetUpload();
  }

  protected checkFileIntegrity(file: File | null | undefined): boolean {
    return this.analysisStateService.checkFileIntegrity(file);
  }

  protected changeSpectrumMode(mode: SpectrumMode): void {
    this.selectedSpectrumModeValue = mode;
    this.analysisStateService.setSpectrumMode(mode);
  }

  protected removeFile(fileId: string): void {
    this.analysisStateService.removeUploadedFile(fileId);
  }

  protected analyzeSample(): void {
    this.analysisStateService.startAnalysis();
  }

  protected isActiveFormat(kind: FileKind): boolean {
    return this.state().uploadedFileKind === kind;
  }

  protected get statusLabel(): string {
    const state = this.state();

    if (!state.uploadedFiles.length) {
      return 'Aún no has cargado un archivo';
    }

    if (!state.fileIntegrity) {
      return 'Archivo vacío o inválido';
    }

    if (!state.analysisStarted) {
      return 'Archivo listo · presiona Analizar para iniciar la primera prueba';
    }

    if (state.enabledModules.nileRed && state.enabledModules.ftir) {
      return 'Imagen + espectro detectados · Ambos módulos habilitados';
    }

    if (state.enabledModules.nileRed) {
      return 'Archivo imagen detectado · Nile Red habilitado';
    }

    if (state.enabledModules.ftir) {
      return state.uploadedFiles.some((file) => file.extension === 'jdx')
        ? `Espectro JDX detectado · ${state.spectrumMode?.toUpperCase() ?? 'FTIR'} activo`
        : 'Espectro detectado · FTIR habilitado';
    }

    return 'Formato pendiente de validación';
  }

}
