import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatChipsModule, TranslatePipe, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  loading = true;
  stats = { users: 0, roles: 0, permissions: 0 };
  recentUsers: any[] = [];

  get firstName(): string { return this.auth.currentUser?.firstName ?? ''; }

  ngOnInit(): void {
    forkJoin([
      this.http.get<any>(`${environment.apiUrl}/users?page=1&pageSize=5`),
      this.http.get<any[]>(`${environment.apiUrl}/roles`),
      this.http.get<any[]>(`${environment.apiUrl}/permissions`),
    ]).subscribe({
      next: ([users, roles, permissions]) => {
        this.stats.users = users.totalCount;
        this.recentUsers = users.items;
        this.stats.roles = roles.length;
        this.stats.permissions = (permissions as any[]).reduce(
          (sum: number, g: any) => sum + g.permissions.length, 0
        );
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
