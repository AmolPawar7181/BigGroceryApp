import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpEvent, HttpResponse, HttpRequest, HttpHandler } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { UserData } from './user-data';
import { Router } from '@angular/router';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    token = 'FDDREXGFD12458';
    constructor(private userData: UserData, private router: Router) {}
    intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        return from(this.userData.getToken())
                .pipe(
                    switchMap(token => {
                        if (token) {
                            httpRequest = httpRequest.clone({ setHeaders: {__u_t: token } });
                        } else {
                            httpRequest.clone({ setHeaders: {__u_t: 'FDDREXGFD12458' } });
                        }
                        return next.handle(httpRequest);
                    })
                );
        }

}
