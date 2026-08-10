import { Injectable, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  mustChangePassword: boolean;
  allowedTicketTypeIds: number[];
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

/** Session dies after this much user inactivity (backend logs the expiration). */
const INACTIVITY_LIMIT_MS = 60 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 60 * 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 30 * 1000;

// Tokens live in sessionStorage (not localStorage) so the session ends when the tab closes,
// instead of silently staying logged in the next time the URL is opened.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTimer: ReturnType<typeof setInterval> | null = null;
  private lastActivityWrite = 0;

  constructor() {
    this.startActivityTracking();
    if (this.isLoggedIn()) {
      this.touchActivity(true);
      this.startIdleWatch();
      const expiresAt = sessionStorage.getItem('expires_at');
      if (expiresAt) this.scheduleTokenRefresh(new Date(expiresAt));
    }
  }

  get currentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  get accessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  get refreshToken(): string | null {
    return sessionStorage.getItem('refresh_token');
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

  /** Empty list = no restriction: the user can work with every ticket type. */
  canManageTicketType(ticketTypeId: number): boolean {
    const allowed = this.currentUser?.allowedTicketTypeIds ?? [];
    return allowed.length === 0 || allowed.includes(ticketTypeId);
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

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, { currentPassword, newPassword }).pipe(
      tap(() => {
        const user = this.currentUser;
        if (user) {
          const updated = { ...user, mustChangePassword: false };
          sessionStorage.setItem('user', JSON.stringify(updated));
          this.currentUserSubject.next(updated);
        }
      })
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

  /** Called when the user stayed idle past the limit: revokes tokens server-side and logs the event. */
  private expireSession(): void {
    const token = this.refreshToken;
    if (token) {
      this.http.post(`${this.apiUrl}/session-expired`, { refreshToken: token }).subscribe({
        error: () => {}
      });
    }
    this.clearSession();
    this.router.navigate(['/login'], { queryParams: { expired: 1 } });
  }

  private handleAuthResponse(res: LoginResponse): void {
    sessionStorage.setItem('access_token', res.accessToken);
    sessionStorage.setItem('refresh_token', res.refreshToken);
    sessionStorage.setItem('expires_at', res.expiresAt);
    sessionStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
    this.touchActivity(true);
    this.startIdleWatch();
    this.scheduleTokenRefresh(new Date(res.expiresAt));
  }

  private scheduleTokenRefresh(expiresAt: Date): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const msUntilExpiry = expiresAt.getTime() - Date.now() - 60_000;
    if (msUntilExpiry > 0) {
      this.refreshTimer = setTimeout(() => {
        if (this.isIdleExpired()) {
          this.expireSession();
          return;
        }
        this.refreshTokenRequest().subscribe({
          error: () => this.logout()
        });
      }, msUntilExpiry);
    }
  }

  // --- Inactivity tracking ---

  private startActivityTracking(): void {
    this.zone.runOutsideAngular(() => {
      for (const evt of ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']) {
        document.addEventListener(evt, () => this.touchActivity(), { passive: true });
      }
    });
  }

  private touchActivity(force = false): void {
    if (!force && !this.isLoggedIn()) return;
    const now = Date.now();
    if (force || now - this.lastActivityWrite > ACTIVITY_WRITE_THROTTLE_MS) {
      this.lastActivityWrite = now;
      sessionStorage.setItem('last_activity', String(now));
    }
  }

  private isIdleExpired(): boolean {
    const raw = sessionStorage.getItem('last_activity');
    const last = raw ? Number(raw) : 0;
    return !!last && Date.now() - last >= INACTIVITY_LIMIT_MS;
  }

  private startIdleWatch(): void {
    if (this.idleTimer) return;
    this.zone.runOutsideAngular(() => {
      this.idleTimer = setInterval(() => {
        if (!this.isLoggedIn()) return;
        if (this.isIdleExpired()) {
          this.zone.run(() => this.expireSession());
        }
      }, IDLE_CHECK_INTERVAL_MS);
    });
  }

  private clearSession(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    if (this.idleTimer) { clearInterval(this.idleTimer); this.idleTimer = null; }
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('expires_at');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('last_activity');
    this.currentUserSubject.next(null);
  }

  private loadUser(): UserInfo | null {
    try {
      const raw = sessionStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
