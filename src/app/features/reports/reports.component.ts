import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { ReportService, TicketReportDto, TicketReportFilters } from '../../core/services/report.service';
import { TicketTypeService, TicketTypeDto } from '../../core/services/ticket-type.service';
import { UserService, UserDto } from '../../core/services/user.service';
import { ApiDatePipe } from '../../shared/pipes/api-date.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
    MatTableModule, TranslatePipe, ApiDatePipe,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly ticketTypeService = inject(TicketTypeService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  report: TicketReportDto | null = null;
  ticketTypes: TicketTypeDto[] = [];
  users: UserDto[] = [];
  loading = false;
  generatedAt = new Date();
  userColumns = ['user', 'finalized', 'avg'];
  ticketDetailColumns = ['ticketNumber', 'title', 'type', 'finalizedBy', 'finalizedAt', 'resolution'];

  filterForm = this.fb.group({
    from: [null as Date | null],
    to: [null as Date | null],
    ticketTypeId: [null as number | null],
    userId: [null as number | null],
  });

  ngOnInit(): void {
    this.ticketTypeService.getAll().subscribe({ next: tt => (this.ticketTypes = tt) });
    this.userService.getAllActive().subscribe({ next: u => (this.users = u) });
  }

  generate(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const v = this.filterForm.value as TicketReportFilters;
    this.reportService.getTicketReport(v).subscribe({
      next: r => {
        this.report = r;
        this.generatedAt = new Date();
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  clearFilters(): void {
    this.filterForm.reset({ from: null, to: null, ticketTypeId: null, userId: null });
    this.report = null;
  }

  hasActiveFilters(): boolean {
    const v = this.filterForm.value;
    return !!(v.from || v.to || v.ticketTypeId != null || v.userId != null);
  }

  get maxUserCount(): number {
    return Math.max(1, ...(this.report?.finalizedByUser.map(r => r.finalizedCount) ?? [1]));
  }

  get maxTypeCount(): number {
    return Math.max(1, ...(this.report?.finalizedByType.map(r => r.finalizedCount) ?? [1]));
  }

  barWidth(count: number, max: number): string {
    return `${Math.max(2, (count / max) * 100)}%`;
  }

  formatHours(hours: number): string {
    if (!hours || hours <= 0) return '—';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
    const d = Math.floor(hours / 24);
    const rem = Math.round(hours % 24);
    return rem > 0 ? `${d}d ${rem}h` : `${d}d`;
  }

  downloadPdf(): void {
    window.print();
  }
}
