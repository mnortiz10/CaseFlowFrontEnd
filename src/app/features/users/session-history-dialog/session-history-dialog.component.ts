import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { UserService, UserDto, UserSessionSummaryDto, SessionEventType } from '../../../core/services/user.service';

@Component({
  selector: 'app-session-history-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-blue-600">history</mat-icon>
      {{ 'USERS.SESSIONS.TITLE' | translate }} — {{ data.firstName }} {{ data.lastName }}
    </h2>

    <mat-dialog-content class="min-w-96">
      @if (loading) {
        <div class="flex justify-center py-8"><mat-spinner diameter="32"></mat-spinner></div>
      } @else if (summary) {
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="p-3 bg-gray-50 rounded-lg text-center">
            <div class="text-xl font-semibold">{{ summary.totalLogins }}</div>
            <div class="text-xs text-gray-500">{{ 'USERS.SESSIONS.TOTAL_LOGINS' | translate }}</div>
          </div>
          <div class="p-3 bg-red-50 rounded-lg text-center">
            <div class="text-xl font-semibold text-red-600">{{ summary.totalExpirations }}</div>
            <div class="text-xs text-gray-500">{{ 'USERS.SESSIONS.TOTAL_EXPIRATIONS' | translate }}</div>
          </div>
          <div class="p-3 bg-green-50 rounded-lg text-center">
            <div class="text-xl font-semibold text-green-700">{{ formatMinutes(summary.totalActiveMinutes) }}</div>
            <div class="text-xs text-gray-500">{{ 'USERS.SESSIONS.TOTAL_ACTIVE' | translate }}</div>
          </div>
        </div>

        @if (summary.events.length === 0) {
          <p class="text-gray-400 text-sm text-center py-4">{{ 'USERS.SESSIONS.EMPTY' | translate }}</p>
        } @else {
          <div class="space-y-1 max-h-80 overflow-y-auto">
            @for (e of summary.events; track e.occurredAt) {
              <div class="flex items-center gap-2 text-sm py-1.5 border-b border-gray-100 last:border-0">
                <mat-icon class="text-base leading-none"
                  [class.text-green-600]="e.eventType === SessionEventType.Login"
                  [class.text-gray-400]="e.eventType === SessionEventType.Logout"
                  [class.text-red-500]="e.eventType === SessionEventType.InactivityExpired">
                  {{ iconFor(e.eventType) }}
                </mat-icon>
                <span class="min-w-36 font-medium">{{ labelKeyFor(e.eventType) | translate }}</span>
                <span class="text-gray-500">{{ e.occurredAt | date:'dd/MM/yyyy HH:mm' }}</span>
                @if (e.durationMinutes != null) {
                  <span class="ml-auto text-xs text-gray-400">
                    {{ 'USERS.SESSIONS.ACTIVE_FOR' | translate }} {{ formatMinutes(e.durationMinutes) }}
                  </span>
                }
              </div>
            }
          </div>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'COMMON.CLOSE' | translate }}</button>
    </mat-dialog-actions>
  `,
})
export class SessionHistoryDialogComponent implements OnInit {
  readonly data = inject<UserDto>(MAT_DIALOG_DATA);
  private readonly userService = inject(UserService);

  SessionEventType = SessionEventType;
  loading = true;
  summary: UserSessionSummaryDto | null = null;

  ngOnInit(): void {
    this.userService.getSessionSummary(this.data.id).subscribe({
      next: s => { this.summary = s; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  iconFor(t: SessionEventType): string {
    if (t === SessionEventType.Login) return 'login';
    if (t === SessionEventType.Logout) return 'logout';
    return 'timer_off';
  }

  labelKeyFor(t: SessionEventType): string {
    if (t === SessionEventType.Login) return 'USERS.SESSIONS.EVENT_LOGIN';
    if (t === SessionEventType.Logout) return 'USERS.SESSIONS.EVENT_LOGOUT';
    return 'USERS.SESSIONS.EVENT_EXPIRED';
  }

  formatMinutes(min: number): string {
    if (min < 60) return `${Math.round(min)}m`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
}
