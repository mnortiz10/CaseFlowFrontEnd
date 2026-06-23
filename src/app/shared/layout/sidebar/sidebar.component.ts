import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { HasRoleDirective } from '../../../core/directives/has-role.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterLinkActive,
    MatIconModule, MatListModule, MatTooltipModule,
    MatMenuModule, MatDividerModule, HasRoleDirective,
    TranslatePipe,
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Output() toggleSidenav = new EventEmitter<void>();

  readonly auth = inject(AuthService);

  get userFullName(): string {
    const u = this.auth.currentUser;
    return u ? `${u.firstName} ${u.lastName}` : '';
  }

  get userInitials(): string {
    const u = this.auth.currentUser;
    if (!u) return '?';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  logout(): void {
    this.auth.logout();
  }
}
