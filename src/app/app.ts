import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import { toSignal } from '@angular/core/rxjs-interop';

import { WorkflowStage } from './models/analysis-result';
import { SidebarComponent, type SidebarItem } from './components/sidebar/sidebar.component';
import { SampleIntakeComponent } from './components/sample-intake/sample-intake.component';
import { NileRedStepComponent } from './components/nile-red-step/nile-red-step.component';
import { FtirStepComponent } from './components/ftir-step/ftir-step.component';
import { IntegratedResultsStepComponent } from './components/integrated-results-step/integrated-results-step.component';
import { AnalysisStateService } from './services/analysis-state.service';

interface WorkflowStep {
  id: WorkflowStage;
  label: string;
  description: string;
  icon: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'Nueva Muestra',
    icon: 'pi pi-plus-circle',
  },
  {
    label: 'Nile Red',
    description: 'Visión artificial y segmentación',
    icon: 'pi pi-eye',
  },
  {
    label: 'FTIR/Raman',
    description: 'Huella espectral y clasificación',
    icon: 'pi pi-chart-line',
  },
  {
    label: 'Reporte',
    description: 'Resumen médico y auditoría',
    icon: 'pi pi-file',
  },
  {
    label: 'Configuración',
    description: 'Parámetros del pipeline analítico',
    icon: 'pi pi-cog',
  },
];

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'sample-intake',
    label: 'Nueva muestra',
    description: 'Ingreso, identificación y preparación de la muestra biológica.',
    icon: 'pi pi-plus-circle',
  },
  {
    id: 'nile-red',
    label: 'Visión artificial',
    description: 'Adquisición con Nile Red, segmentación y conteo de partículas.',
    icon: 'pi pi-eye',
  },
  {
    id: 'ftir-classification',
    label: 'Clasificación química',
    description: 'Lectura FTIR, espectros y predicción de polímeros.',
    icon: 'pi pi-chart-line',
  },
  {
    id: 'integrated-results',
    label: 'Resultados finales',
    description: 'Resumen médico, score exploratorio y reporte para revisión.',
    icon: 'pi pi-file',
  },
];

const STEP_TO_SIDEBAR_LABEL: Record<WorkflowStage, string> = {
  'sample-intake': 'Nueva Muestra',
  'nile-red': 'Nile Red',
  'ftir-classification': 'FTIR/Raman',
  'integrated-results': 'Reporte',
};

const SIDEBAR_LABEL_TO_STEP: Partial<Record<string, WorkflowStage>> = {
  'Nueva Muestra': 'sample-intake',
  'Nile Red': 'nile-red',
  'FTIR/Raman': 'ftir-classification',
  Reporte: 'integrated-results',
};

@Component({
  selector: 'app-root',
  imports: [StepsModule, SidebarComponent, SampleIntakeComponent, NileRedStepComponent, FtirStepComponent, IntegratedResultsStepComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-shell app-dark',
  },
})
export class App {
  private readonly analysisStateService = inject(AnalysisStateService);

  protected readonly sidebarItems = SIDEBAR_ITEMS;

  protected readonly workflowSteps = WORKFLOW_STEPS;

  protected readonly analysisState = toSignal(this.analysisStateService.state$, {
    initialValue: this.analysisStateService.snapshot,
  });

  protected readonly analysisStarted = computed(() => this.analysisState().analysisStarted);

  protected readonly analysisResult = computed(() => this.analysisState().analysisResult);

  protected readonly activeStep = computed(() => this.analysisState().activeStep);

  protected readonly visibleSteps = computed(() => {
    const state = this.analysisState();

    if (!state.analysisStarted) {
      return this.workflowSteps.filter((step) => step.id === 'sample-intake');
    }

    return this.workflowSteps.filter((step) => {
      if (step.id === 'sample-intake') return true;
      if (step.id === 'nile-red') return state.enabledModules.nileRed;
      if (step.id === 'ftir-classification') return state.enabledModules.ftir;
      return state.enabledModules.integratedResults;
    });
  });

  protected readonly activeStepIndex = computed(() => {
    const activeId = this.activeStep();
    const visibleSteps = this.visibleSteps();
    const index = visibleSteps.findIndex((step) => step.id === activeId);
    return index === -1 ? 0 : index;
  });

  protected readonly currentStep = computed(
    () => this.visibleSteps()[this.activeStepIndex()] ?? this.visibleSteps()[0],
  );

  protected readonly currentSidebarLabel = computed(
    () => STEP_TO_SIDEBAR_LABEL[this.activeStep()] ?? '',
  );

  protected readonly canGoNext = computed(() => {
    const visibleSteps = this.visibleSteps();
    const currentVisibleIndex = visibleSteps.findIndex((s) => s.id === this.activeStep());
    
    if (currentVisibleIndex >= visibleSteps.length - 1) {
      return false;
    }

    const nextStep = visibleSteps[currentVisibleIndex + 1];
    return nextStep ? this.analysisStateService.canProceed(nextStep.id) : false;
  });

  protected readonly stepRestrictionMessages = computed(() => {
    const state = this.analysisState();
    const restrictions = state.moduleRestrictions;
    const messages: Array<{ step: string; message: string }> = [];

    // Only show restriction messages once analysis has started and files have been uploaded
    if (!state.analysisStarted || state.uploadedFiles.length === 0) {
      return messages;
    }

    if (restrictions.nileRed) {
      messages.push({ step: 'Visión artificial', message: restrictions.nileRed });
    }

    if (restrictions.ftir) {
      messages.push({ step: 'Clasificación química', message: restrictions.ftir });
    }

    return messages;
  });

  protected readonly stepItems = computed<MenuItem[]>(() => {
    return this.visibleSteps().map((step) => ({
      label: step.label,
      icon: step.icon,
      command: () => this.analysisStateService.navigateToStep(step.id),
    }));
  });

  protected setActiveStep(index: number): void {
    const step = this.visibleSteps()[index];
    if (!step) {
      return;
    }
    this.analysisStateService.navigateToStep(step.id);
  }

  protected goToPreviousStep(): void {
    const visibleSteps = this.visibleSteps();
    const currentVisibleIndex = this.activeStepIndex();
    if (currentVisibleIndex > 0) {
      const previousStep = visibleSteps[currentVisibleIndex - 1];
      this.analysisStateService.navigateToStep(previousStep.id);
    }
  }

  protected goToNextStep(): void {
    const visibleSteps = this.visibleSteps();
    const currentVisibleIndex = this.activeStepIndex();
    if (currentVisibleIndex < visibleSteps.length - 1) {
      const nextStep = visibleSteps[currentVisibleIndex + 1];
      this.analysisStateService.navigateToStep(nextStep.id);
    }
  }

  protected handleSidebarItemClick(label: string): void {
    const stepId = SIDEBAR_LABEL_TO_STEP[label];
    if (!stepId) {
      return;
    }
    if (this.analysisStateService.canProceed(stepId)) {
      this.analysisStateService.navigateToStep(stepId);
    }
  }
}
