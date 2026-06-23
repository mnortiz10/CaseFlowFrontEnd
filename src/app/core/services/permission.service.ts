import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PermissionDto {
  id: string;
  name: string;
  code: string;
  description: string;
  module: string;
}

export interface PermissionGroupDto {
  module: string;
  permissions: PermissionDto[];
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);

  getGrouped(): Observable<PermissionGroupDto[]> {
    return this.http.get<PermissionGroupDto[]>(`${environment.apiUrl}/permissions`);
  }
}
