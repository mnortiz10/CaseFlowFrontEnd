import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserDto {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  roles: string[];
  allowedTicketTypeIds: number[];
}

export enum SessionEventType {
  Login = 0,
  Logout = 1,
  InactivityExpired = 2,
}

export interface UserSessionEventDto {
  eventType: SessionEventType;
  occurredAt: string;
  sessionStartedAt: string | null;
  durationMinutes: number | null;
}

export interface UserSessionSummaryDto {
  totalLogins: number;
  totalExpirations: number;
  totalActiveMinutes: number;
  events: UserSessionEventDto[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
  mustChangePassword?: boolean;
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  getUsers(page: number, pageSize: number, search?: string, isActive?: boolean | null): Observable<PagedResult<UserDto>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (isActive != null) params = params.set('isActive', String(isActive));
    return this.http.get<PagedResult<UserDto>>(this.base, { params });
  }

  getAllActive(): Observable<UserDto[]> {
    return new Observable(obs => {
      this.getUsers(1, 200, undefined, true).subscribe({
        next: r => { obs.next(r.items); obs.complete(); },
        error: e => obs.error(e),
      });
    });
  }

  getUser(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.base}/${id}`);
  }

  createUser(dto: CreateUserDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.base, dto);
  }

  updateUser(id: number, dto: UpdateUserDto): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.base}/${id}`, dto);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  assignRoles(id: number, roles: string[]): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/roles`, { roles });
  }

  resetPassword(id: number, newPassword: string, mustChangePassword: boolean): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/reset-password`, { newPassword, mustChangePassword });
  }

  assignTicketTypes(id: number, ticketTypeIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/ticket-types`, { ticketTypeIds });
  }

  getSessionSummary(id: number): Observable<UserSessionSummaryDto> {
    return this.http.get<UserSessionSummaryDto>(`${this.base}/${id}/session-events`);
  }
}
