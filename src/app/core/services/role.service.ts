import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RoleDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  permissionCount: number;
  permissions: string[];
}

export interface CreateRoleDto {
  name: string;
  description: string;
}

export interface UpdateRoleDto {
  name: string;
  description: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/roles`;

  getRoles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(this.base);
  }

  getRole(id: string): Observable<RoleDto> {
    return this.http.get<RoleDto>(`${this.base}/${id}`);
  }

  createRole(dto: CreateRoleDto): Observable<RoleDto> {
    return this.http.post<RoleDto>(this.base, dto);
  }

  updateRole(id: string, dto: UpdateRoleDto): Observable<RoleDto> {
    return this.http.put<RoleDto>(`${this.base}/${id}`, dto);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  assignPermissions(id: string, permissionCodes: string[]): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/permissions`, { permissionCodes });
  }
}
