import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  username = '';
  password = '';
  isSubmitting = false;
  isInvalid = false;
  errorMessage: string | null = null;
  showPassword = false;

  @Output() submitted = new EventEmitter<{ username: string; password: string }>();

  onSubmit(): void {
    this.isInvalid = false;
    this.errorMessage = null;

    if (!this.username || !this.password) {
      this.isInvalid = true;
      this.errorMessage = 'Usuario y contraseña son requeridos.';
      return;
    }

    // Fixed test credentials
    const validUser = 'admin';
    const validPass = 'admin';

    if (this.username !== validUser || this.password !== validPass) {
      this.isInvalid = true;
      this.errorMessage = 'Credenciales incorrectas.';
      this.password = '';
      return;
    }

    this.isSubmitting = true;
    // Emit successful login to parent
    setTimeout(() => {
      this.submitted.emit({ username: this.username, password: this.password });
      this.isSubmitting = false;
    }, 600);
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }
}
