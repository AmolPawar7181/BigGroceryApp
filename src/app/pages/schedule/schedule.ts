import { Component, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonRouterOutlet, Platform, ModalController } from '@ionic/angular';

import { UserData } from '../../providers/user-data';
import { ProductData } from '../../providers/product-data';
import { ModelService } from '../../providers/models/model-service';
import { CartService } from '../../providers/cart-service';
import { HomePageData } from '../../interfaces/product-options';
import { AdminData } from '../../providers/admin-data';
import { SpeakerListPage } from '../speaker-list/speaker-list';

@Component({
  selector: 'page-schedule',
  templateUrl: 'schedule.html',
  styleUrls: ['./schedule.scss'],
})
export class SchedulePage implements OnInit {
  userId: any;
  slideOpts = {
    speed: 400,
    slidesPerView: 2,
    autoplay: true,
    spaceBetween: 10
  };
  newArrivalSlidesOpts = {
    speed: 400,
    slidesPerView: 2,
    autoplay: {
      reverseDirection: true
    },
    spaceBetween: 10,
    zoom: {
      maxRatio: 5,
    }
  };

  isAdmin: boolean;
  backBtnSub: any;
  homePageData: HomePageData = {
    firstCarousel: '',
    secondCarousel: '',
    showCategorys: '',
    showBrands: '',
  };
  slideOptsOne = {
    initialSlide: 0,
    slidesPerView: 1,
    autoplay: true,
  };
  bestSellers: any = [];
  newArrivals: any = [];
  catExpanded = false;
  brandExpanded = false;

  constructor(
    public router: Router,
    public routerOutlet: IonRouterOutlet,
    public user: UserData,
    public product: ProductData,
    public modelService: ModelService,
    public cartService: CartService,
    public platform: Platform,
    public adminData: AdminData,
    public modalCtrl: ModalController,
  ) {}

  ngOnInit() {
    // console.log('ngOnInit');
    this.setUserId('ngOnInit');
    this.setIsAdmin();
    this.getHomePage();
    this.setFilterData();
    this.setAllowedZipCodes();
    this.setPayData();
    this.getBestSeller();
    this.getNewArrivals();
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter');
    this.setIsAdmin();
    this.getUserData();
  }

  viewAll() {
    this.router.navigateByUrl('/app/tabs/allproducts');
  }

  setExtend(area: any) {
    this[area] = !this[area];
  }

  getBestSeller() {
    /* get values from local storage */
    this.product.getBestSellers().then((value: any) => {
      if (value && value.success) {
        this.bestSellers = value.products;
      }
    });

    this.product.getBestSellersData().subscribe((value: any) => {
      if (value.success) {
        this.bestSellers = value.products;
      } else {
        this.modelService.presentToast(value.msg, 2000, 'danger');
      }
      this.product.setBestSellers(value);
    });
    this.getUserData();
  }

  getNewArrivals() {

    /* get values from local storage */
    this.product.getNewArrival().then((value: any) => {
      if (value && value.success) {
        this.newArrivals = value.products;
      }
    });

    this.product.getProductsByNumber('0', '').subscribe((data: any) => {
      if (data.success) {
        if (data.products.length > 0) {
          this.newArrivals = data.products.slice(0, 10);
          this.product.setNewArrival(data);
          console.log('this.newArrivals ', this.newArrivals);
        } else {
          this.modelService.presentToast('No products found', 3000, 'danger');
        }
      } else {
        this.modelService.presentToast(data.msg, 3000, 'danger');
    }
    });
  }


  addToCart(product: any) {
    // console.log('addtocart ', product);
    if (this.userId) {
    this.modelService.presentLoading('Please wait...');
    this.product.addToCart(this.userId, product.productId).subscribe((cart: any) => {
      this.modelService.dismissLoading();
      if (cart.length > 0) {
        // console.log(this.products);
        // console.log(pos);
        product.addedTocart = true;
        if (product.count) {
          product.count++;
        } else {
          product.count = 1;
        }
        this.product.setCartEvent();
        this.cartService.addCartItemCount(cart.length);
        // this.setProductsById(cart);
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
        // this.setProductsById(cartDetails.data);
        // this.checkRemovedItems(productId, cartDetails.data);
        this.product.setCart(cartDetails);
      } else {
      //  this.cartItems = [];
      //  this.total = 0;
       // this.checkRemovedItems(productId, 'empty');
       this.cartService.addCartItemCount(0);
       this.product.setCart(cartDetails);
       if (cartDetails.msg !== 'Cart is empty') {
        this.modelService.presentToast(cartDetails.msg, 1500, 'danger');
       }
      }
   });
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

  getHomePage() {
    // this.modelService.presentLoading('Loading content...');
    this.product.getHomePage().then((value: any) => {
      if (value && value.success) {
        this.homePageData.firstCarousel = value.homePage[0].content;
        this.homePageData.secondCarousel = value.homePage[1].content;
        this.homePageData.showCategorys = value.homePage[2].content;
        this.homePageData.showBrands = value.homePage[3].content;
      } else {
        this.modelService.presentLoading('Loading content...');
      }
    });

    this.product.getHomePageData().subscribe((data: any) => {
      this.modelService.dismissLoading();
      if (data.success) {
        this.homePageData.firstCarousel = data.homePage[0].content;
        this.homePageData.secondCarousel = data.homePage[1].content;
        this.homePageData.showCategorys = data.homePage[2].content;
        this.homePageData.showBrands = data.homePage[3].content;
      } else {
        this.modelService.presentToast(data.msg, 2000, 'danger');
      }
      this.product.setHomePage(data);
    });
  }

  setIsAdmin() {
    this.user.getIsAdmin().subscribe((isAdmin: boolean) => {
      this.isAdmin = isAdmin;
    });
  }

  getUserData() {
    // console.log('getUserData called');
    this.user.getUserData().then((user: any) => {
      // console.log('getUserData user, ', user);
      if (user) {
        this.userId = user.userId;

        /* check in localStorage */
        this.product.getCart()
            .then((cart: any) => {
              if (cart) {
                if (cart.msg === 'Cart is empty') {
                  this.bestSellers.forEach((product: any) => {
                    product.addedTocart = false;
                    product.count = 0;
                  });
                  this.newArrivals.forEach((product: any) => {
                    product.addedTocart = false;
                    product.count = 0;
                  });
                  return;
                }
                /* if exists localStorage */
                if (cart.data && cart.data.length > 0) {
                  this.setAddedToCart(cart.data, this.bestSellers);
                  this.setAddedToCart(cart.data, this.newArrivals);
                  }
              } else {
                  /* else */
                  // if (!cart.success) {
                    this.cartService
                        .getCartDetails(user.userId)
                        .subscribe((cartDetails: any) => {
                          this.product.setCart(cartDetails);
                          if (cartDetails.data && cartDetails.data.length > 0) {
                            this.setAddedToCart(cartDetails.data, this.bestSellers);
                            this.setAddedToCart(cartDetails.data, this.newArrivals);
                            this.cartService.addCartItemCount(cartDetails.data.length);
                          }
                        });
                  // }
                }
            });
      }
    });
  }

  setAddedToCart(cartData: any, bestSellers: any) {
    console.log('cartData ', cartData);
    console.log('bestSellers ', bestSellers);
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < cartData.length; i++) {
      bestSellers.map((product: any) => {
        if (product.productId === cartData[i].productId) {
          product.addedTocart = true;
          product.count = cartData[i].count;
        }
      });
    }
  }

  setUserId(from: any) {
    this.user.getUserId().subscribe((userId) => {
      if (userId) {
        this.userId = userId;
      } else {
        this.userId = null;
      }
    });
  }

  setFilterData() {
    this.product.getAllFilters().subscribe((filters: any) => {
      this.product.setFiltersData(filters);
    });
  }

  setAllowedZipCodes() {
    this.user.getZipCodes().subscribe((codes: any) => {
      this.user.setZipCodes(codes);
    });
  }

  setPayData() {
    this.adminData.getPayMethodData().subscribe((data: any) => {
      this.adminData.setPayData(data);
    });
  }
}
