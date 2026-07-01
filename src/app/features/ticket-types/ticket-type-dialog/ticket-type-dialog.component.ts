import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { TicketTypeService, TicketTypeDto } from '../../../core/services/ticket-type.service';
import { WorkflowService, WorkflowDefinitionDto } from '../../../core/services/workflow.service';

export interface TicketTypeDialogData {
  ticketType?: TicketTypeDto;
}

@Component({
  selector: 'app-ticket-type-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatButtonModule,
    MatProgressSpinnerModule, TranslatePipe,
  ],
  templateUrl: './ticket-type-dialog.component.html',
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 0; padding-top: 4px; }
    mat-form-field { width: 100%; }
    .color-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
  `],
})
export class TicketTypeDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TicketTypeService);
  private readonly workflowService = inject(WorkflowService);
  private readonly dialogRef = inject(MatDialogRef<TicketTypeDialogComponent>);
  readonly data: TicketTypeDialogData = inject(MAT_DIALOG_DATA);

  get isEdit(): boolean { return !!this.data?.ticketType; }

  saving = false;
  workflows: WorkflowDefinitionDto[] = [];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    color: ['#3B82F6', Validators.required],
    workflowDefinitionId: [null as number | null],
    isActive: [true],
  });

  ngOnInit(): void {
    this.workflowService.getAll().subscribe({ next: (w) => (this.workflows = w) });
    if (this.isEdit) {
      const t = this.data.ticketType!;
      this.form.patchValue({
        name: t.name,
        description: t.description,
        color: t.color,
        workflowDefinitionId: t.workflowDefinitionId,
        isActive: t.isActive,
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.form.value;

    if (this.isEdit) {
      this.service.update(this.data.ticketType!.id, {
        name: v.name!,
        description: v.description ?? '',
        color: v.color!,
        isActive: v.isActive!,
        workflowDefinitionId: v.workflowDefinitionId ?? null,
      }).subscribe({
        next: () => this.dialogRef.close(true),
        error: () => (this.saving = false),
      });
    } else {
      this.service.create({
        name: v.name!,
        description: v.description ?? '',
        color: v.color!,
        workflowDefinitionId: v.workflowDefinitionId ?? null,
      }).subscribe({
        next: () => this.dialogRef.close(true),
        error: () => (this.saving = false),
      });
    }
  }
}
