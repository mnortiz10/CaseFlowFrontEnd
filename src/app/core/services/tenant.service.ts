import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantSettingsDto {
  id: number;
  name: string;
  slug: string;
  promptExtendTimeOnStateSave: boolean;
  enableCommentHistory: boolean;
}

export interface UpdateTenantSettingsDto {
  promptExtendTimeOnStateSave: boolean;
  enableCommentHistory: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/settings`;

  private settingsCache$: Observable<TenantSettingsDto> | null = null;

  getSettings(): Observable<TenantSettingsDto> {
    if (!this.settingsCache$) {
      this.settingsCache$ = this.http.get<TenantSettingsDto>(this.apiUrl).pipe(shareReplay(1));
    }
    return this.settingsCache$;
  }

  updateSettings(dto: UpdateTenantSettingsDto): Observable<TenantSettingsDto> {
    return this.http.put<TenantSettingsDto>(this.apiUrl, dto).pipe(
      tap((updated) => { this.settingsCache$ = of(updated).pipe(shareReplay(1)); }),
    );
  }
}
