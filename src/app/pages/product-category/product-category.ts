import { Component, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonList,
  IonRouterOutlet,
  LoadingController,
  ModalController,
  ToastController,
  Config,
  Platform,
  IonInfiniteScroll,
  ActionSheetController
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
  selector: 'page-schedule',
  templateUrl: 'product-category.html',
  styleUrls: ['./product-category.scss'],
})
export class ProductCategoryPage implements OnInit {
  // Gets a reference to the list element
  @ViewChild('scheduleList', { static: true }) scheduleList: IonList;
  @ViewChild('gallery', { static: true }) gallery: FivGallery;
  @ViewChild(IonInfiniteScroll, {static: false}) infiniteScroll: IonInfiniteScroll;

  ios: boolean;
  dayIndex = 0;
  queryText = '';
  segment = 'all';
  excludedFilterNames: any = [{filterCategorys: []}, {filterbrands: []}];
  // excludedFilterNames: { filterCategorys: [0], filterbrands: [0] }[] = [];
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
  cartproducts = [];
  infiniteScrollNew: any;

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
    public actionCtrl: ActionSheetController
  ) {}

  ngOnInit() {
    this.updateSchedule();
    this.getUserData();
    this.setUserId('ngOnInit');
    this.ios = this.config.get('mode') === 'ios';
    this.setIsAdmin();
    this.getCartData();
    this.listenRemoveFromCart();
  }

  ionViewWillEnter() {
    this.setIsAdmin();
    this.getUserData();
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

  createButtons(product: any) {
    const buttons = [];
    // tslint:disable-next-line: forin
    for (const index in product.quantities) {
      const button = {
        text: `${product.quantities[index].quantity} - Rs ${product.quantities[index].price}`,
        handler: () => {
          console.log('selected quantity ' + product.quantities[index].quantity);
          product.price = product.quantities[index].price;
          product.pricePerQuantity = product.quantities[index].quantity;
          return true;
        }
      };
      buttons.push(button);
    }
    return buttons;
  }

  async selectQuantity(product: any) {
    const actionSheet = await this.actionCtrl.create({
      header: `Available quantities for ${product.name}`,
      buttons: this.createButtons(product)
    });
    await actionSheet.present();
  }

  addToCart(product: any, pos: any) {
    // console.log('addtocart ', product);
    if (this.userId) {
    this.modelService.presentLoading('Please wait...');
    this.product.addToCart(this.userId, product.productId).subscribe((cart: any) => {
      this.modelService.dismissLoading();
      if (cart.length > 0) {
        // console.log(this.products);
        // console.log(pos);
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
    this.infiniteScrollNew = this.infiniteScroll;
    // console.log('this.loadData');
    // this.modelService.presentLoading('Please wait...');
    this.product.getProductsByNumber(this.productNo, this.lastProduct).subscribe((data: any) => {
      // this.modelService.dismissLoading();
      if (event) {
        event.target.complete();
      }
      if (data.success) {
        if (data.products.length > 0) {
          this.products.push.apply(this.products, data.products);
          this.mapCartDataToProducts();
          if (data.last.productNo > 1) {
            this.lastProduct = data.last;
          } else {
            // will disable the infinite scroll
            event.target.disabled = true;
          }
        } else {
          this.modelService.presentToast('No products found', 3000, 'danger');
        }
    } else {
        // will disable the infinite scroll
        event.target.disabled = true;
        this.modelService.presentToast(data.msg, 3000, 'danger');
    }
    });
  }

  updateSchedule(event?: any) {
    // Close any open sliding items when the schedule updates
    this.closeSlidingItems();

    if (event) {
      // enable infinite scroll
      this.enableInfiniteScroll();
    }
    this.product.getNewArrival().then((productsData: any) => {
        if (productsData && productsData.success) {
          if (productsData.products.length > 0) {
            this.products = [];
            this.products = productsData.products;
            this.lastProduct = productsData.last;
            this.productNo++;
            this.mapCartDataToProducts();
          }
        } else {
          this.modelService.presentLoading('Please wait...');
          this.product.getProductsByNumber('0', this.lastProduct).subscribe((data: any) => {
           this.modelService.dismissLoading();
           if (event) {
              event.target.complete();
            }
           if (data.success) {
              if (data.products.length > 0) {
                this.products = [];
                this.products = data.products;
                this.lastProduct = data.last;
                this.productNo++;
                this.mapCartDataToProducts();
              } else {
                this.modelService.presentToast('No products found', 3000, 'danger');
              }
            } else {
              this.modelService.presentToast(data.msg, 3000, 'danger');
          }
          });
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
    if (value.length > 0) {
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
    } else {
      this.updateSchedule();
    }
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

  getUserData() {
    this.user.getUserData().then((user: any) => {
      if (user) {
        this.userId = user.userId;
        /* check in localStorage */
        this.product.getCart()
            .then((cart: any) => {
              if (cart.msg === 'Cart is empty') {
                this.products.forEach((product: any) => {
                  product.addedTocart = false;
                  product.count = 0;
                });
                return;
              }
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
                          this.product.setCart(cartDetails);
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
         const productAvailable = this.products.find((ob: any) => ob.productId === cartDetails[i].productId);
         if (productAvailable !== undefined) {
            productAvailable.count = cartDetails[i].count;
            productAvailable.addedTocart = true;
         }

         isNotPresent.count = cartDetails[i].count;
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
          productAvailable.count = element.count;
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
    // console.log( this.infiniteScrollNew);
    if (this.infiniteScrollNew) {
      this.infiniteScrollNew.disabled = false;
    }

    // if (this.infiniteScroll) {
    //   console.log('enableInfiniteScroll ', this.infiniteScroll.disabled);
    //   this.infiniteScroll.disabled = false;
    //   console.log('enableInfiniteScroll after', this.infiniteScroll.disabled);
    // }
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

    // const { data } = await modal.onWillDismiss();
    // Close any open sliding items when the schedule updates
    this.closeSlidingItems();
  }

  async addFavorite(slidingItem: HTMLIonItemSlidingElement, sessionData: any) {
    if (this.user.hasFavorite(sessionData.name)) {
      // Prompt to remove favorite
      this.removeFavorite(slidingItem, sessionData, 'Favorite already added');
    } else {
      // Add as a favorite
      this.user.addFavorite(sessionData.name);

      // Close the open item
      slidingItem.close();

      // Create a toast
      const toast = await this.toastCtrl.create({
        header: `${sessionData.name} was successfully added as a favorite.`,
        duration: 3000,
        buttons: [
          {
            text: 'Close',
            role: 'cancel',
          },
        ],
      });

      // Present the toast at the bottom of the page
      await toast.present();
    }
  }

  async presentDetails(productDetails: any) {
    const userId = this.userId;
    const modal = await this.modalCtrl.create({
      component: SpeakerListPage,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { productDetails, userId },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {

    }
  }

  async removeFavorite(
    slidingItem: HTMLIonItemSlidingElement,
    sessionData: any,
    title: string
  ) {
    const alert = await this.alertCtrl.create({
      header: title,
      message: 'Would you like to remove this session from your favorites?',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            // they clicked the cancel button, do not remove the session
            // close the sliding item and hide the option buttons
            slidingItem.close();
          },
        },
        {
          text: 'Remove',
          handler: () => {
            // they want to remove this session from their favorites
            this.user.removeFavorite(sessionData.name);
            this.updateSchedule();

            // close the sliding item and hide the option buttons
            slidingItem.close();
          },
        },
      ],
    });
    // now present the alert on top of all other content
    await alert.present();
  }

  async openSocial(network: string, fab: HTMLIonFabElement) {
    const loading = await this.loadingCtrl.create({
      message: `Posting to ${network}`,
      duration: Math.random() * 1000 + 500,
    });
    await loading.present();
    await loading.onWillDismiss();
    fab.close();
  }
}
