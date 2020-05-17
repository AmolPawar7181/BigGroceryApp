import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {backEnd} from './env';

@Injectable({
  providedIn: 'root',
})
export class UserData {
  httpHeader = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  favorites: string[] = [];
  HAS_LOGGED_IN = 'hasLoggedIn';
  HAS_SEEN_TUTORIAL = 'hasSeenTutorial';
  public userId = new BehaviorSubject(null);
  public isAdmin = new BehaviorSubject(false);

  constructor(public storage: Storage, public http: HttpClient) {}

  hasFavorite(sessionName: string): boolean {
    return this.favorites.indexOf(sessionName) > -1;
  }

  addFavorite(sessionName: string): void {
    this.favorites.push(sessionName);
  }

  removeFavorite(sessionName: string): void {
    const index = this.favorites.indexOf(sessionName);
    if (index > -1) {
      this.favorites.splice(index, 1);
    }
  }

  sendOTP(phone: number): Promise<any> {
    const otp = Math.floor(1000 + Math.random() * 9000);
    return this.storage.set('otp', otp);
    // const apiKey = 'YEEIqHvOpDk-aKTD4KGyqhuZImjTnPLxah98P6OMdd';
    // const message = `Please use ${otp} to verify phone number`;

    // const url = `https://api.textlocal.in/send/?apikey=${apiKey}&numbers=91${phone}&message=${message}&sender=TXTLCL`;
    // this.http.get(url)
    //     .subscribe(res => {
    //       console.log(JSON.stringify(res));
    //     });
    // return;
  }

  getOTP(): Promise<number> {
    return this.storage.get('otp').then((value) => {
      return value;
    });
  }

  removeOTP(): Promise<any> {
    return this.storage.remove('otp');
  }

  getData() {
    return this.http.get(`${backEnd}/getProductImage`).pipe(
      map((res) => {
        return res;
      })
    );
  }

  getUserHistory(userId: any) {
    return this.http.get(`${backEnd}/getPurchaseHistory?userId=${userId}`).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        const res = {
          success: false,
          msg: err.error.error,
        };
        return of(res);
      })
    );
  }


  login(userData: any) {
    return this.http.post(`${backEnd}/login`, userData, this.httpHeader).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        const res = {
          success: false,
          msg: err.error.error||
          'Something went wrong, Please check internet connection'
        };
        return of(res);
      })
    );
  }

  signup(userData: any) {
    console.log('signup ', userData);
    return this.http
      .post(`${backEnd}/addUser`, userData, this.httpHeader)
      .pipe(
        map((res) => {
          return res;
        }),
        catchError((err) => {
          const res = {
            success: false,
            msg:
              err.error.error ||
              'Something went wrong, Please check internet connection',
          };
          return of(res);
        })
      );
    // return resData;
    // this.http.post(this.url,)
    // return this.storage.set(this.HAS_LOGGED_IN, true).then(() => {
    //   this.setUsername(username);
    //   return window.dispatchEvent(new CustomEvent('user:signup'));
    // });
  }

  logout(): Promise<any> {
    return this.storage
      .remove(this.HAS_LOGGED_IN)
      .then(() => {
        this.setUserId(null);
        this.isAdmin.next(false);
        return this.storage.remove('userdata');
      })
      .then(() => {
        window.dispatchEvent(new CustomEvent('user:logout'));
      });
  }

  setIsAdmin() {
    this.getUserData().then((value: any) => {
      console.log('value ', value);
      if (value) {
        if (value.role === 1) {
          this.isAdmin.next(true);
        } else {
          this.isAdmin.next(false);
        }
      } else {
        this.isAdmin.next(false);
      }
    });
  }

  getIsAdmin() {
    return this.isAdmin;
  }

  setUserId(id: any) {
    this.userId.next(id);
  }

  getUserId() {
    return this.userId;
  }

  setUserData(userdata: any): Promise<any> {
    return this.storage.set(this.HAS_LOGGED_IN, true).then(() => {
      this.storage.set('userdata', userdata).then(() => {
        this.setUserId(userdata.userId);
        this.setIsAdmin();
      });
      return window.dispatchEvent(new CustomEvent('user:login'));
    });
  }

  getUserData(): Promise<string> {
    return this.storage.get('userdata').then((value) => {
      return value;
    });
  }

  isLoggedIn(): Promise<boolean> {
    return this.storage.get(this.HAS_LOGGED_IN).then((value) => {
      return value === true;
    });
  }

  checkHasSeenTutorial(): Promise<string> {
    return this.storage.get(this.HAS_SEEN_TUTORIAL).then((value) => {
      return value;
    });
  }
}
