import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TicketService, TicketStateDataDto, TicketSubState } from '../../../core/services/ticket.service';
import { FormFieldType } from '../../../core/services/workflow.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiDatePipe } from '../../../shared/pipes/api-date.pipe';

export interface StateDetailDialogData {
  ticketId: number;
  state: TicketStateDataDto;
}

@Component({
  selector: 'app-state-detail-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatTooltipModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatProgressSpinnerModule, TranslatePipe, ApiDatePipe,
  ],
  templateUrl: './state-detail-dialog.component.html',
})
export class StateDetailDialogComponent {
  private readonly dialogData = inject<StateDetailDialogData>(MAT_DIALOG_DATA);
  private readonly ticketService = inject(TicketService);
  private readonly auth = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<StateDetailDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  data = this.dialogData.state;
  FormFieldType = FormFieldType;
  TicketSubState = TicketSubState;

  editing = false;
  saving = false;
  editFieldValues: Record<number, string> = {};
  editFieldChecks: Record<number, boolean> = {};
  editChecklistValues: Record<number, boolean> = {};

  get canEdit(): boolean {
    return this.auth.hasPermission('tickets.edit_past_states');
  }

  startEdit(): void {
    this.editFieldValues = {};
    this.editFieldChecks = {};
    this.editChecklistValues = {};
    for (const f of this.data.fieldValues) {
      if (this.isCheckbox(f)) this.editFieldChecks[f.fieldId] = f.value === 'true';
      else this.editFieldValues[f.fieldId] = f.value ?? '';
    }
    for (const c of this.data.checklistValues) {
      this.editChecklistValues[c.checklistItemId] = c.isChecked;
    }
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  saveEdit(): void {
    this.saving = true;
    const dto = {
      fieldValues: this.data.fieldValues.map(f => {
        let value: string | null;
        if (this.isCheckbox(f)) {
          value = this.editFieldChecks[f.fieldId] ? 'true' : 'false';
        } else {
          const raw = this.editFieldValues[f.fieldId];
          value = raw == null || raw === '' ? null : raw;
        }
        return { fieldId: f.fieldId, value };
      }),
      checklistValues: this.data.checklistValues.map(c => ({
        checklistItemId: c.checklistItemId,
        isChecked: !!this.editChecklistValues[c.checklistItemId],
      })),
    };

    this.ticketService.updatePastState(this.dialogData.ticketId, this.data.stateId, dto).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('TICKETS.TOAST.PAST_STATE_UPDATED'), 'OK', { duration: 2500 });
        this.dialogRef.close(true);
      },
      error: () => (this.saving = false),
    });
  }

  parseOptions(options: string | null): string[] {
    if (!options) return [];
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return options.split(',').map(o => o.trim()).filter(Boolean);
    }
  }

  isCheckbox(f: { fieldType: FormFieldType }): boolean {
    return f.fieldType === FormFieldType.Checkbox;
  }

  formatDuration(hours: number): string {
    if (hours < 0) hours = 0;
    const totalMin = Math.round(hours * 60);
    if (totalMin < 60) return `${totalMin}m`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    const d = Math.floor(h / 24);
    const rem = h % 24;
    return rem > 0 ? `${d}d ${rem}h` : `${d}d`;
  }

  subStatePillClass(s: TicketSubState): string {
    if (s === TicketSubState.Green) return 'bg-green-100 text-green-700';
    if (s === TicketSubState.Yellow) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }

  subStateLabel(s: TicketSubState): string {
    if (s === TicketSubState.Green) return this.translate.instant('TICKETS.SUB_STATE_GREEN');
    if (s === TicketSubState.Yellow) return this.translate.instant('TICKETS.SUB_STATE_YELLOW');
    return this.translate.instant('TICKETS.SUB_STATE_RED');
  }
}
