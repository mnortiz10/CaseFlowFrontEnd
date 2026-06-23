import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const langService = inject(LanguageService);
  const cloned = req.clone({
    setHeaders: { 'Accept-Language': langService.currentLang },
  });
  return next(cloned);
};
