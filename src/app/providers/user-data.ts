import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {backEnd} from './env';
import { HTTP } from '@ionic-native/http/ngx';

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

  constructor(public storage: Storage, public http: HttpClient, private corsHttp: HTTP) {}

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

  sendOTP(phone: number, hash: any) {
    // alert('hash ' + hash);
    const otp = Math.floor(1000 + Math.random() * 9000);
    this.storage.set('otp', otp);
    const authKey = '330924AOYrvKtEDD5ed4de52P1';

    const message = `<#> ${otp} is your 4 digit OTP for Grocery app. ${hash}`;
    const encodesMsg = encodeURIComponent(message);

    const url = `https://cors-anywhere.herokuapp.com/http://vtermination.com/api/sendhttp.php?authkey=${authKey}&mobiles=${phone}&message=${encodesMsg}&sender=GROAPP&route=4&response=json`;

    return this.http.get(url).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        const res = {
          success: false,
          msg: err.error.error||
          'Something went wrong, Please check internet connection',
        };
        return of(res);
      })
    );
  }

  async sendOtpNative(phone: number, hash: any) {
    const otp = Math.floor(1000 + Math.random() * 9000);
    this.storage.set('otp', otp);
    const authKey = '330924AOYrvKtEDD5ed4de52P1';

    const message = `<#> ${otp} is your 4 digit OTP for Grocery app. ${hash}`;
    const encodesMsg = encodeURIComponent(message);

    const url = `http://vtermination.com/api/sendhttp.php?authkey=${authKey}&mobiles=${phone}&message=${encodesMsg}&sender=GROAPP&route=4&response=json`;
    const params = {};
    const headers = {};
    this.corsHttp.setHeader('http://vtermination.com', 'Header', 'value');
    const nativeCall = this.corsHttp.get(url, params, headers);

    await from(nativeCall).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        const res = {
          success: false,
          msg: err.error.error ||
          'Something went wrong, Please check internet connection',
        };
        return of(res);
      })
    );
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
          msg: err.error.error||
          'Something went wrong, Please check internet connection',
        };
        return of(res);
      })
    );
  }


  login(userData: any) {
    return this.http.post(`${backEnd}/login`, userData).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        const res = {
          success: false,
          msg: err ||
          'Something went wrong, Please check internet connection'
        };
        return of(res);
      })
    );
  }

  checkNumber(phone: any) {
    return this.http.get(`${backEnd}/checkNumber?phone=${phone}`).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        const res = {
          success: false,
          msg: err.error.error ||
          'Something went wrong, Please check internet connection',
        };
        return of(res);
      })
    );
  }

  checkNumberForgotPass(phone: any) {
    return this.http.get(`${backEnd}/checkNumberForgotPass?phone=${phone}`).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        const res = {
          success: false,
          msg: err.error.error ||
          'Something went wrong, Please check internet connection',
        };
        return of(res);
      })
    );
  }

  changePassword(userData: any) {
    return this.http.post(`${backEnd}/changePassword`, userData).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        const res = {
          success: false,
          msg: err ||
          'Something went wrong, Please check internet connection'
        };
        return of(res);
      })
    );
  }

  signup(userData: any) {
    // console.log('signup ', userData);
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
  }

  logout(userId: any) {
    return this.http.get(`${backEnd}/logout?userId=${userId}`).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        const res = {
          success: false,
          msg: err.error.error ||
          'Something went wrong, Please check internet connection',
        };
        return of(res);
      })
    );
  }

  removeStorage(): Promise<any> {
    return this.storage
      .remove(this.HAS_LOGGED_IN)
      .then(() => {
        this.setUserId(null);
        this.isAdmin.next(false);
        this.storage.remove('userdata');
        this.storage.remove('__u_t');
      })
      .then(() => {
        window.dispatchEvent(new CustomEvent('user:logout'));
      });
  }

  setIsAdmin() {
    this.getUserData().then((value: any) => {
      // console.log('value ', value);
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

  setUserData(userdata: any, token: any): Promise<any> {
    return this.storage.set(this.HAS_LOGGED_IN, true).then(() => {
      this.storage.set('userdata', userdata).then(() => {
        this.setUserId(userdata.userId);
        this.setIsAdmin();
        this.setToken(token);
      });
      return window.dispatchEvent(new CustomEvent('user:login'));
    });
  }

  setToken(token: any) {
    this.storage.set('__u_t', token);
  }

  getToken() {
    return this.storage.get('__u_t').then((value) => {
      return value;
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


  getZipCodes() {
    return this.http.get(`${backEnd}/getZipCodes`).pipe(
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
  }

  setZipCodes(data: any) {
    this.storage.set('zipcodes', data);
  }

  getAllowedZipCodes() {
      return this.storage.get('zipcodes').then((value) => {
        return value;
      });
  }

  getSavedForLater(userId: any) {
    return this.http.get(`${backEnd}/getSavedForLater?userId=${userId}`).pipe(
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
  }
}
