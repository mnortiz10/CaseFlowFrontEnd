import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum FormFieldType {
  Text = 0,
  TextArea = 1,
  Checkbox = 2,
  Select = 3,
  Number = 4,
  Date = 5
}

export interface StateFormFieldDto {
  id: number;
  label: string;
  fieldKey: string;
  fieldType: FormFieldType;
  isRequired: boolean;
  options: string | null;
  placeholder: string | null;
  order: number;
}

export interface StateChecklistItemDto {
  id: number;
  title: string;
  isRequired: boolean;
  order: number;
}

export interface WorkflowStateDto {
  id: number;
  workflowDefinitionId: number;
  name: string;
  description: string;
  order: number;
  isInitial: boolean;
  isFinal: boolean;
  canTransitionToFinal: boolean;
  nextStateId: number | null;
  previousStateId: number | null;
  yellowThresholdHours: number;
  redThresholdHours: number;
  formFields: StateFormFieldDto[];
  checklistItems: StateChecklistItemDto[];
}

export interface WorkflowDefinitionDto {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  stateCount: number;
  createdAt: string;
}

export interface WorkflowDefinitionDetailDto {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  states: WorkflowStateDto[];
}

export interface CreateWorkflowDto { name: string; description: string; }
export interface UpdateWorkflowDto { name: string; description: string; isActive: boolean; }
export interface CreateStateDto {
  name: string; description: string;
  isInitial: boolean; isFinal: boolean; canTransitionToFinal: boolean;
  yellowThresholdHours: number; redThresholdHours: number;
}
export interface UpdateStateDto {
  name: string; description: string;
  isInitial: boolean; isFinal: boolean; canTransitionToFinal: boolean;
  yellowThresholdHours: number; redThresholdHours: number;
}
export interface CreateFormFieldDto {
  label: string; fieldKey: string; fieldType: FormFieldType;
  isRequired: boolean; options: string | null; placeholder: string | null;
}
export interface UpdateFormFieldDto {
  label: string; fieldKey: string; fieldType: FormFieldType;
  isRequired: boolean; options: string | null; placeholder: string | null; order: number;
}
export interface CreateChecklistItemDto { title: string; isRequired: boolean; }
export interface UpdateChecklistItemDto { title: string; isRequired: boolean; order: number; }

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/workflows`;

  getAll(): Observable<WorkflowDefinitionDto[]> {
    return this.http.get<WorkflowDefinitionDto[]>(this.base);
  }

  getById(id: number): Observable<WorkflowDefinitionDetailDto> {
    return this.http.get<WorkflowDefinitionDetailDto>(`${this.base}/${id}`);
  }

  create(dto: CreateWorkflowDto): Observable<WorkflowDefinitionDto> {
    return this.http.post<WorkflowDefinitionDto>(this.base, dto);
  }

  update(id: number, dto: UpdateWorkflowDto): Observable<WorkflowDefinitionDto> {
    return this.http.put<WorkflowDefinitionDto>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addState(workflowId: number, dto: CreateStateDto): Observable<WorkflowStateDto> {
    return this.http.post<WorkflowStateDto>(`${this.base}/${workflowId}/states`, dto);
  }

  updateState(workflowId: number, stateId: number, dto: UpdateStateDto): Observable<WorkflowStateDto> {
    return this.http.put<WorkflowStateDto>(`${this.base}/${workflowId}/states/${stateId}`, dto);
  }

  deleteState(workflowId: number, stateId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${workflowId}/states/${stateId}`);
  }

  reorderStates(workflowId: number, orderedIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.base}/${workflowId}/states/reorder`, orderedIds);
  }

  addFormField(workflowId: number, stateId: number, dto: CreateFormFieldDto): Observable<StateFormFieldDto> {
    return this.http.post<StateFormFieldDto>(`${this.base}/${workflowId}/states/${stateId}/fields`, dto);
  }

  updateFormField(workflowId: number, stateId: number, fieldId: number, dto: UpdateFormFieldDto): Observable<StateFormFieldDto> {
    return this.http.put<StateFormFieldDto>(`${this.base}/${workflowId}/states/${stateId}/fields/${fieldId}`, dto);
  }

  deleteFormField(workflowId: number, stateId: number, fieldId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${workflowId}/states/${stateId}/fields/${fieldId}`);
  }

  addChecklistItem(workflowId: number, stateId: number, dto: CreateChecklistItemDto): Observable<StateChecklistItemDto> {
    return this.http.post<StateChecklistItemDto>(`${this.base}/${workflowId}/states/${stateId}/checklists`, dto);
  }

  updateChecklistItem(workflowId: number, stateId: number, itemId: number, dto: UpdateChecklistItemDto): Observable<StateChecklistItemDto> {
    return this.http.put<StateChecklistItemDto>(`${this.base}/${workflowId}/states/${stateId}/checklists/${itemId}`, dto);
  }

  deleteChecklistItem(workflowId: number, stateId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${workflowId}/states/${stateId}/checklists/${itemId}`);
  }
}
