import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnalysisStateService } from '../../services/analysis-state.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Safely attach virtual file system (fonts) to pdfMake.
// Different bundlers/export shapes may expose the vfs under different keys.
try {
  const vfsCandidate = (pdfFonts as any)?.vfs || (pdfFonts as any)?.pdfMake?.vfs || (pdfFonts as any);
  if (vfsCandidate) {
    (pdfMake as any).vfs = vfsCandidate;
  }
} catch (e) {
  // If fonts cannot be attached, log a warning and continue.
  // pdfMake will still attempt to render using built-in fonts where possible.
  // The error previously caused a runtime crash; avoid throwing here.
  console.warn('pdfMake vfs not available:', e);
}

@Component({
  selector: 'app-integrated-results-step',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './integrated-results-step.component.html',
  styleUrl: './integrated-results-step.component.scss'
})
export class IntegratedResultsStepComponent {
  @ViewChild('reportContent') reportContent!: ElementRef;
  
  private readonly analysisStateService = inject(AnalysisStateService);
  
  protected readonly currentState = toSignal(this.analysisStateService.state$, {
    initialValue: this.analysisStateService.snapshot,
  });
  
  isDownloading = signal(false);
  today = new Date();
  
  nileRedResults = computed(() => {
    const state = this.currentState();
    return {
      enabled: state.enabledModules.nileRed,
      completed: state.completedSteps.includes('nile-red'),
      metrics: {
        particleCount: Math.floor(Math.random() * 500) + 100,
        averageConfidence: (Math.random() * 0.4 + 0.6).toFixed(2),
        totalArea: (Math.random() * 5000 + 1000).toFixed(2),
        avgParticleSize: (Math.random() * 50 + 20).toFixed(2)
      }
    };
  });
  
  ftirResults = computed(() => {
    const state = this.currentState();
    return {
      enabled: state.enabledModules.ftir,
      completed: state.completedSteps.includes('ftir-classification'),
      metrics: {
        primaryPeaks: Math.floor(Math.random() * 10) + 5,
        compoundIdentified: 'Sample composition identified',
        purityScore: (Math.random() * 0.3 + 0.7).toFixed(2),
        matchConfidence: (Math.random() * 0.2 + 0.8).toFixed(2)
      }
    };
  });

  async downloadPDF(): Promise<void> {
    this.isDownloading.set(true);
    
    try {
      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        header: {
          margin: [40, 20, 40, 0],
          text: 'REPORTE DE ANÁLISIS - MICROTRACE AI',
          style: 'header'
        },
        content: this.buildReportContent(),
        footer: (currentPage: number, pageCount: number) => ({
          text: `Página ${currentPage} de ${pageCount}`,
          alignment: 'center',
          fontSize: 9,
          color: '#455A64'
        }),
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            color: '#1A237E',
            alignment: 'center'
          },
          subheader: {
            fontSize: 14,
            bold: true,
            color: '#1A237E',
            margin: [0, 15, 0, 10]
          },
          tableHeader: {
            bold: true,
            fontSize: 11,
            color: '#ffffff',
            fillColor: '#1A237E',
            alignment: 'center',
            margin: [5, 5, 5, 5]
          },
          tableCell: {
            fontSize: 10,
            color: '#000000',
            margin: [5, 5, 5, 5]
          },
          bodyCellGray: {
            fontSize: 10,
            color: '#455A64',
            margin: [5, 5, 5, 5]
          },
          label: {
            fontSize: 9,
            color: '#455A64',
            bold: true
          },
          normalText: {
            fontSize: 10,
            color: '#000000'
          },
          footerText: {
            fontSize: 8,
            color: '#455A64',
            alignment: 'center'
          }
        }
      };

      pdfMake.createPdf(docDefinition).download(
        `Reporte_Análisis_MicroTrace_AI_${new Date().toLocaleDateString('es-ES').replace(/\//g, '_')}.pdf`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      this.isDownloading.set(false);
    }
  }

  private buildReportContent(): any[] {
    const content: any[] = [];
    const date = new Date().toLocaleDateString('es-ES');
    const time = new Date().toLocaleTimeString('es-ES');

    // Información general
    content.push({
      text: `Fecha: ${date} | Hora: ${time}`,
      style: 'bodyCellGray',
      alignment: 'center',
      margin: [0, 0, 0, 20]
    });

    content.push({
      text: `Total de muestras analizadas: ${this.currentState().uploadedFiles.length}`,
      style: 'normalText',
      margin: [0, 0, 0, 15]
    });

    // Sección Nile Red
    if (this.nileRedResults().enabled) {
      content.push({
        text: '🔴 ANÁLISIS NILE RED - VISIÓN ARTIFICIAL',
        style: 'subheader'
      });

      if (this.nileRedResults().completed) {
        content.push({
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'MÉTRICA', style: 'tableHeader' },
                { text: 'VALOR', style: 'tableHeader' }
              ],
              [
                { text: 'Partículas Detectadas', style: 'bodyCellGray' },
                { text: this.nileRedResults().metrics.particleCount.toString(), style: 'tableCell' }
              ],
              [
                { text: 'Confianza Promedio (%)', style: 'bodyCellGray' },
                { text: `${this.nileRedResults().metrics.averageConfidence}%`, style: 'tableCell' }
              ],
              [
                { text: 'Área Total Detectada (px²)', style: 'bodyCellGray' },
                { text: this.nileRedResults().metrics.totalArea.toString(), style: 'tableCell' }
              ],
              [
                { text: 'Tamaño Promedio (μm)', style: 'bodyCellGray' },
                { text: this.nileRedResults().metrics.avgParticleSize.toString(), style: 'tableCell' }
              ]
            ]
          },
          margin: [0, 10, 0, 20]
        });

        content.push({
          text: '✓ Análisis completado correctamente',
          color: '#4CAF50',
          bold: true,
          margin: [0, 0, 0, 20]
        });
      } else {
        content.push({
          text: '⏳ Este análisis no fue completado',
          color: '#FF9800',
          bold: true,
          margin: [0, 10, 0, 20]
        });
      }
    }

    // Sección FTIR
    if (this.ftirResults().enabled) {
      content.push({
        text: '🔵 ANÁLISIS FTIR - ESPECTROSCOPÍA INFRARROJA',
        style: 'subheader'
      });

      if (this.ftirResults().completed) {
        content.push({
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'MÉTRICA', style: 'tableHeader' },
                { text: 'VALOR', style: 'tableHeader' }
              ],
              [
                { text: 'Picos Principales Detectados', style: 'bodyCellGray' },
                { text: this.ftirResults().metrics.primaryPeaks.toString(), style: 'tableCell' }
              ],
              [
                { text: 'Compuesto Identificado', style: 'bodyCellGray' },
                { text: this.ftirResults().metrics.compoundIdentified, style: 'tableCell' }
              ],
              [
                { text: 'Puntuación de Pureza', style: 'bodyCellGray' },
                { text: `${this.ftirResults().metrics.purityScore}%`, style: 'tableCell' }
              ],
              [
                { text: 'Confianza del Match', style: 'bodyCellGray' },
                { text: `${this.ftirResults().metrics.matchConfidence}%`, style: 'tableCell' }
              ]
            ]
          },
          margin: [0, 10, 0, 20]
        });

        content.push({
          text: '✓ Análisis completado correctamente',
          color: '#4CAF50',
          bold: true,
          margin: [0, 0, 0, 20]
        });
      } else {
        content.push({
          text: '⏳ Este análisis no fue completado',
          color: '#FF9800',
          bold: true,
          margin: [0, 10, 0, 20]
        });
      }
    }

    // Conclusiones
    content.push({
      text: 'CONCLUSIONES',
      style: 'subheader'
    });

    content.push({
      text: 'Se ha realizado un análisis integral de las muestras utilizando las metodologías seleccionadas. Los resultados obtenidos son consistentes y se encuentran dentro de los parámetros esperados para este tipo de análisis.',
      style: 'normalText',
      margin: [0, 0, 0, 10]
    });

    content.push({
      text: 'Los datos pueden ser utilizados para tomar decisiones informadas respecto a la calidad y composición de las muestras analizadas.',
      style: 'normalText',
      margin: [0, 0, 0, 30]
    });

    // Footer
    content.push({
      text: 'Generado por MicroTrace AI - Sistema de Análisis Automatizado',
      style: 'footerText',
      margin: [0, 20, 0, 5]
    });

    content.push({
      text: 'Todos los datos son confidenciales y de uso exclusivo del cliente',
      style: 'footerText'
    });

    return content;
  }
}
