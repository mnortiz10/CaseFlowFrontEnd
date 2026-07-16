import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import {
  WorkflowService,
  WorkflowStateDto,
  FormFieldType,
} from '../../../../core/services/workflow.service';

export interface StateEditorDialogData {
  workflowId: number;
  state: WorkflowStateDto | null;
}

@Component({
  selector: 'app-state-editor-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatTabsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, TranslatePipe,
  ],
  templateUrl: './state-editor-dialog.component.html',
  styles: [`
    .tab-content { padding: 16px 0; min-height: 260px; }
    mat-form-field { width: 100%; }
    .field-row { display: flex; gap: 8px; align-items: flex-start; }
    .field-row mat-form-field { flex: 1; }
    .checklist-row { display: flex; gap: 8px; align-items: center; }
    .checklist-row mat-form-field { flex: 1; }
  `],
})
export class StateEditorDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(WorkflowService);
  private readonly dialogRef = inject(MatDialogRef<StateEditorDialogComponent>);
  readonly data: StateEditorDialogData = inject(MAT_DIALOG_DATA);

  get isEdit(): boolean { return !!this.data.state; }

  saving = false;
  fieldTypes = Object.entries(FormFieldType)
    .filter(([, v]) => typeof v === 'number')
    .map(([label, value]) => ({ label, value: value as FormFieldType }));

  infoForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    isInitial: [false],
    isFinal: [false],
    canTransitionToFinal: [false],
  });

  timesForm = this.fb.group({
    yellowThresholdHours: [24, [Validators.required, Validators.min(1)]],
    redThresholdHours: [72, [Validators.required, Validators.min(1)]],
  });

  fieldsArray = this.fb.array<FormGroup>([]);
  checklistArray = this.fb.array<FormGroup>([]);

  ngOnInit(): void {
    if (this.isEdit) {
      const s = this.data.state!;
      this.infoForm.patchValue({
        name: s.name,
        description: s.description,
        isInitial: s.isInitial,
        isFinal: s.isFinal,
        canTransitionToFinal: s.canTransitionToFinal,
      });
      this.timesForm.patchValue({
        yellowThresholdHours: s.yellowThresholdHours,
        redThresholdHours: s.redThresholdHours,
      });
      s.formFields.forEach((f) => this.fieldsArray.push(this.makeFieldGroup(f)));
      s.checklistItems.forEach((c) => this.checklistArray.push(this.makeChecklistGroup(c)));
    }

    if (this.infoForm.get('isFinal')!.value) {
      this.enforceFinalStateConstraints();
    }
    this.infoForm.get('isFinal')!.valueChanges.subscribe((isFinal) => {
      if (isFinal) this.enforceFinalStateConstraints();
    });
  }

  get isFinalState(): boolean { return !!this.infoForm.get('isFinal')!.value; }

  private enforceFinalStateConstraints(): void {
    this.checklistArray.clear();
    if (this.fieldsArray.length > 1) {
      const first = this.fieldsArray.at(0) as FormGroup;
      this.fieldsArray.clear();
      this.fieldsArray.push(first);
    }
    if (this.fieldsArray.length === 1) {
      (this.fieldsArray.at(0) as FormGroup).patchValue(
        { fieldType: FormFieldType.TextArea, isRequired: false },
        { emitEvent: false },
      );
    }
  }

  toggleFinalDescriptionField(checked: boolean): void {
    this.fieldsArray.clear();
    if (checked) {
      this.fieldsArray.push(this.makeFieldGroup({
        label: 'Descripción',
        fieldKey: 'descripcion_final',
        fieldType: FormFieldType.TextArea,
        isRequired: false,
        order: 1,
      }));
    }
  }

  makeFieldGroup(f?: Partial<{ id: number; label: string; fieldKey: string; fieldType: FormFieldType; isRequired: boolean; options: string | null; placeholder: string | null; order: number }>): FormGroup {
    const parsedOptions: string[] = [];
    if (f?.options) {
      try { parsedOptions.push(...JSON.parse(f.options)); } catch { }
    }
    return this.fb.group({
      id: [f?.id ?? 0],
      label: [f?.label ?? '', Validators.required],
      fieldKey: [f?.fieldKey ?? '', Validators.required],
      fieldType: [f?.fieldType ?? FormFieldType.Text, Validators.required],
      isRequired: [f?.isRequired ?? false],
      placeholder: [f?.placeholder ?? ''],
      order: [f?.order ?? this.fieldsArray.length + 1],
      selectOptions: this.fb.array(parsedOptions.map(o => this.fb.control(o))),
    });
  }

  getSelectOptionsArray(fg: FormGroup): FormArray<FormControl<string | null>> {
    return fg.get('selectOptions') as FormArray<FormControl<string | null>>;
  }

  addSelectOption(fg: FormGroup): void {
    this.getSelectOptionsArray(fg).push(this.fb.control(''));
  }

  removeSelectOption(fg: FormGroup, i: number): void {
    this.getSelectOptionsArray(fg).removeAt(i);
  }

  makeChecklistGroup(c?: Partial<{ id: number; title: string; isRequired: boolean; order: number }>): FormGroup {
    return this.fb.group({
      id: [c?.id ?? 0],
      title: [c?.title ?? '', Validators.required],
      isRequired: [c?.isRequired ?? false],
      order: [c?.order ?? this.checklistArray.length + 1],
    });
  }

  addField(): void { this.fieldsArray.push(this.makeFieldGroup()); }
  removeField(i: number): void { this.fieldsArray.removeAt(i); }
  addChecklistItem(): void { this.checklistArray.push(this.makeChecklistGroup()); }
  removeChecklistItem(i: number): void { this.checklistArray.removeAt(i); }

  async save(): Promise<void> {
    this.infoForm.markAllAsTouched();
    const isFinal = !!this.infoForm.get('isFinal')!.value;
    if (!isFinal) this.timesForm.markAllAsTouched();
    if (this.infoForm.invalid || (!isFinal && this.timesForm.invalid)) return;

    this.saving = true;
    const iv = this.infoForm.value;
    const tv = this.timesForm.value;

    const stateDto = {
      name: iv.name!,
      description: iv.description ?? '',
      isInitial: iv.isInitial!,
      isFinal: iv.isFinal!,
      canTransitionToFinal: iv.canTransitionToFinal!,
      yellowThresholdHours: isFinal ? 0 : tv.yellowThresholdHours!,
      redThresholdHours: isFinal ? 0 : tv.redThresholdHours!,
    };

    try {
      let stateId = this.data.state?.id;

      if (this.isEdit) {
        await this.service.updateState(this.data.workflowId, stateId!, stateDto).toPromise();
      } else {
        const created = await this.service.addState(this.data.workflowId, stateDto).toPromise();
        stateId = created!.id;
      }

      // Sync fields
      const existingFieldIds = this.data.state?.formFields.map((f) => f.id) ?? [];
      for (const fg of this.fieldsArray.controls as FormGroup[]) {
        const fv = fg.value;
        const rawOptions = (fg.get('selectOptions') as FormArray).controls
          .map(c => (c.value as string)?.trim())
          .filter(o => !!o);
        const options = fv.fieldType === FormFieldType.Select && rawOptions.length > 0
          ? JSON.stringify(rawOptions)
          : null;

        if (fv.id && existingFieldIds.includes(fv.id)) {
          await this.service.updateFormField(this.data.workflowId, stateId!, fv.id, {
            label: fv.label, fieldKey: fv.fieldKey, fieldType: fv.fieldType,
            isRequired: fv.isRequired, options,
            placeholder: fv.placeholder || null, order: fv.order,
          }).toPromise();
        } else if (!fv.id || fv.id === 0) {
          await this.service.addFormField(this.data.workflowId, stateId!, {
            label: fv.label, fieldKey: fv.fieldKey, fieldType: fv.fieldType,
            isRequired: fv.isRequired, options,
            placeholder: fv.placeholder || null,
          }).toPromise();
        }
      }

      // Delete removed fields
      const currentFieldIds = (this.fieldsArray.controls as FormGroup[])
        .map((fg) => fg.value.id).filter((id) => id > 0);
      for (const id of existingFieldIds) {
        if (!currentFieldIds.includes(id)) {
          await this.service.deleteFormField(this.data.workflowId, stateId!, id).toPromise();
        }
      }

      // Sync checklist
      const existingChecklistIds = this.data.state?.checklistItems.map((c) => c.id) ?? [];
      for (const cg of this.checklistArray.controls as FormGroup[]) {
        const cv = cg.value;
        if (cv.id && existingChecklistIds.includes(cv.id)) {
          await this.service.updateChecklistItem(this.data.workflowId, stateId!, cv.id, {
            title: cv.title, isRequired: cv.isRequired, order: cv.order,
          }).toPromise();
        } else if (!cv.id || cv.id === 0) {
          await this.service.addChecklistItem(this.data.workflowId, stateId!, {
            title: cv.title, isRequired: cv.isRequired,
          }).toPromise();
        }
      }

      // Delete removed checklist items
      const currentChecklistIds = (this.checklistArray.controls as FormGroup[])
        .map((cg) => cg.value.id).filter((id) => id > 0);
      for (const id of existingChecklistIds) {
        if (!currentChecklistIds.includes(id)) {
          await this.service.deleteChecklistItem(this.data.workflowId, stateId!, id).toPromise();
        }
      }

      this.dialogRef.close(true);
    } catch {
      this.saving = false;
    }
  }
}
