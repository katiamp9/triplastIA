import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly LIGHT_THEME_URL = 'https://unpkg.com/@primeuix/themes/resources/themes/lara-light-indigo/theme.css';

  constructor() {
    // Inicializar siempre en modo claro
    this.applyLightTheme();
  }

  private applyLightTheme(): void {
    this.setPrimeNgThemeLink(this.LIGHT_THEME_URL);
    const body = this.document.body;
    body.classList.add('app-light');
    body.classList.remove('app-dark');
  }

  private setPrimeNgThemeLink(href: string): void {
    const id = 'primeng-theme';
    let link = this.document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'stylesheet';
      link.id = id;
      this.document.head.appendChild(link);
    }
    if (link.href !== href) {
      link.href = href;
    }
  }
}
