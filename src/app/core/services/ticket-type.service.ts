import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TicketTypeDto {
  id: number;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  workflowDefinitionId: number | null;
  workflowDefinitionName: string | null;
  createdAt: string;
}

export interface CreateTicketTypeDto {
  name: string;
  description: string;
  color: string;
  workflowDefinitionId: number | null;
}

export interface UpdateTicketTypeDto {
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  workflowDefinitionId: number | null;
}

@Injectable({ providedIn: 'root' })
export class TicketTypeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ticket-types`;

  getAll(): Observable<TicketTypeDto[]> {
    return this.http.get<TicketTypeDto[]>(this.base);
  }

  getById(id: number): Observable<TicketTypeDto> {
    return this.http.get<TicketTypeDto>(`${this.base}/${id}`);
  }

  create(dto: CreateTicketTypeDto): Observable<TicketTypeDto> {
    return this.http.post<TicketTypeDto>(this.base, dto);
  }

  update(id: number, dto: UpdateTicketTypeDto): Observable<TicketTypeDto> {
    return this.http.put<TicketTypeDto>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
