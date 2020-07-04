import { Component, ViewChild, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AlertController,
  IonList,
  IonRouterOutlet,
  LoadingController,
  ModalController,
  ToastController,
  Config,
  Platform,
  IonInfiniteScroll
} from '@ionic/angular';
import { FivGallery } from '@fivethree/core';

import { ScheduleFilterPage } from '../schedule-filter/schedule-filter';
import { ConferenceData } from '../../providers/conference-data';
import { UserData } from '../../providers/user-data';
import { ProductData } from '../../providers/product-data';
import { ModelService } from '../../providers/models/model-service';
import { CartService } from '../../providers/cart-service';
import { ProductAdminPage } from '../product-admin/product-admin';
import { SpeakerListPage } from '../speaker-list/speaker-list';


@Component({
  selector: 'page-session-detail',
  styleUrls: ['./session-detail.scss'],
  templateUrl: 'session-detail.html'
})
export class SessionDetailPage implements OnInit {
  // Gets a reference to the list element
  @ViewChild('scheduleList', { static: true }) scheduleList: IonList;
  @ViewChild('gallery', { static: true }) gallery: FivGallery;
  @ViewChild(IonInfiniteScroll, {static: true}) infiniteScroll: IonInfiniteScroll;

  dayIndex = 0;
  queryText = '';
  segment = 'all';
  excludedFilterNames: any = [{filterCategorys: []}, {filterbrands: []}];
  shownSessions: any = [];
  shownProducts: any = [];
  groups: any = [];
  products: any = [];
  confDate: string;
  showSearchbar: boolean;
  userId: any;
  slideOpts = {
    initialSlide: 1,
    speed: 400
  };
  isAdmin: boolean;
  backBtnSub: any;
  lastProduct: any;
  productNo = 0;
  filterBy: any;
  field: any;
  cartproducts = [];

  constructor(
    public alertCtrl: AlertController,
    public confData: ConferenceData,
    public loadingCtrl: LoadingController,
    public modalCtrl: ModalController,
    public router: Router,
    public routerOutlet: IonRouterOutlet,
    public toastCtrl: ToastController,
    public user: UserData,
    public config: Config,
    public product: ProductData,
    public modelService: ModelService,
    public cartService: CartService,
    public platform: Platform,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.getUserData();
    this.setUserId('ngOnInit');
    this.setIsAdmin();

    this.filterBy = this.route.snapshot.paramMap.get('filterBy');
    this.field = this.route.snapshot.paramMap.get('field');

    this.loadInitialData();
    this.getCartData();
    this.listenRemoveFromCart();
  }

  ionViewWillEnter() {
    this.setIsAdmin();
  }

  setIsAdmin() {
    this.user.getIsAdmin().subscribe((isAdmin: boolean) => {
      this.isAdmin = isAdmin;
    });
  }

  getCartData() {
    this.cartService.getCartItemsByProductId().subscribe((products) => {
      // console.log('subscribe to cart products ', products);
      if (products.length > 0) {
        this.cartproducts = products;
        this.mapCartDataToProducts();
      }
    });
  }

  listenRemoveFromCart() {
    this.cartService.getDeletedProId().subscribe((productId) => {
      // console.log('subscribe to remove ', productId);
      if (productId) {
        const productAvailable = this.products.find((ob: any) => ob.productId === productId);
        if (productAvailable !== undefined) {
          productAvailable.addedTocart = false;
          productAvailable.count = 0;
        }
      }
    });
  }

  // addToCart(productId: any) {
  //   if (this.userId) {
  //   this.modelService.presentLoading('Please wait...');
  //   this.product.addToCart(this.userId, productId).subscribe((cart: any) => {
  //     this.modelService.dismissLoading();
  //     if (cart.length > 0) {
  //       this.product.setCartEvent();
  //       this.cartService.addCartItemCount(cart.length);
  //     } else {
  //       if (!cart.success) {
  //         this.modelService.presentToast(cart.msg, 3000, 'danger');
  //       }
  //     }
  //   });
  //  } else {
  //    this.modelService.presentToast('Please login to add item to cart', 2000, 'danger');
  //    setTimeout(() => {
  //     this.router.navigate(['login']);
  //    }, 2000);
  //  }
  // }

  addToCart(product: any, pos: any) {
    if (this.userId) {
    this.modelService.presentLoading('Please wait...');
    this.product.addToCart(this.userId, product.productId).subscribe((cart: any) => {
      this.modelService.dismissLoading();
      if (cart.length > 0) {
        this.products[pos].addedTocart = true;
        if (this.products[pos].count) {
          this.products[pos].count++;
        } else {
          this.products[pos].count = 1;
        }
        this.product.setCartEvent();
        this.cartService.addCartItemCount(cart.length);
        this.setProductsById(cart);
        this.product.updateCart(product);
      } else {
        if (!cart.success) {
          this.modelService.presentToast(cart.msg, 3000, 'danger');
        }
      }
    });
   } else {
     this.modelService.presentToast('Please login to add item to cart', 2000, 'danger');
     setTimeout(() => {
      this.router.navigate(['login']);
     }, 2000);
   }
  }

  removeFromCart(productId: any, count: any, pos: any) {
    this.modelService.presentLoading('Please wait...');
    this.cartService.removeFromCart(this.userId, productId, count)
    .subscribe((cartDetails: any) => {
      this.modelService.dismissLoading();
      if (cartDetails.success) {
        this.cartService.addCartItemCount(cartDetails.data.length);
        this.setProductsById(cartDetails.data);
        this.checkRemovedItems(productId, cartDetails.data);
        this.product.setCart(cartDetails);
      } else {
      //  this.cartItems = [];
      //  this.total = 0;
       this.checkRemovedItems(productId, 'empty');
       this.cartService.addCartItemCount(0);
       this.product.setCart(cartDetails);
       if (cartDetails.msg !== 'Cart is empty') {
        this.modelService.presentToast(cartDetails.msg, 1500, 'danger');
       }
      }
   });
  }

  setProductsById(cartDetails: any) {
    // console.log('setProductsById ', cartDetails);
    if (cartDetails[0].data) {
      // console.log('cartDetails.data ', cartDetails.data);
      for (let i = 0; i < cartDetails.length; i++) {
         if (this.cartproducts.length > 0) {
          if (this.cartproducts.indexOf(cartDetails[i].id) !== -1) {
            // console.log('if ', cartDetails);
            const product = {
              id: cartDetails[i].id,
              count: cartDetails[i].data.count
            };
            this.cartService.addCartItemsByProductId(product);
          } else {
            // console.log('else ', cartDetails);
            const productAvailable = this.products.find((ob: any) => ob.productId === cartDetails[i].id);
            if (productAvailable !== undefined) {
              productAvailable.count = cartDetails[i].data.count;
            }

          }
        } else {
          const product = {
            id: cartDetails[i].id,
            count: cartDetails[i].data.count
          };
          this.cartService.addCartItemsByProductId(product);
        }
      }
    } else {
      // console.log('else this.cartproducts ', this.cartproducts);
      for (let i = 0; i < cartDetails.length; i++) {
       if (this.cartproducts.length > 0) {
        const isNotPresent = this.cartproducts.find(ob => ob.id === cartDetails[i].productId);
        // console.log('isNotPresent ', isNotPresent);

        if (isNotPresent === undefined) {
          const product = {
            id: cartDetails[i].productId,
            count: cartDetails[i].count
          };
          this.cartService.addCartItemsByProductId(product);
       } else {
         // console.log('else products ', this.products);
         const productAvailable = this.products.find((ob: any) => ob.productId === cartDetails[i].productId);
         // console.log('productAvailable ', productAvailable);
         if (productAvailable !== undefined) {
            productAvailable.count = cartDetails[i].count;
            productAvailable.addedTocart = true;
            // console.log('productAvailable ', productAvailable);
         }
         isNotPresent.count = cartDetails[i].count;
         isNotPresent.addedTocart = true;
         // console.log('else else ', isNotPresent.count, cartDetails[i].count, this.cartproducts);
       }
      } else {
        const product = {
          id: cartDetails[i].productId,
          count: cartDetails[i].count
        };
        this.cartService.addCartItemsByProductId(product);
      }
     }
    }
  }

  mapCartDataToProducts() {
    // console.log('mapdata ', this.cartproducts);
    this.cartproducts.forEach((product: any) => {
      const productAvailable = this.products.find((ob: any) => ob.productId === product.id);
      if (productAvailable !== undefined) {
        productAvailable.addedTocart = true;
        productAvailable.count = product.count;
      }
    });
  }

  checkRemovedItems(productId: any, newArr: any) {
    // newArr will have empty value when cart is empty
    if (newArr !== 'empty') {
      newArr.forEach((element: any) => {
        const product = {
          id: element.productId,
          count: element.count
        };

        const cartAvailable = this.cartproducts.find((ob: any) => ob.id === element.productId);
        const productAvailable = this.products.find((ob: any) => ob.productId === element.productId);
        // console.log(cartAvailable, productAvailable);
        if (cartAvailable !== undefined) {
          if (productAvailable !== undefined) {
            productAvailable.count = element.count;
          }
          cartAvailable.count = element.count;
        } else {
          this.cartService.addCartItemsByProduct(product);
        }
      });
      // will check if product is deleted from cart
      if (!newArr.some((obj: any) => obj.productId === productId)) {
        // console.log(productId, 'not found');
        this.triggerDeleteEvent(productId);
      }
    } else {
      this.cartproducts = [];
      this.triggerDeleteEvent(productId);
    }
  }

  triggerDeleteEvent(productId: any) {
    this.cartService.addDeletedProId(productId);
  }

  deleteProduct(product: any) {

    this.modelService.presentConfirm('Are you sure', 'You want to delete', 'No', 'Yes')
        .then(res => {
          if (res === 'ok') {
            const imgData = product.img.map((img: any) => {
              const link = img.split('/o/').pop();
              return link.substr(0, link.indexOf('?'));
            });

            const productData = {productId: product.productId, img: imgData};
            this.modelService.presentLoading('Please wait...');
            this.product.deleteProductById(productData)
                .subscribe((response: any) => {
                  this.modelService.dismissLoading();
                  if (response.success) {
                    const newProducts = this.products
                                        .filter((c: any) => {
                                        if ( c.productId !== product.productId) {
                                                  return c;
                                          }
                                        });
                    this.products = newProducts;
                    this.modelService.presentToast(response.msg, 2000, 'success');
                  } else {
                    this.modelService.presentToast(response.msg, 2000, 'danger');
                  }
                });
          }
        });

    // Close any open sliding items when the schedule updates
    this.closeSlidingItems();
  }

  loadData(event: any) {

    // this.modelService.presentLoading('Please wait...');
    this.product.getProductsByCatBrand(this.filterBy, this.field, this.productNo, this.lastProduct).subscribe((data: any) => {
      // this.modelService.dismissLoading();
      if (event) {
        event.target.complete();
      }

      if (data.success) {
        this.products.push.apply(this.products, data.products);
        if (data.last.productNo > 1) {
          this.lastProduct = data.last;
        } else {
          // will disable the infinite scroll
          event.target.disabled = true;
        }
      } else {
        // this will disable infinite scroll
        if (data.msg === 'No products found') {
          event.target.disabled = true;
        }
        this.modelService.presentToast(data.msg, 3000, 'danger');
      }
    });
  }

  loadInitialData(event?: any) {
    // Close any open sliding items when the schedule updates
    this.closeSlidingItems();
    // enable infinite scroll
    this.enableInfiniteScroll();
    this.modelService.presentLoading('Please wait...');
    this.product.getProductsByCatBrand(this.filterBy, this.field, '0', this.lastProduct)
        .subscribe((data: any) => {
          this.modelService.dismissLoading();
          if (event) {
            event.target.complete();
          }

          if (data.success) {
            this.products = data.products;
            this.lastProduct = data.last;
            this.productNo++;
            this.mapCartDataToProducts();
          } else {
            this.modelService.presentToast(data.msg, 3000, 'danger');
          }
    });
  }

  setAvaibility(product: any) {
    const avaibility = product.available ? false : true;
    // Close any open sliding items when the schedule updates
    this.closeSlidingItems();

    this.modelService.presentLoading('Please wait...');
    this.product.setAvaibility(product.productId, avaibility)
        .subscribe((res: any) => {
          this.modelService.dismissLoading();
          if (res.success) {
            product.available = avaibility;
            this.modelService.presentToast(res.msg, 3000, 'success');
          } else {
            this.modelService.presentToast(res.msg, 3000, 'danger');
          }
        });
  }

  searchProduct(value: any) {
    this.modelService.presentLoading('Please wait...');
    this.product.getproductBySearch(value).subscribe((response: any) => {
      this.modelService.dismissLoading();
      if (response.data.length > 0) {
        this.products = response.data;
      } else {
        if (!response.success) {
          this.modelService.presentToast(response.msg, 3000, 'danger');
        } else {
          this.modelService.presentToast('No products found', 3000, 'danger');
        }
      }
    });
  }

  cancelSearch() {
    this.showSearchbar = false;
    this.queryText = '';
  }

  onImageOpen() {
    this.backBtnSub = this.platform.backButton.subscribeWithPriority(1, () => {
      this.closeImagePopup();
    });
  }

  onImageClose() {
    this.backBtnSub.unsubscribe();
  }

  closeImagePopup() {
    this.gallery.close();
  }

  fivOpen() {
    if (!window.history.state.modal) {
      const modalState = {modal: true};
      history.pushState(modalState, null);
    }
  }

  // getUserData() {
  //   this.user.getUserData().then((user: any) => {
  //     if (user) {
  //       this.userId = user.userId;
  //       this.cartService
  //         .getCartDetails(user.userId)
  //         .subscribe((cartDetails: any) => {
  //           if (cartDetails.data && cartDetails.data.length > 0) {
  //             this.product.setCart(cartDetails.data);
  //             this.cartService.addCartItemCount(cartDetails.data.length);
  //             this.setProductsById(cartDetails.data);
  //           }
  //         });
  //     }
  //   });
  // }

  getUserData() {
    this.user.getUserData().then((user: any) => {
      if (user) {
        this.userId = user.userId;
        /* check in localStorage */
        this.product.getCart()
            .then((cart: any) => {
              /* if exists localStorage */
              if (cart.data && cart.data.length > 0) {
                  this.cartService.addCartItemCount(cart.data.length);
                  this.setProductsById(cart.data);
                } else {
                  /* else */
                  if (!cart.success) {
                    this.cartService
                      .getCartDetails(user.userId)
                      .subscribe((cartDetails: any) => {
                        // console.log('cartDetails ', cartDetails);
                        if (cartDetails.data && cartDetails.data.length > 0) {
                          this.product.setCart(cartDetails.data);
                          this.cartService.addCartItemCount(cartDetails.data.length);
                          this.setProductsById(cartDetails.data);
                        }
                      });
                  }
                }
            });
      }
    });
  }

  setUserId(from: any) {
    this.user.getUserId()
      .subscribe((userId) => {
        if (userId) {
         this.userId = userId;
        } else {
          this.userId = null;
        }
    });
  }

  async presentDetails(productDetails: any) {
    const userId = this.userId;
    const modal = await this.modalCtrl.create({
      component: SpeakerListPage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { productDetails, userId },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {

    }
  }

  async presentFilter() {

    const modal = await this.modalCtrl.create({
      component: ScheduleFilterPage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { excludeProducts: this.excludedFilterNames },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {

      // this.excludeTracks = data;
      const catLength = data.filterCategorys.length;
      const brandLength = data.filterbrands.length;

      if (catLength > 0 || brandLength > 0) {
      this.excludedFilterNames[0].filterCategorys = data.filterCategorys;
      this.excludedFilterNames[1].filterbrands = data.filterbrands;
      this.modelService.presentLoading('Please wait...');
      this.product.getProductsBy(data)
          .subscribe((products: any) => {
            this.modelService.dismissLoading();
            if (products.length > 0) {
              this.products = products;
            } else {
              if (!products.success) {
                this.modelService.presentToast(data.msg, 3000, 'danger');
              }
            }
          });
        }
    }

    // Close any open sliding items when the schedule updates
    this.closeSlidingItems();
  }

  enableInfiniteScroll() {
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
  }

  closeSlidingItems() {
    if (this.scheduleList) {
      this.scheduleList.closeSlidingItems();
    }
  }

  async presentProductAdmin(product: any) {

    const modal = await this.modalCtrl.create({
      component: ProductAdminPage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { productDetails: product },
    });
    await modal.present();
    // Close any open sliding items when the schedule updates
    this.closeSlidingItems();
  }

}
