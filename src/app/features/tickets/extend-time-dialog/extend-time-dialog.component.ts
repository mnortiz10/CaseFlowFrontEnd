import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-extend-time-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatProgressSpinnerModule, TranslatePipe,
  ],
  templateUrl: './extend-time-dialog.component.html',
  styles: [`mat-form-field { width: 100%; }`],
})
export class ExtendTimeDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly dialogRef = inject(MatDialogRef<ExtendTimeDialogComponent>);
  readonly data: { ticketId: number } = inject(MAT_DIALOG_DATA);

  saving = false;
  form = this.fb.group({
    extensionHours: [8, [Validators.required, Validators.min(1)]],
    reason: [''],
  });

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.form.value;
    this.ticketService.extendTime(this.data.ticketId, {
      extensionHours: v.extensionHours!,
      reason: v.reason ?? null,
    }).subscribe({
      next: (ticket) => this.dialogRef.close(ticket),
      error: () => (this.saving = false),
    });
  }
}
