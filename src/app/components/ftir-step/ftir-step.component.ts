import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AnalysisStateService } from '../../services/analysis-state.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-ftir-step',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './ftir-step.component.html',
  styleUrl: './ftir-step.component.scss',
})
export class FtirStepComponent {
  private readonly analysisStateService = inject(AnalysisStateService);

  protected readonly state = toSignal(this.analysisStateService.state$, {
    initialValue: this.analysisStateService.snapshot,
  });

  protected readonly isLoading = signal(true);

  constructor() {
    // Simulate module load time (1.5 seconds)
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1500);
  }

  protected readonly analysisCompleted = computed(
    () => this.state().completedSteps.includes('ftir-classification'),
  );

  protected readonly spectrumMode = computed(() => this.state().spectrumMode);

  protected readonly spectrumLabel = computed(() => {
    const mode = this.spectrumMode();
    return mode === 'ftir' ? 'FTIR' : 'Raman';
  });

  protected readonly uploadedFiles = computed(() => this.state().uploadedFiles);

  protected readonly spectralFiles = computed(() => {
    const files = this.uploadedFiles();
    return files.filter((f) => f.kind === 'spectrum');
  });

  protected readonly spectralData = computed(() => {
    const files = this.spectralFiles();
    return files.find((f) => f.kind === 'spectrum')?.spectralData ?? [];
  });

  protected completeAnalysis(): void {
    this.analysisStateService.completeStep('ftir-classification');
  }

  protected resetAnalysis(): void {
    // Reset completion to allow re-analysis
    const state = this.state();
    const remaining = state.completedSteps.filter((s) => s !== 'ftir-classification');
    
    // Update state by navigating away and back, or implement a reset method
    // For now, we'll just log that it's ready to re-analyze
    console.log('Ready to re-analyze FTIR');
  }
}
