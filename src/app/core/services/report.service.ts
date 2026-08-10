import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserReportRowDto {
  userId: number;
  userName: string;
  finalizedCount: number;
  avgResolutionHours: number;
}

export interface TypeReportRowDto {
  ticketTypeId: number;
  typeName: string;
  typeColor: string;
  finalizedCount: number;
}

export interface TicketReportDetailRowDto {
  ticketId: number;
  ticketNumber: string;
  title: string;
  typeName: string;
  typeColor: string;
  finalizedByName: string;
  createdAt: string;
  finalizedAt: string;
  resolutionHours: number;
}

export interface TicketReportDto {
  totalCreated: number;
  totalFinalized: number;
  totalActive: number;
  totalOverdue: number;
  avgResolutionHours: number;
  finalizedByUser: UserReportRowDto[];
  finalizedByType: TypeReportRowDto[];
  tickets: TicketReportDetailRowDto[];
}

export interface TicketReportFilters {
  from?: Date | null;
  to?: Date | null;
  ticketTypeId?: number | null;
  userId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reports`;

  getTicketReport(filters: TicketReportFilters): Observable<TicketReportDto> {
    let params = new HttpParams();
    if (filters.from) params = params.set('from', filters.from.toISOString());
    if (filters.to) {
      // Make the end date inclusive: the picker gives midnight local time.
      const end = new Date(filters.to);
      end.setHours(23, 59, 59, 999);
      params = params.set('to', end.toISOString());
    }
    if (filters.ticketTypeId != null) params = params.set('ticketTypeId', filters.ticketTypeId);
    if (filters.userId != null) params = params.set('userId', filters.userId);
    return this.http.get<TicketReportDto>(`${this.base}/tickets`, { params });
  }
}
