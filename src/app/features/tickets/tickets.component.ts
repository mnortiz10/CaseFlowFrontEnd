import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TicketService, TicketListItemDto, TicketSubState } from '../../core/services/ticket.service';
import { TicketTypeService, TicketTypeDto } from '../../core/services/ticket-type.service';
import { WorkflowService, WorkflowStateDto } from '../../core/services/workflow.service';
import { UserService, UserDto } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { CreateTicketDialogComponent } from './create-ticket-dialog/create-ticket-dialog.component';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatCardModule, MatChipsModule,
    MatTooltipModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, TranslatePipe,
  ],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
})
export class TicketsComponent implements OnInit {
  private readonly service        = inject(TicketService);
  private readonly ticketTypeService = inject(TicketTypeService);
  private readonly workflowService   = inject(WorkflowService);
  private readonly userService       = inject(UserService);
  readonly auth = inject(AuthService);
  private readonly dialog   = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  displayedColumns = ['subState','ticketNumber','title','ticketType','currentState','timeInState','assignedTo'];
  tickets: TicketListItemDto[] = [];
  ticketTypes: TicketTypeDto[] = [];
  workflowStates: WorkflowStateDto[] = [];
  users: UserDto[] = [];
  reassigningId: number | null = null;
  totalCount = 0;
  page = 1;
  pageSize = 10;

  subStateOptions = [
    { value: null,                  label: 'TICKETS.FILTER_ALL' },
    { value: TicketSubState.Green,  label: 'TICKETS.SUB_STATE_GREEN' },
    { value: TicketSubState.Yellow, label: 'TICKETS.SUB_STATE_YELLOW' },
    { value: TicketSubState.Red,    label: 'TICKETS.SUB_STATE_RED' },
  ];

  filterForm = this.fb.group({
    title:        [''],
    ticketNumber: [''],
    ticketTypeId: [null as number | null],
    stateId:      [{ value: null as number | null, disabled: true }],
    subState:     [null as number | null],
  });

  get stateCtrl() { return this.filterForm.get('stateId')!; }

  ngOnInit(): void {
    this.ticketTypeService.getAll().subscribe({ next: tt => this.ticketTypes = tt });
    this.userService.getAllActive().subscribe({ next: u => this.users = u });

    const subStateParam = this.route.snapshot.queryParamMap.get('subState');
    if (subStateParam != null && subStateParam !== '') {
      this.filterForm.get('subState')!.setValue(Number(subStateParam), { emitEvent: false });
    }

    this.load();

    // Text inputs — real-time debounced
    this.filterForm.get('title')!.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => { this.page = 1; this.load(); });

    this.filterForm.get('ticketNumber')!.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => { this.page = 1; this.load(); });

    // Ticket type — load matching workflow states, reset stateId
    this.filterForm.get('ticketTypeId')!.valueChanges.subscribe(typeId => {
      this.workflowStates = [];
      this.stateCtrl.setValue(null, { emitEvent: false });
      this.stateCtrl.disable({ emitEvent: false });

      if (typeId) {
        const tt = this.ticketTypes.find(t => t.id === typeId);
        if (tt?.workflowDefinitionId) {
          this.workflowService.getById(tt.workflowDefinitionId).subscribe({
            next: wf => {
              this.workflowStates = [...wf.states].sort((a, b) => a.order - b.order);
              this.stateCtrl.enable({ emitEvent: false });
            },
          });
        }
      }
      this.page = 1;
      this.load();
    });

    // State & vigencia — immediate
    this.stateCtrl.valueChanges.subscribe(() => { this.page = 1; this.load(); });
    this.filterForm.get('subState')!.valueChanges.subscribe(() => { this.page = 1; this.load(); });
  }

  load(): void {
    // getRawValue() includes disabled controls (stateId when disabled = null)
    const v = this.filterForm.getRawValue();
    this.service.getAll(
      this.page, this.pageSize,
      v.title        || undefined,
      v.ticketNumber || undefined,
      v.ticketTypeId  != null ? v.ticketTypeId  : undefined,
      v.stateId       != null ? v.stateId       : undefined,
      v.subState      != null ? v.subState      : undefined,
    ).subscribe({ next: r => { this.tickets = r.items; this.totalCount = r.totalCount; } });
  }

  clearFilters(): void {
    this.stateCtrl.disable({ emitEvent: false });
    this.workflowStates = [];
    this.filterForm.reset(
      { title: '', ticketNumber: '', ticketTypeId: null, stateId: null, subState: null },
      { emitEvent: false },
    );
    this.page = 1;
    this.load();
  }

  onPageChange(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.load();
  }

  openCreate(): void {
    this.dialog.open(CreateTicketDialogComponent, { width: '540px' })
      .afterClosed().subscribe(created => {
        if (created) {
          this.snackBar.open(this.translate.instant('TICKETS.TOAST.CREATED'), 'OK', { duration: 3000 });
          this.load();
          this.router.navigate(['/tickets', created.id]);
        }
      });
  }

  openDetail(t: TicketListItemDto): void { this.router.navigate(['/tickets', t.id]); }

  changeAssignee(t: TicketListItemDto, userId: number | null): void {
    this.reassigningId = t.id;
    this.service.reassign(t.id, userId).subscribe({
      next: (updated) => {
        t.assignedToUserId = updated.assignedToUserId;
        t.assignedToName = updated.assignedToName;
        this.reassigningId = null;
        this.snackBar.open(this.translate.instant('TICKETS.TOAST.REASSIGNED'), 'OK', { duration: 2000 });
      },
      error: () => (this.reassigningId = null),
    });
  }

  getSubStateClass(s: TicketSubState): string {
    return s === TicketSubState.Green ? 'bg-green-500' : s === TicketSubState.Yellow ? 'bg-yellow-400' : 'bg-red-500';
  }

  getSubStateLabel(s: TicketSubState): string {
    return s === TicketSubState.Green ? 'En tiempo' : s === TicketSubState.Yellow ? 'Por vencer' : 'Vencido';
  }

  getSubStatePillClass(s: TicketSubState): string {
    return s === TicketSubState.Green ? 'bg-green-100 text-green-700'
         : s === TicketSubState.Yellow ? 'bg-yellow-100 text-yellow-700'
         : 'bg-red-100 text-red-700';
  }

  hasActiveFilters(): boolean {
    const v = this.filterForm.getRawValue();
    return !!(v.title || v.ticketNumber || v.ticketTypeId != null || v.stateId != null || v.subState != null);
  }

  hoursInState(raw: string | null | undefined): string {
    if (!raw) return '—';
    // PostgreSQL sends microseconds (6 decimal places); JS Date only handles 3 (ms).
    // Strip extra sub-millisecond digits, then force UTC Z suffix.
    const cleaned = raw.replace(/(\.\d{3})\d+/, '$1');
    const utc = cleaned.endsWith('Z') ? cleaned : cleaned + 'Z';
    const ms = Date.now() - new Date(utc).getTime();
    if (isNaN(ms) || ms < 0) return '—';
    const h = ms / 3_600_000;
    if (h < 1) return `${Math.floor(h * 60)}m`;
    if (h < 24) return `${Math.floor(h)}h`;
    const d = Math.floor(h / 24);
    const rem = Math.floor(h % 24);
    return rem > 0 ? `${d}d ${rem}h` : `${d}d`;
  }
}
