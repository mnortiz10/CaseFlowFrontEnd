import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  TicketService,
  TicketDto,
  TicketActivityDto,
  TicketSubState,
  TicketFieldValueDto,
  TicketStateDataDto,
  SaveStateDto,
} from '../../../core/services/ticket.service';
import { WorkflowService, WorkflowStateDto, FormFieldType } from '../../../core/services/workflow.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExtendTimeDialogComponent } from '../extend-time-dialog/extend-time-dialog.component';
import { StateDetailDialogComponent } from '../state-detail-dialog/state-detail-dialog.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatTabsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatDialogModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDatepickerModule, MatNativeDateModule, TranslatePipe,
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
})
export class TicketDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(TicketService);
  private readonly workflowService = inject(WorkflowService);
  private readonly tenantService = inject(TenantService);
  readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  ticket: TicketDto | null = null;
  activity: TicketActivityDto[] = [];
  workflowStates: WorkflowStateDto[] = [];
  loading = true;
  transitioning = false;
  saving = false;
  stateForm: FormGroup = this.fb.group({});
  TicketSubState = TicketSubState;
  FormFieldType = FormFieldType;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicket(id);

    // stateTimeSummary reads Date.now() on every render; nothing re-renders it on its own,
    // so tick periodically to keep "llevás"/"quedan" fresh without a manual refresh.
    interval(60_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  loadTicket(id: number): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (t) => {
        this.ticket = t;
        this.buildStateForm(t);
        this.workflowService.getById(t.workflowDefinitionId).subscribe({
          next: (wf) => { this.workflowStates = wf.states; },
        });
        this.loadActivity();
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
      const validators = f.isRequired
        ? [f.fieldType === FormFieldType.Checkbox ? Validators.requiredTrue : Validators.required]
        : [];
      controls[`field_${f.fieldId}`] = [val, validators];
    });
    ticket.checklistValues.forEach((c) => {
      controls[`check_${c.checklistItemId}`] = [c.isChecked, c.isRequired ? [Validators.requiredTrue] : []];
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
        this.loadActivity();
        this.maybePromptExtendTime(updated);
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
    if (this.stateForm.invalid) {
      this.stateForm.markAllAsTouched();
      this.snackBar.open(this.translate.instant('TICKETS.TOAST.REQUIRED_FIELDS'), 'OK', { duration: 3500 });
      return;
    }
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
        this.loadActivity();
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

  private maybePromptExtendTime(updated: TicketDto): void {
    if (!this.auth.hasPermission('tickets.extend_time')) return;

    const currentState = this.workflowStates.find((s) => s.id === updated.currentStateId);
    if (currentState?.isFinal) return;

    this.tenantService.getSettings().subscribe({
      next: (settings) => {
        if (!settings.promptExtendTimeOnStateSave) return;

        this.dialog
          .open(ExtendTimeDialogComponent, {
            width: '420px',
            data: {
              ticketId: updated.id,
              defaultHours: 24,
              title: this.translate.instant('TICKETS.EXTEND_TIME_PROMPT_TITLE'),
              cancelLabel: this.translate.instant('TICKETS.NO_EXTEND'),
            },
          })
          .afterClosed()
          .subscribe((extended) => {
            if (extended) {
              this.ticket = extended;
              this.snackBar.open(this.translate.instant('TICKETS.TOAST.TIME_EXTENDED'), 'OK', { duration: 3000 });
            }
          });
      },
    });
  }

  loadActivity(): void {
    if (!this.ticket) return;
    this.service.getActivity(this.ticket.id).subscribe({ next: (a) => (this.activity = a) });
  }

  scrollToHistory(): void {
    document.getElementById('change-history')?.scrollIntoView({ behavior: 'smooth' });
  }

  formatChangeValue(v: string | null, isBoolean: boolean): string {
    if (isBoolean) {
      return v === 'true'
        ? this.translate.instant('COMMON.YES')
        : this.translate.instant('COMMON.NO');
    }
    return v ?? '—';
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

  private parseUtcDate(raw: string): Date {
    // PostgreSQL sends microseconds (6 decimal places); JS Date only handles 3 (ms).
    const cleaned = raw.replace(/(\.\d{3})\d+/, '$1');
    return new Date(cleaned.endsWith('Z') ? cleaned : `${cleaned}Z`);
  }

  private formatHours(hours: number): string {
    if (isNaN(hours) || hours < 0) return '—';
    if (hours < 1) return `${Math.floor(hours * 60)}m`;
    if (hours < 24) return `${Math.floor(hours)}h`;
    const d = Math.floor(hours / 24);
    const rem = Math.floor(hours % 24);
    return rem > 0 ? `${d}d ${rem}h` : `${d}d`;
  }

  get stateTimeSummary(): string | null {
    if (!this.ticket || this.isCurrentStateFinal) return null;
    const state = this.workflowStates.find((s) => s.id === this.ticket!.currentStateId);
    if (!state) return null;

    const enteredAt = this.parseUtcDate(this.ticket.stateEnteredAt);
    const effectiveStart = this.ticket.subStateOverrideUntil
      ? this.parseUtcDate(this.ticket.subStateOverrideUntil)
      : enteredAt;

    // Clamp to 0: an override baseline in the future (extension not yet elapsed) or a clock
    // skew must never surface as a negative elapsed/remaining figure.
    const elapsedReal = Math.max(0, (Date.now() - enteredAt.getTime()) / 3_600_000);
    const elapsedEffective = Math.max(0, (Date.now() - effectiveStart.getTime()) / 3_600_000);
    const elapsed = this.formatHours(elapsedReal);

    if (this.ticket.subState === TicketSubState.Red) {
      const total = this.formatHours(state.redThresholdHours);
      const overdue = this.formatHours(Math.max(0, elapsedEffective - state.redThresholdHours));
      return this.translate.instant('TICKETS.TIME_OVERDUE_SUMMARY', { overdue, elapsed, total });
    }

    // Count down to whichever sub-state comes next: Green -> Yellow, Yellow -> Red.
    const nextThreshold = this.ticket.subState === TicketSubState.Yellow
      ? state.redThresholdHours
      : state.yellowThresholdHours;
    const nextLabel = this.getSubStateLabel(
      this.ticket.subState === TicketSubState.Yellow ? TicketSubState.Red : TicketSubState.Yellow);

    const remaining = this.formatHours(Math.max(0, nextThreshold - elapsedEffective));
    const total = this.formatHours(nextThreshold);

    return this.translate.instant('TICKETS.TIME_REMAINING_SUMMARY', { remaining, nextLabel, elapsed, total });
  }

  private isFinalStateId(stateId: number | null | undefined): boolean {
    if (stateId == null) return false;
    return this.workflowStates.find((s) => s.id === stateId)?.isFinal ?? false;
  }

  get isCurrentStateFinal(): boolean {
    return !!this.ticket && this.isFinalStateId(this.ticket.currentStateId);
  }

  get isNextStateFinal(): boolean {
    return !!this.ticket && this.isFinalStateId(this.ticket.nextStateId);
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
