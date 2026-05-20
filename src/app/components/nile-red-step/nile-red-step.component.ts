import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AnalysisStateService } from '../../services/analysis-state.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-nile-red-step',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './nile-red-step.component.html',
  styleUrl: './nile-red-step.component.scss',
})
export class NileRedStepComponent {
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
    () => this.state().completedSteps.includes('nile-red'),
  );

  protected readonly uploadedFiles = computed(() => this.state().uploadedFiles);

  protected readonly imageFiles = computed(() => {
    const files = this.uploadedFiles();
    return files.filter((f) => f.kind === 'image');
  });

  protected readonly hasImages = computed(() => this.imageFiles().length > 0);

  protected completeAnalysis(): void {
    this.analysisStateService.completeStep('nile-red');
  }

  protected resetAnalysis(): void {
    console.log('Ready to re-analyze Nile Red');
  }
}
