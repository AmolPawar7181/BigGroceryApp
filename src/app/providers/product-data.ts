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

  getHomePageData() {
    return this.http
      .get(`${backEnd}/getHomePageData`)
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

  addBrand(brandData: any) {
    return this.http.post(`${backEnd}/addBrand`, brandData, this.httpHeader)
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

  addUpiData(upiData: any) {
    return this.http.post(`${backEnd}/addUpiData`, upiData)
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

  addCategory(categoryData: any) {
    return this.http.post(`${backEnd}/addCategory`, categoryData, this.httpHeader)
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

  getProductsByCatBrand(filterBy: any, field: any, productNo: any, last: any) {
    const data = {
      productNo,
      last,
      field,
      filterBy
    };
    return this.http.post(`${backEnd}/getProductsByCatBrand`, data).pipe(
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

  getProductsByNumber(productNo: any, last: any) {
    const data = {
      productNo,
      last
    };
    return this.http.post(`${backEnd}/getProductsByNumber`, data).pipe(
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

  updateCart(product: any) {
      // console.log('updateCart ', product);
      const newProduct = product.details ? product : this.generateProductForCart(product);
      // newProduct = this.generateProductForCart(product);
      this.getCart().then((cartDetails: any) => {
          if (cartDetails && cartDetails.success) {
              let productAvailable = cartDetails.data.find((ob: any) => ob.productId === newProduct.productId);
              if (productAvailable === undefined) {
                cartDetails.data.push(newProduct);
              } else {
                productAvailable.count = newProduct.count;
              }

              this.setCart(cartDetails);
          } else {
            // console.log('else');
            cartDetails.success = true;
            cartDetails.data = newProduct;
            this.setCart(cartDetails);
          }
      });
  }


  generateProductForCart(product: any) {
    return {
      count: product.count,
      productId: product.productId,
      details: {
        createdAt: product.createdAt,
        productNo: product.productNo,
        price: product.price,
        name: product.name,
        description: product.description,
        available: product.available,
        brand: product.brand,
        mrp: product.mrp,
        pricePerQuantity: product.pricePerQuantity,
        img: product.img,
        category: product.category
      }
    };
}
}
