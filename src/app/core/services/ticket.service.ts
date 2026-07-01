import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FormFieldType } from './workflow.service';

export enum TicketSubState {
  Green = 0,
  Yellow = 1,
  Red = 2
}

export interface TicketListItemDto {
  id: number;
  ticketNumber: string;
  title: string;
  ticketTypeName: string;
  ticketTypeColor: string;
  currentStateName: string;
  subState: TicketSubState;
  stateEnteredAt: string;
  assignedToName: string | null;
  createdByName: string;
  createdAt: string;
}

export interface TicketFieldValueDto {
  fieldId: number;
  label: string;
  fieldKey: string;
  fieldType: FormFieldType;
  isRequired: boolean;
  options: string | null;
  value: string | null;
  order: number;
}

export interface TicketChecklistValueDto {
  checklistItemId: number;
  title: string;
  isRequired: boolean;
  isChecked: boolean;
  order: number;
}

export interface TicketTimeExtensionDto {
  extensionHours: number;
  reason: string | null;
  grantedBy: string;
  grantedAt: string;
}

export interface TicketStateDataDto {
  stateId: number;
  stateName: string;
  enteredAt: string;
  transitionedAt: string;
  transitionedBy: string;
  comment: string | null;
  totalHoursInState: number;
  subStateAtCompletion: TicketSubState;
  timeExtensions: TicketTimeExtensionDto[];
  fieldValues: TicketFieldValueDto[];
  checklistValues: TicketChecklistValueDto[];
}

export interface TicketDto {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  ticketTypeId: number;
  ticketTypeName: string;
  ticketTypeColor: string;
  workflowDefinitionId: number;
  workflowDefinitionName: string;
  currentStateId: number;
  currentStateName: string;
  subState: TicketSubState;
  stateEnteredAt: string;
  subStateOverrideUntil: string | null;
  nextStateId: number | null;
  nextStateName: string | null;
  canTransitionToFinal: boolean;
  finalStateId: number | null;
  createdByName: string;
  assignedToUserId: number | null;
  assignedToName: string | null;
  createdAt: string;
  currentStateNote: string | null;
  fieldValues: TicketFieldValueDto[];
  checklistValues: TicketChecklistValueDto[];
  completedStates: TicketStateDataDto[];
}

export interface TicketHistoryDto {
  id: number;
  fromStateName: string;
  toStateName: string;
  comment: string | null;
  changedByName: string;
  changedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateTicketDto {
  title: string;
  description: string;
  ticketTypeId: number;
  assignedToUserId: number | null;
}

export interface TransitionStateDto {
  toStateId: number;
  comment: string | null;
  fieldValues: { fieldId: number; value: string | null }[];
  checklistValues: { checklistItemId: number; isChecked: boolean }[];
}

export interface SaveStateDto {
  note: string | null;
  fieldValues: { fieldId: number; value: string | null }[];
  checklistValues: { checklistItemId: number; isChecked: boolean }[];
}

export interface ExtendTimeDto {
  extensionHours: number;
  reason: string | null;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tickets`;

  getAll(
    page: number, pageSize: number,
    title?: string, ticketNumber?: string,
    ticketTypeId?: number, stateId?: number, subState?: number
  ): Observable<PagedResult<TicketListItemDto>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (title)          params = params.set('title', title);
    if (ticketNumber)   params = params.set('ticketNumber', ticketNumber);
    if (ticketTypeId != null) params = params.set('ticketTypeId', ticketTypeId);
    if (stateId != null)      params = params.set('stateId', stateId);
    if (subState != null)     params = params.set('subState', subState);
    return this.http.get<PagedResult<TicketListItemDto>>(this.base, { params });
  }

  getById(id: number): Observable<TicketDto> {
    return this.http.get<TicketDto>(`${this.base}/${id}`);
  }

  create(dto: CreateTicketDto): Observable<TicketDto> {
    return this.http.post<TicketDto>(this.base, dto);
  }

  transition(id: number, dto: TransitionStateDto): Observable<TicketDto> {
    return this.http.post<TicketDto>(`${this.base}/${id}/transition`, dto);
  }

  saveState(id: number, dto: SaveStateDto): Observable<TicketDto> {
    return this.http.post<TicketDto>(`${this.base}/${id}/save-state`, dto);
  }

  extendTime(id: number, dto: ExtendTimeDto): Observable<TicketDto> {
    return this.http.post<TicketDto>(`${this.base}/${id}/extend-time`, dto);
  }

  reassign(id: number, assignedToUserId: number | null): Observable<TicketDto> {
    return this.http.put<TicketDto>(`${this.base}/${id}/assign`, { assignedToUserId });
  }

  getHistory(id: number): Observable<TicketHistoryDto[]> {
    return this.http.get<TicketHistoryDto[]>(`${this.base}/${id}/history`);
  }
}
