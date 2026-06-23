import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({ selector: '[appHasRole]', standalone: true })
export class HasRoleDirective implements OnInit {
  @Input() appHasRole!: string;

  private readonly auth = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);

  ngOnInit(): void {
    if (this.auth.hasRole(this.appHasRole)) {
      this.vcr.createEmbeddedView(this.templateRef);
    }
  }
}
