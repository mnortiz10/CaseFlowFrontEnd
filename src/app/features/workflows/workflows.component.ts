import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { WorkflowService, WorkflowDefinitionDto } from '../../core/services/workflow.service';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCardModule, MatChipsModule, MatTooltipModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, ReactiveFormsModule, TranslatePipe,
  ],
  templateUrl: './workflows.component.html',
  styleUrls: ['./workflows.component.scss'],
})
export class WorkflowsComponent implements OnInit {
  private readonly service = inject(WorkflowService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  displayedColumns = ['name', 'description', 'states', 'status', 'actions'];
  workflows: WorkflowDefinitionDto[] = [];
  showCreateForm = false;
  saving = false;

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.service.getAll().subscribe({ next: (data) => (this.workflows = data) });
  }

  openBuilder(wf: WorkflowDefinitionDto): void {
    this.router.navigate(['/workflows', wf.id]);
  }

  createWorkflow(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.createForm.value;
    this.service.create({ name: v.name!, description: v.description ?? '' }).subscribe({
      next: (created) => {
        this.saving = false;
        this.showCreateForm = false;
        this.createForm.reset();
        this.snackBar.open(this.translate.instant('WORKFLOWS.TOAST.CREATED'), 'OK', { duration: 3000 });
        this.router.navigate(['/workflows', created.id]);
      },
      error: () => (this.saving = false),
    });
  }

  delete(wf: WorkflowDefinitionDto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: this.translate.instant('WORKFLOWS.DELETE_TITLE'),
          message: this.translate.instant('WORKFLOWS.DELETE_MSG', { name: wf.name }),
          confirmLabel: this.translate.instant('COMMON.DELETE'),
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.service.delete(wf.id).subscribe({
            next: () => {
              this.snackBar.open(this.translate.instant('WORKFLOWS.TOAST.DELETED'), 'OK', { duration: 3000 });
              this.load();
            },
          });
        }
      });
  }
}
