import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

export interface SidebarItem {
  label: string;
  description?: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class SidebarComponent {
  @Input() sidebarItems: SidebarItem[] = [];
  @Input() currentStepLabel = '';
  @Input() onItemClick: (label: string) => void = () => {};

  constructor(private theme: ThemeService) {
    // Asegurar que siempre esté en modo claro
    this.theme;
  }

  protected protectedOnNavItemClick(item: SidebarItem): void {
    const callback = this.onItemClick;
    if (callback) {
      callback(item.label);
    }
  }

  logout(): void {
    try {
      localStorage.clear();
    } catch {}
    this.signOut.emit();
  }

  @Output() signOut = new EventEmitter<void>();

  trackByLabel(_index: number, item: SidebarItem) {
    return item.label;
  }
}
