import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  TicketService,
  TicketDto,
  TicketHistoryDto,
  TicketSubState,
  TicketFieldValueDto,
  TicketStateDataDto,
  SaveStateDto,
} from '../../../core/services/ticket.service';
import { WorkflowService, WorkflowStateDto, FormFieldType } from '../../../core/services/workflow.service';
import { UserService, UserDto } from '../../../core/services/user.service';
import { ExtendTimeDialogComponent } from '../extend-time-dialog/extend-time-dialog.component';
import { StateDetailDialogComponent } from '../state-detail-dialog/state-detail-dialog.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatTabsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatDialogModule, MatProgressSpinnerModule,
    MatTableModule, MatTooltipModule, MatDatepickerModule, MatNativeDateModule, TranslatePipe,
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
})
export class TicketDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(TicketService);
  private readonly workflowService = inject(WorkflowService);
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  ticket: TicketDto | null = null;
  history: TicketHistoryDto[] = [];
  workflowStates: WorkflowStateDto[] = [];
  users: UserDto[] = [];
  loading = true;
  transitioning = false;
  saving = false;
  reassigning = false;
  selectedAssigneeId: number | null = null;
  stateForm: FormGroup = this.fb.group({});
  historyColumns = ['date', 'from', 'to', 'comment', 'by'];
  TicketSubState = TicketSubState;
  FormFieldType = FormFieldType;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicket(id);
    this.userService.getAllActive().subscribe({ next: u => this.users = u });
  }

  loadTicket(id: number): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (t) => {
        this.ticket = t;
        this.selectedAssigneeId = t.assignedToUserId;
        this.buildStateForm(t);
        this.workflowService.getById(t.workflowDefinitionId).subscribe({
          next: (wf) => { this.workflowStates = wf.states; },
        });
        this.loading = false;
      },
      error: () => { this.loading = false; this.router.navigate(['/tickets']); },
    });
  }

  buildStateForm(ticket: TicketDto): void {
    const controls: Record<string, unknown> = {};
    ticket.fieldValues.forEach((f) => {
      let val: unknown = f.value ?? '';
      if (f.fieldType === FormFieldType.Date && f.value) {
        val = new Date(f.value);
      } else if (f.fieldType === FormFieldType.Checkbox) {
        val = f.value === 'true';
      }
      controls[`field_${f.fieldId}`] = [val];
    });
    ticket.checklistValues.forEach((c) => {
      controls[`check_${c.checklistItemId}`] = [c.isChecked];
    });
    controls['comment'] = [ticket.currentStateNote ?? ''];
    this.stateForm = this.fb.group(controls);
  }

  private serializeFieldValue(raw: unknown): string | null {
    if (raw == null || raw === '') return null;
    if (raw instanceof Date) return raw.toISOString().split('T')[0];
    return String(raw);
  }

  private buildPayload() {
    const v = this.stateForm.value;
    return {
      fieldValues: this.ticket!.fieldValues.map((f) => ({
        fieldId: f.fieldId,
        value: this.serializeFieldValue(v[`field_${f.fieldId}`]),
      })),
      checklistValues: this.ticket!.checklistValues.map((c) => ({
        checklistItemId: c.checklistItemId,
        isChecked: !!v[`check_${c.checklistItemId}`],
      })),
    };
  }

  saveCurrentState(): void {
    if (!this.ticket) return;
    this.saving = true;
    const { fieldValues, checklistValues } = this.buildPayload();
    const payload = {
      note: this.stateForm.value['comment'] || null,
      fieldValues,
      checklistValues,
    };
    this.service.saveState(this.ticket.id, payload).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.buildStateForm(updated);
        this.saving = false;
        this.snackBar.open(this.translate.instant('TICKETS.TOAST.SAVED'), 'OK', { duration: 2500 });
      },
      error: () => (this.saving = false),
    });
  }

  advance(): void {
    if (!this.ticket?.nextStateId) return;
    this.doTransition(this.ticket.nextStateId);
  }

  goToFinal(): void {
    if (!this.ticket?.finalStateId) return;
    this.doTransition(this.ticket.finalStateId);
  }

  private doTransition(toStateId: number): void {
    this.transitioning = true;
    const { fieldValues, checklistValues } = this.buildPayload();
    const comment = this.stateForm.value['comment'] || null;

    this.service.transition(this.ticket!.id, {
      toStateId,
      comment,
      fieldValues,
      checklistValues,
    }).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.buildStateForm(updated);
        this.transitioning = false;
        this.snackBar.open(this.translate.instant('TICKETS.TOAST.TRANSITIONED'), 'OK', { duration: 3000 });
      },
      error: () => (this.transitioning = false),
    });
  }

  openExtendTime(): void {
    this.dialog
      .open(ExtendTimeDialogComponent, {
        width: '420px',
        data: { ticketId: this.ticket!.id },
      })
      .afterClosed()
      .subscribe((updated) => {
        if (updated) {
          this.ticket = updated;
          this.snackBar.open(this.translate.instant('TICKETS.TOAST.TIME_EXTENDED'), 'OK', { duration: 3000 });
        }
      });
  }

  reassign(): void {
    if (!this.ticket) return;
    this.reassigning = true;
    this.service.reassign(this.ticket.id, this.selectedAssigneeId).subscribe({
      next: updated => {
        this.ticket = updated;
        this.selectedAssigneeId = updated.assignedToUserId;
        this.reassigning = false;
        this.snackBar.open(this.translate.instant('TICKETS.TOAST.REASSIGNED'), 'OK', { duration: 2500 });
      },
      error: () => (this.reassigning = false),
    });
  }

  loadHistory(): void {
    if (!this.ticket) return;
    this.service.getHistory(this.ticket.id).subscribe({ next: (h) => (this.history = h) });
  }

  back(): void { this.router.navigate(['/tickets']); }

  getSubStateClass(s: TicketSubState): string {
    if (s === TicketSubState.Green) return 'bg-green-500';
    if (s === TicketSubState.Yellow) return 'bg-yellow-400';
    return 'bg-red-500';
  }

  getSubStateLabel(s: TicketSubState): string {
    if (s === TicketSubState.Green) return 'En tiempo';
    if (s === TicketSubState.Yellow) return 'Por vencer';
    return 'Vencido';
  }

  isCompletedState(stateId: number): boolean {
    return this.ticket?.completedStates?.some(s => s.stateId === stateId) ?? false;
  }

  onStateClick(stateId: number): void {
    if (!this.ticket) return;
    const completed = this.ticket.completedStates?.find(s => s.stateId === stateId);
    if (completed) {
      this.dialog.open(StateDetailDialogComponent, { width: '520px', data: completed });
    }
  }

  isTextField(f: TicketFieldValueDto): boolean {
    return f.fieldType === FormFieldType.Text || f.fieldType === FormFieldType.Number;
  }

  isTextArea(f: TicketFieldValueDto): boolean { return f.fieldType === FormFieldType.TextArea; }
  isCheckbox(f: TicketFieldValueDto): boolean { return f.fieldType === FormFieldType.Checkbox; }
  isSelect(f: TicketFieldValueDto): boolean { return f.fieldType === FormFieldType.Select; }
  isDate(f: TicketFieldValueDto): boolean { return f.fieldType === FormFieldType.Date; }

  getSelectOptions(f: TicketFieldValueDto): string[] {
    if (!f.options) return [];
    try { return JSON.parse(f.options); } catch { return f.options.split(',').map((o) => o.trim()); }
  }
}
