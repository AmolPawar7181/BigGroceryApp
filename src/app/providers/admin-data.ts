import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
// import { map } from 'rxjs/operators';
// import 'rxjs/add/operator/map';
import { map, catchError } from 'rxjs/operators';
import {backEnd} from './env';
@Injectable({
  providedIn: 'root',
})
export class AdminData {
  httpHeader = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  constructor(public storage: Storage, public http: HttpClient) {}

  addHomeData(data: any) {
    return this.http
      .post(`${backEnd}/addHomeData`, data)
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

  deleteFromHome(module: any, content: any) {
    return this.http
    .put(`${backEnd}/deleteFromHome?module=${module}&content=${content}`, '')
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

  getHomePageData() {
    return this.http
      .get(`${backEnd}/getHomePage`)
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

  messageUser(data: any) {
    return this.http
      .put(`${backEnd}/setOrderMsg`, data)
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

  getStoreData(): any {
      return this.http
        .get('assets/data/store.json')
        .pipe(
          map((res) => {
            return res;
          })
        );
  }

  getRazorData(): any {
    // return this.http
    //   .get('assets/data/razorpay.json')
    //   .pipe(
    //     map((res) => {
    //       return res;
    //     })
    //   );

      return this.http
      .get(`${backEnd}/getrezData`)
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

  getOrdersByDate(fromDate: any, toDate: any, status: any) {
    return this.http
      .get(`${backEnd}/getOrdersByDate?fromDate=${fromDate}&toDate=${toDate}&status=${status}`)
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

  getActiveOrders() {
    return this.http
      .get(`${backEnd}/getActiveOrders`)
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

  getOrdersByStatus(status: any) {
    return this.http
      .get(`${backEnd}/getOrdersByStatus?status=${status}`)
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

  setOrderStatus(status: any, orderId: any) {
    return this.http
      .put(`${backEnd}/setOrderStatus?status=${status}&orderId=${orderId}`, '')
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



   addProductImage(formData: any) {
    return this.http
      .post(`${backEnd}/addProductImage`, formData)
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

  setCart(cart: any): Promise<any> {
    return this.storage.set('cart', cart).then(() => {
      return window.dispatchEvent(new CustomEvent('user:cartUpdated'));
    });
  }

  setRezData(rezdata: any) {
    return this.storage.set('rezData', rezdata);
  }

  getRezData() {
    return this.storage.get('rezData').then((value) => {
      return value;
    });
  }

  setCartEvent() {
    return window.dispatchEvent(new CustomEvent('user:cartUpdated'));
  }

  getCart(): Promise<string> {
    return this.storage.get('cart').then((value) => {
      return value;
    });
  }

  removeCart(): Promise<any> {
    return this.storage.remove('cart');
  }
}
