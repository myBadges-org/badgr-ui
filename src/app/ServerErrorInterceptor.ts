import { inject, Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';

import { Observable, catchError, throwError } from 'rxjs';
import { ErrorDialogComponent } from './common/dialogs/oeb-dialogs/error-dialog.component';
import { HlmDialogService } from './components/spartan/ui-dialog-helm/src/lib/hlm-dialog.service';

@Injectable()
export class ServerErrorInterceptor implements HttpInterceptor {
    private readonly _hlmDialogService = inject(HlmDialogService);

    constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const baseUrl = this.getBaseUrl();
    return next.handle(req).pipe(
      catchError((error: any) => {
        if (this.isServerError(error, baseUrl)) {
            const dialogRef = this._hlmDialogService.open(ErrorDialogComponent, {
                context: {
                    error: error,
                },
            });
        }
        // Redirect error, in case other components need it
        return throwError(() => error);
      })
    );
  }

  private getBaseUrl(): string {
    const config = localStorage.getItem('config');
    if (config) {
      try {
        const parsedConfig = JSON.parse(config);
        return parsedConfig.api?.baseUrl || '';
      } catch {
        console.error('Faulty config in local storage. Unabel to retrieve baseUrl.');
      }
    }
    return '';
  }

  private isServerError(error: any, baseurl: string): boolean {
    return (
      error instanceof HttpErrorResponse &&
      error.url?.startsWith(baseurl) 
    );
  }
}
