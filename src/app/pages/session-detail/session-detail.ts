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
  }

  ionViewWillEnter() {
    this.setIsAdmin();
  }

  setIsAdmin() {
    this.user.getIsAdmin().subscribe((isAdmin: boolean) => {
      this.isAdmin = isAdmin;
    });
  }

  addToCart(productId: any) {
    if (this.userId) {
    this.modelService.presentLoading('Please wait...');
    this.product.addToCart(this.userId, productId).subscribe((cart: any) => {
      this.modelService.dismissLoading();
      if (cart.length > 0) {
        this.product.setCartEvent();
        this.cartService.addCartItemCount(cart.length);
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

  getUserData() {
    this.user.getUserData().then((user: any) => {
      if (user) {
        this.userId = user.userId;
        this.cartService
          .getCartDetails(user.userId)
          .subscribe((cartDetails: any) => {
            if (cartDetails.data && cartDetails.data.length > 0) {
              this.product.setCart(cartDetails.data);
              this.cartService.addCartItemCount(cartDetails.data.length);
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
