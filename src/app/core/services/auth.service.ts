import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  get currentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  get accessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  get refreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isLoggedIn(): boolean {
    return !!this.accessToken && !!this.currentUser;
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  hasPermission(code: string): boolean {
    return this.currentUser?.permissions.includes(code) ?? false;
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  login(identifier: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { identifier, password }).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  register(data: object): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  refreshTokenRequest(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {
      refreshToken: this.refreshToken
    }).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  logout(): void {
    const token = this.refreshToken;
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken: token }).subscribe({
        error: () => {}
      });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private handleAuthResponse(res: LoginResponse): void {
    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem('refresh_token', res.refreshToken);
    localStorage.setItem('expires_at', res.expiresAt);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
    this.scheduleTokenRefresh(new Date(res.expiresAt));
  }

  private scheduleTokenRefresh(expiresAt: Date): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const msUntilExpiry = expiresAt.getTime() - Date.now() - 60_000;
    if (msUntilExpiry > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshTokenRequest().subscribe({
          error: () => this.logout()
        });
      }, msUntilExpiry);
    }
  }

  private clearSession(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private loadUser(): UserInfo | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
