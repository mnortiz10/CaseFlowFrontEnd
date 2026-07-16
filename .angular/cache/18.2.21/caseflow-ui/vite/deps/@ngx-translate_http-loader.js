import {
  TranslateLoader,
  mergeDeep
} from "./chunk-HBFVFRUY.js";
import "./chunk-WRCLOBHU.js";
import {
  HttpBackend,
  HttpClient
} from "./chunk-CO52Q7M7.js";
import "./chunk-BP5SFGIK.js";
import {
  Injectable,
  InjectionToken,
  inject,
  setClassMetadata,
  ɵɵdefineInjectable
} from "./chunk-7Z6LWBVI.js";
import {
  forkJoin
} from "./chunk-IHEXEIBP.js";
import "./chunk-BVOEPT5O.js";
import {
  __spreadValues,
  catchError,
  map,
  of
} from "./chunk-GXJPSUWS.js";

// node_modules/@ngx-translate/http-loader/fesm2022/ngx-translate-http-loader.mjs
var TRANSLATE_HTTP_LOADER_CONFIG = new InjectionToken("TRANSLATE_HTTP_LOADER_CONFIG");
var TranslateHttpLoader = class _TranslateHttpLoader {
  http;
  config;
  constructor() {
    this.config = __spreadValues({
      resources: [],
      enforceLoading: false,
      useHttpBackend: false
    }, inject(TRANSLATE_HTTP_LOADER_CONFIG));
    this.http = this.config.useHttpBackend ? new HttpClient(inject(HttpBackend)) : inject(HttpClient);
  }
  /**
   * Gets the translations from the server
   */
  getTranslation(lang) {
    const cacheBuster = this.config.enforceLoading ? `?enforceLoading=${Date.now()}` : "";
    const requests = this.config.resources.map((resource) => {
      const path = typeof resource === "string" ? `${resource}${lang}.json` : `${resource.prefix}${lang}${resource.suffix ?? ".json"}`;
      const request$ = this.http.get(`${path}${cacheBuster}`);
      if (this.config.failOnError) {
        return request$;
      }
      return request$.pipe(catchError((err) => {
        console.warn(`@ngx-translate/http-loader: error loading translation for ${lang}:`, err);
        return of({});
      }));
    });
    if (requests.length === 0) {
      return of({});
    }
    return forkJoin(requests).pipe(map((response) => response.reduce((acc, curr) => mergeDeep(acc, curr), {})));
  }
  static ɵfac = function TranslateHttpLoader_Factory(t) {
    return new (t || _TranslateHttpLoader)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _TranslateHttpLoader,
    factory: _TranslateHttpLoader.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TranslateHttpLoader, [{
    type: Injectable
  }], () => [], null);
})();
function provideTranslateHttpLoader(config = {}) {
  if ("resources" in config && config.resources) {
    return provideTranslateMultiHttpLoader(config);
  }
  const singleConfig = config;
  const multiConfig = {
    enforceLoading: singleConfig.enforceLoading ?? false,
    useHttpBackend: singleConfig.useHttpBackend ?? false,
    failOnError: singleConfig.failOnError ?? false,
    resources: [{
      prefix: singleConfig.prefix ?? "/assets/i18n/",
      suffix: singleConfig.suffix ?? ".json"
    }]
  };
  return provideTranslateMultiHttpLoader(multiConfig);
}
function provideTranslateMultiHttpLoader(config = {}) {
  return [{
    provide: TRANSLATE_HTTP_LOADER_CONFIG,
    useValue: __spreadValues({
      resources: ["/assets/i18n/"]
    }, config)
  }, {
    provide: TranslateLoader,
    useClass: TranslateHttpLoader
  }];
}
export {
  TRANSLATE_HTTP_LOADER_CONFIG,
  TranslateHttpLoader,
  provideTranslateHttpLoader,
  provideTranslateMultiHttpLoader
};
//# sourceMappingURL=@ngx-translate_http-loader.js.map
