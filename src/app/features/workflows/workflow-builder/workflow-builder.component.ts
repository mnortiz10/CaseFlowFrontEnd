import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { WorkflowService, WorkflowDefinitionDetailDto, WorkflowStateDto } from '../../../core/services/workflow.service';
import { ConfirmDialogComponent } from '../../../shared/dialogs/confirm-dialog/confirm-dialog.component';
import { StateEditorDialogComponent } from './state-editor-dialog/state-editor-dialog.component';

@Component({
  selector: 'app-workflow-builder',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatDialogModule, MatProgressSpinnerModule, MatChipsModule,
    DragDropModule, TranslatePipe,
  ],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./workflow-builder.component.scss'],
})
export class WorkflowBuilderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(WorkflowService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  workflow: WorkflowDefinitionDetailDto | null = null;
  loading = true;
  sortedStates: WorkflowStateDto[] = [];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadWorkflow(id);
  }

  loadWorkflow(id: number): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (wf) => {
        this.workflow = wf;
        this.sortedStates = [...wf.states].sort((a, b) => a.order - b.order);
        this.loading = false;
      },
      error: () => { this.loading = false; this.router.navigate(['/workflows']); },
    });
  }

  drop(event: CdkDragDrop<WorkflowStateDto[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.sortedStates, event.previousIndex, event.currentIndex);
    this.service.reorderStates(this.workflow!.id, this.sortedStates.map(s => s.id)).subscribe({
      error: () => this.loadWorkflow(this.workflow!.id),
    });
  }

  openAddState(): void {
    this.dialog
      .open(StateEditorDialogComponent, { width: '680px', data: { workflowId: this.workflow!.id, state: null } })
      .afterClosed().subscribe((saved) => {
        if (saved) {
          this.snackBar.open(this.translate.instant('WORKFLOWS.TOAST.STATE_ADDED'), 'OK', { duration: 3000 });
          this.loadWorkflow(this.workflow!.id);
        }
      });
  }

  openEditState(state: WorkflowStateDto): void {
    this.dialog
      .open(StateEditorDialogComponent, { width: '680px', data: { workflowId: this.workflow!.id, state } })
      .afterClosed().subscribe((saved) => {
        if (saved) {
          this.snackBar.open(this.translate.instant('WORKFLOWS.TOAST.STATE_UPDATED'), 'OK', { duration: 3000 });
          this.loadWorkflow(this.workflow!.id);
        }
      });
  }

  deleteState(state: WorkflowStateDto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: this.translate.instant('WORKFLOWS.DELETE_STATE_TITLE'),
          message: this.translate.instant('WORKFLOWS.DELETE_STATE_MSG', { name: state.name }),
          confirmLabel: this.translate.instant('COMMON.DELETE'),
          danger: true,
        },
      })
      .afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.service.deleteState(this.workflow!.id, state.id).subscribe({
            next: () => {
              this.snackBar.open(this.translate.instant('WORKFLOWS.TOAST.STATE_DELETED'), 'OK', { duration: 3000 });
              this.loadWorkflow(this.workflow!.id);
            },
          });
        }
      });
  }

  getNodeColor(state: WorkflowStateDto): string {
    if (state.isInitial) return '#22c55e';
    if (state.isFinal) return '#8b5cf6';
    return '#3b82f6';
  }

  back(): void { this.router.navigate(['/workflows']); }
}
