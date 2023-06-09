import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
// import { map } from 'rxjs/operators';
// import 'rxjs/add/operator/map';
import { map, catchError } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { backEnd } from '../providers/env';

export interface Product {
    id: number;
    name: string;
    price: number;
    amount: number;
  }

@Injectable({
    providedIn: 'root'
  })

export class CartService {
  data: Product[] = [];
  private cart = [];
  private cartItemCount = new BehaviorSubject(0);
  private cartItems = new BehaviorSubject([]);
  private deletedProductId = new BehaviorSubject('');

  constructor(public http: HttpClient) {
  }

  sendSms(phone: number, total: any) {
    const authKey = '330924AOYrvKtEDD5ed4de52P1';

    const message = `Order placed: Your order worth Rs.${total} has beed received.`;
    const encodesMsg = encodeURIComponent(message);

    const url = `https://cors-anywhere.herokuapp.com/http://vtermination.com/api/sendhttp.php?authkey=${authKey}&mobiles=${phone}&message=${encodesMsg}&sender=GROAPP&route=4&response=json`;

    return this.http.get(url).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        const res = {
          success: false,
          msg: err.error.msg||
          'Something went wrong, Please check internet connection',
        };
        return of(res);
      })
    );
  }

  addSaveForLater(userId: any, productId: any) {
    return this.http.get(`${backEnd}/addSaveForLater?userId=${userId}&productId=${productId}`).pipe(
        map((res: any) => {
            return res;
        }),
        catchError((err) => {
          const res = {
            success: false,
            msg:
              err.error.msg ||
              'Something went wrong, Please check internet connection',
          };
          return of(res);
        })
      );
  }

  removeSaveForLater(userId: any, saveId: any) {
    return this.http.get(`${backEnd}/removeSaveForLater?userId=${userId}&saveId=${saveId}`).pipe(
        map((res: any) => {
            return res;
        }),
        catchError((err) => {
          const res = {
            success: false,
            msg:
              err.error.msg ||
              'Something went wrong, Please check internet connection',
          };
          return of(res);
        })
      );
  }

  getSaveForLater(userId: any) {
    return this.http.get(`${backEnd}/getSaveForLater?userId=${userId}`).pipe(
        map((res: any) => {
            return res;
        }),
        catchError((err) => {
          const res = {
            success: false,
            msg:
              err.error.msg ||
              'Something went wrong, Please check internet connection',
          };
          return of(res);
        })
      );
  }

  getCartDetails(userId: any) {
    return this.http.post(`${backEnd}/getCartDetails?userId=${userId}`, '').pipe(
        map((res: any) => {
            return res;
        }),
        catchError((err) => {
          const res = {
            success: false,
            msg:
              err.error.msg ||
              'Something went wrong, Please check internet connection',
          };
          return of(res);
        })
      );
  }

  addToCart(userId: any, productId: any) {
    return this.http
      .post(`${backEnd}/addToCart?userId=${userId}&productId=${productId}`, '')
      .pipe(
        map((res) => {
          return res;
        }),
        catchError((err) => {
          const res = {
            success: false,
            msg:
              err.error.msg ||
              'Something went wrong, Please check internet connection',
          };
          return of(res);
        })
      );
  }

  removeFromCart(userId: any, productId: any, count: any) {
    return this.http
      .post(`${backEnd}/removefromCart?userId=${userId}&productId=${productId}&count=${count}`, '')
      .pipe(
        map((res) => {
          return res;
        }),
        catchError((err) => {
          const res = {
            success: false,
            msg:
              err.error.msg ||
              'Something went wrong, Please check internet connection',
          };
          return of(res);
        })
      );
  }

  placeOrder(order: any) {
    return this.http
      .post(`${backEnd}/addOrder`, order)
      .pipe(
        map((res) => {
          return res;
        }),
        catchError((err) => {
          const res = {
            success: false,
            msg:
              err.error.msg ||
              'Something went wrong, Please check internet connection',
          };
          return of(res);
        })
      );
  }

  addCartItemCount(count?: any) {
    // console.log('cart-service count ', count);
    const increaseCount = count;
    this.cartItemCount.next(increaseCount);
  }

  getCartItemCount() {
    return this.cartItemCount;
  }

  addCartItemsByProductId(product: any) {
    this.cartItems.next([...this.cartItems.value, product]);
  }

  addCartItemsByProduct(product: any, index?: any) {
    if (index === 0) {
      this.cartItems.next([]);
    }
    this.cartItems.next([...this.cartItems.value, product]);
  }

  getCartItemsByProductId() {
    return this.cartItems;
  }

  addDeletedProId(productId: any) {
    this.deletedProductId.next(productId);
  }

  getDeletedProId() {
    return this.deletedProductId;
  }

}
