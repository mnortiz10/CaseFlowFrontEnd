import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/tickets/ticket-dashboard/ticket-dashboard.component').then(m => m.TicketDashboardComponent)
      },
      {
        path: 'overview',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [roleGuard],
        data: { role: 'Admin' }
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
        canActivate: [roleGuard],
        data: { role: 'Admin' }
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent),
        canActivate: [roleGuard],
        data: { role: 'Admin' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [roleGuard],
        data: { role: 'Admin' }
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'ticket-types',
        loadComponent: () => import('./features/ticket-types/ticket-types.component').then(m => m.TicketTypesComponent)
      },
      {
        path: 'workflows',
        loadComponent: () => import('./features/workflows/workflows.component').then(m => m.WorkflowsComponent)
      },
      {
        path: 'workflows/:id',
        loadComponent: () => import('./features/workflows/workflow-builder/workflow-builder.component').then(m => m.WorkflowBuilderComponent)
      },
      {
        path: 'tickets',
        loadComponent: () => import('./features/tickets/tickets.component').then(m => m.TicketsComponent)
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('./features/tickets/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
