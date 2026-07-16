import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TicketTypeService, TicketTypeDto } from '../../core/services/ticket-type.service';
import { TicketTypeDialogComponent } from './ticket-type-dialog/ticket-type-dialog.component';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-ticket-types',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatTooltipModule, MatDialogModule,
    TranslatePipe,
  ],
  templateUrl: './ticket-types.component.html',
  styleUrls: ['./ticket-types.component.scss'],
})
export class TicketTypesComponent implements OnInit {
  private readonly service = inject(TicketTypeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  displayedColumns = ['color', 'name', 'description', 'workflow', 'status', 'actions'];
  ticketTypes: TicketTypeDto[] = [];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe({ next: (data) => (this.ticketTypes = data) });
  }

  openCreate(): void {
    this.dialog
      .open(TicketTypeDialogComponent, { width: '540px', data: {} })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.snackBar.open(this.translate.instant('TICKET_TYPES.TOAST.CREATED'), 'OK', { duration: 3000 });
          this.load();
        }
      });
  }

  openEdit(type: TicketTypeDto): void {
    this.dialog
      .open(TicketTypeDialogComponent, { width: '540px', data: { ticketType: type } })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.snackBar.open(this.translate.instant('TICKET_TYPES.TOAST.UPDATED'), 'OK', { duration: 3000 });
          this.load();
        }
      });
  }

  delete(type: TicketTypeDto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: this.translate.instant('TICKET_TYPES.DELETE_TITLE'),
          message: this.translate.instant('TICKET_TYPES.DELETE_MSG', { name: type.name }),
          confirmLabel: this.translate.instant('COMMON.DELETE'),
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.service.delete(type.id).subscribe({
            next: () => {
              this.snackBar.open(this.translate.instant('TICKET_TYPES.TOAST.DELETED'), 'OK', { duration: 3000 });
              this.load();
            },
          });
        }
      });
  }
}
