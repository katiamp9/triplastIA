import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-spinner" [class.loading-spinner--overlay]="overlay">
      <div class="loading-spinner__inner">
        <div class="loading-spinner__ring"></div>
        @if (message) {
          <p class="loading-spinner__message">{{ message }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .loading-spinner--overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(2px);
      z-index: 9999;
    }

    .loading-spinner__inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .loading-spinner__ring {
      width: 3rem;
      height: 3rem;
      border: 3px solid rgba(26, 35, 126, 0.2);
      border-top-color: #1A237E;
      border-right-color: #3949AB;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .loading-spinner__message {
      margin: 0;
      color: #1A237E;
      font-size: 0.95rem;
      font-weight: 500;
      text-align: center;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `],
})
export class LoadingSpinnerComponent {
  @Input() message?: string;
  @Input() overlay = false;
}
