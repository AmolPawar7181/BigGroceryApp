import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { UserData } from './user-data';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private userData: UserData) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if (err.status === 401) {
                // auto logout if 401 response returned from api
                this.userData.removeStorage().then();
            }

            // const error = err.error.msg;
            return throwError(err);
        }));
    }
}
