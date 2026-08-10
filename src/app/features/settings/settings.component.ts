import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatCheckboxModule, TranslatePipe,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly tenantService = inject(TenantService);
  readonly auth = inject(AuthService);

  tenantForm = this.fb.group({
    name: [{ value: 'CaseFlow Admin', disabled: false }],
    slug: [{ value: 'caseflow', disabled: true }],
  });

  advancedForm = this.fb.group({
    promptExtendTimeOnStateSave: [true],
    enableCommentHistory: [true],
  });

  savingAdvanced = false;

  ngOnInit(): void {
    this.tenantService.getSettings().subscribe({
      next: (s) => this.advancedForm.patchValue({
        promptExtendTimeOnStateSave: s.promptExtendTimeOnStateSave,
        enableCommentHistory: s.enableCommentHistory,
      }),
    });
  }

  save(): void {
    this.snackBar.open(
      this.translate.instant('SETTINGS.TOAST.SAVED'),
      this.translate.instant('COMMON.CLOSE'),
      { duration: 2500 }
    );
  }

  saveAdvanced(): void {
    this.savingAdvanced = true;
    const promptExtendTimeOnStateSave = !!this.advancedForm.value.promptExtendTimeOnStateSave;
    const enableCommentHistory = !!this.advancedForm.value.enableCommentHistory;
    this.tenantService.updateSettings({ promptExtendTimeOnStateSave, enableCommentHistory }).subscribe({
      next: () => {
        this.savingAdvanced = false;
        this.snackBar.open(
          this.translate.instant('SETTINGS.TOAST.SAVED'),
          this.translate.instant('COMMON.CLOSE'),
          { duration: 2500 }
        );
      },
      error: () => (this.savingAdvanced = false),
    });
  }
}
