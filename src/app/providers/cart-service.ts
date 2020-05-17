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

  constructor(public http: HttpClient) {
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
              err.error.error ||
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
              err.error.error ||
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
              err.error.error ||
              'Something went wrong, Please check internet connection',
          };
          return of(res);
        })
      );
  }

  placeOrder(oreder: any) {
    return this.http
      .post(`${backEnd}/addOrder`, oreder)
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

  addCartItemCount(count?: any) {
    console.log('cart-service count ', count);
    const increaseCount = count;
    this.cartItemCount.next(increaseCount);
  }

  getCartItemCount() {
    return this.cartItemCount;
  }
}
