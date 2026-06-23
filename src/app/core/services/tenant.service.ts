import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/settings`;

  getTenant(): Observable<TenantInfo> {
    return this.http.get<TenantInfo>(`${this.apiUrl}/tenant`);
  }
}
