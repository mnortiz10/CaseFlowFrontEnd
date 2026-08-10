import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserService, UserDto } from '../../core/services/user.service';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { SessionHistoryDialogComponent } from './session-history-dialog/session-history-dialog.component';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog/confirm-dialog.component';
import { ApiDatePipe } from '../../shared/pipes/api-date.pipe';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
    MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatCardModule, MatSelectModule, MatDialogModule,
    MatTooltipModule, MatProgressSpinnerModule, TranslatePipe, ApiDatePipe,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  displayedColumns = ['name', 'email', 'roles', 'status', 'lastLogin', 'actions'];
  users: UserDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  loading = false;

  filterForm = this.fb.group({
    search:   [''],
    isActive: [null as boolean | null],
  });

  ngOnInit(): void {
    this.loadUsers();
    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.loadUsers();
    });
  }

  loadUsers(): void {
    this.loading = true;
    const { search, isActive } = this.filterForm.value;
    this.userService.getUsers(this.page, this.pageSize, search ?? undefined, isActive).subscribe({
      next: (res) => {
        this.users = res.items;
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  openCreate(): void {
    this.dialog.open(UserDialogComponent, { width: '540px', data: {} }).afterClosed()
      .subscribe(result => {
        if (result) {
          this.toast('USERS.TOAST.CREATED');
          this.loadUsers();
        }
      });
  }

  openEdit(user: UserDto, event: Event): void {
    event.stopPropagation();
    this.dialog.open(UserDialogComponent, { width: '540px', data: { user } }).afterClosed()
      .subscribe(result => {
        if (result) {
          this.toast('USERS.TOAST.UPDATED');
          this.loadUsers();
        }
      });
  }

  openSessions(user: UserDto, event: Event): void {
    event.stopPropagation();
    this.dialog.open(SessionHistoryDialogComponent, { width: '560px', data: user });
  }

  confirmDelete(user: UserDto, event: Event): void {
    event.stopPropagation();
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title:        this.translate.instant('USERS.CONFIRM_DELETE.TITLE'),
        message:      this.translate.instant('USERS.CONFIRM_DELETE.MESSAGE', {
          name: `${user.firstName} ${user.lastName}`,
        }),
        confirmLabel: this.translate.instant('COMMON.DELETE'),
        danger: true,
      },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.toast('USERS.TOAST.DELETED');
            this.loadUsers();
          },
        });
      }
    });
  }

  getRoleColor(role: string): string {
    const map: Record<string, string> = {
      Admin:  '#dbeafe',
      Viewer: '#d1fae5',
    };
    return map[role] ?? '#f3f4f6';
  }

  private toast(key: string): void {
    this.snackBar.open(
      this.translate.instant(key),
      this.translate.instant('COMMON.CLOSE'),
      { duration: 2500 }
    );
  }
}
