import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { TicketStateDataDto, TicketSubState } from '../../../core/services/ticket.service';
import { FormFieldType } from '../../../core/services/workflow.service';

@Component({
  selector: 'app-state-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, MatTooltipModule, TranslatePipe],
  templateUrl: './state-detail-dialog.component.html',
})
export class StateDetailDialogComponent {
  data = inject<TicketStateDataDto>(MAT_DIALOG_DATA);
  FormFieldType = FormFieldType;
  TicketSubState = TicketSubState;

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
    if (s === TicketSubState.Green) return 'En tiempo';
    if (s === TicketSubState.Yellow) return 'Por vencer';
    return 'Vencido';
  }
}
