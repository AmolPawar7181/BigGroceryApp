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
export class ProductData {
  httpHeader = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };
  filtersData: any;

  constructor(public storage: Storage, public http: HttpClient) {}

  addProduct(productData: any) {
    return this.http.post(`${backEnd}/addProducts`, productData, this.httpHeader)
                .pipe(map(res => {
                 return res;
                }),
                catchError(err => {
                  const res = {
                    success: false,
                    msg: err.error.error || 'Something went wrong, Please check internet connection'
                  };
                  return of(res);
                })
                );
  }

  updateProduct(productData: any) {
    return this.http.put(`${backEnd}/updateProduct`, productData)
                .pipe(map(res => {
                 return res;
                }),
                catchError(err => {
                  const res = {
                    success: false,
                    msg: err.error.error || 'Something went wrong, Please check internet connection'
                  };
                  return of(res);
                })
                );
  }

  setAvaibility(productId: any, available: boolean) {
    const setStatus = {
      productId,
      available
    };
    return this.http.put(`${backEnd}/setAvaibility`, setStatus)
                .pipe(map(res => {
                 return res;
                }),
                catchError(err => {
                  const res = {
                    success: false,
                    msg: err.error.error || 'Something went wrong, Please check internet connection'
                  };
                  return of(res);
                })
                );
  }

  deleteProductById(productData: any) {
     return this.http.post(`${backEnd}/deleteProductById`, productData)
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

  getAllProducts() {
    return this.http.get(`${backEnd}/getProducts`).pipe(
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

  getproductBySearch(searchString: any) {
    return this.http.get(`${backEnd}/search?searchString=${searchString}`).pipe(
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

  getProductsBy(filterData: any) {
    const filters = {
      filterCategorys : filterData.filterCategorys,
      filterbrands : filterData.filterbrands
    };
    return this.http
      .post(`${backEnd}/getProductsBy`, filters)
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

  getAllFilters() {
    return this.http.get(`${backEnd}/getAllFilters`).pipe(
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

  setFiltersData(data: any) {
    this.filtersData = data;
    this.storage.set('filtersData', data);
  }

  getFiltersData() {
      return this.storage.get('filtersData').then((value) => {
        return value;
      });
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

  setCart(cart: any): Promise<any> {
    return this.storage.set('cart', cart).then(() => {
      return window.dispatchEvent(new CustomEvent('user:cartUpdated'));
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
