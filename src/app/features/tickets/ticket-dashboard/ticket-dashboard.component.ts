import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { TicketService, TicketListItemDto, TicketSubState } from '../../../core/services/ticket.service';
import { ApiDatePipe } from '../../../shared/pipes/api-date.pipe';

@Component({
  selector: 'app-ticket-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslatePipe, ApiDatePipe],
  templateUrl: './ticket-dashboard.component.html',
  styleUrls: ['./ticket-dashboard.component.scss'],
})
export class TicketDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);

  readonly TicketSubState = TicketSubState;

  loading = true;
  stats = { onTime: 0, dueSoon: 0, overdue: 0 };
  recentTickets: TicketListItemDto[] = [];

  get firstName(): string { return this.auth.currentUser?.firstName ?? ''; }

  ngOnInit(): void {
    forkJoin([
      this.ticketService.getAll(1, 1, undefined, undefined, undefined, undefined, TicketSubState.Green),
      this.ticketService.getAll(1, 1, undefined, undefined, undefined, undefined, TicketSubState.Yellow),
      this.ticketService.getAll(1, 1, undefined, undefined, undefined, undefined, TicketSubState.Red),
      this.ticketService.getAll(1, 5),
    ]).subscribe({
      next: ([onTime, dueSoon, overdue, recent]) => {
        this.stats.onTime = onTime.totalCount;
        this.stats.dueSoon = dueSoon.totalCount;
        this.stats.overdue = overdue.totalCount;
        this.recentTickets = recent.items;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  openTicket(t: TicketListItemDto): void {
    this.router.navigate(['/tickets', t.id]);
  }

  getSubStateDotClass(s: TicketSubState): string {
    return s === TicketSubState.Green ? 'dot-green' : s === TicketSubState.Yellow ? 'dot-yellow' : 'dot-red';
  }
}
