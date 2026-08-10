import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { TicketService } from '../../../core/services/ticket.service';
import { TicketTypeService, TicketTypeDto } from '../../../core/services/ticket-type.service';
import { UserService, UserDto } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-create-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatProgressSpinnerModule, MatIconModule, TranslatePipe,
  ],
  templateUrl: './create-ticket-dialog.component.html',
  styles: [`mat-form-field { width: 100%; }`],
})
export class CreateTicketDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly ticketTypeService = inject(TicketTypeService);
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<CreateTicketDialogComponent>);

  saving = false;
  ticketTypes: TicketTypeDto[] = [];
  users: UserDto[] = [];

  form = this.fb.group({
    title:            ['', [Validators.required, Validators.minLength(3)]],
    description:      ['', Validators.required],
    ticketTypeId:     [null as number | null, Validators.required],
    assignedToUserId: [null as number | null],
  });

  ngOnInit(): void {
    this.ticketTypeService.getAll().subscribe({
      next: tt => this.ticketTypes = tt.filter(t =>
        t.isActive && t.workflowDefinitionId && this.auth.canManageTicketType(t.id)),
    });
    this.userService.getAllActive().subscribe({ next: u => this.users = u });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.form.value;
    this.ticketService.create({
      title:            v.title!,
      description:      v.description!,
      ticketTypeId:     v.ticketTypeId!,
      assignedToUserId: v.assignedToUserId ?? null,
    }).subscribe({
      next: ticket => this.dialogRef.close(ticket),
      error: ()     => (this.saving = false),
    });
  }
}
