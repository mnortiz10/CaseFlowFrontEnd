import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService, SupportedLang } from '../../../core/services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatToolbarModule,
    MatIconModule, MatButtonModule, MatBadgeModule,
    MatInputModule, MatFormFieldModule,
    MatSelectModule, MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Output() menuToggle = new EventEmitter<void>();

  readonly auth = inject(AuthService);
  readonly langService = inject(LanguageService);

  get tenantName(): string {
    return 'CaseFlow';
  }

  changeLang(lang: SupportedLang): void {
    this.langService.setLanguage(lang);
  }
}
