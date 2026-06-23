import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLang = 'en' | 'es';

const STORAGE_KEY = 'caseflow_lang';
const DEFAULT_LANG: SupportedLang = 'es';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly supportedLanguages: { code: SupportedLang; labelKey: string }[] = [
    { code: 'es', labelKey: 'LANGUAGE.ES' },
    { code: 'en', labelKey: 'LANGUAGE.EN' },
  ];

  init(): Promise<void> {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLang | null;
    const lang: SupportedLang =
      saved && this.isSupportedLang(saved) ? saved : DEFAULT_LANG;
    return firstValueFrom(this.translate.use(lang)).then(() => void 0);
  }

  setLanguage(lang: SupportedLang): void {
    this.translate.use(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  get currentLang(): SupportedLang {
    return (this.translate.currentLang() as SupportedLang) ?? DEFAULT_LANG;
  }

  private isSupportedLang(lang: string): lang is SupportedLang {
    return ['en', 'es'].includes(lang);
  }
}
