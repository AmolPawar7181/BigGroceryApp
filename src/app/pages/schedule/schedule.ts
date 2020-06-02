import { Component, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonRouterOutlet,
  Platform,
} from '@ionic/angular';

import { UserData } from '../../providers/user-data';
import { ProductData } from '../../providers/product-data';
import { ModelService } from '../../providers/models/model-service';
import { CartService } from '../../providers/cart-service';
import { HomePageData } from '../../interfaces/product-options';


@Component({
  selector: 'page-schedule',
  templateUrl: 'schedule.html',
  styleUrls: ['./schedule.scss'],
})
export class SchedulePage implements OnInit {

  userId: any;
  slideOpts = {
    initialSlide: 1,
    speed: 400
  };
  isAdmin: boolean;
  backBtnSub: any;
  homePageData: HomePageData = { firstCarousel : '', secondCarousel : '', showCategorys : '', showBrands: '' };
  slideOptsOne = {
    initialSlide: 0,
    slidesPerView: 1,
    autoplay: true
  };

  constructor(
    public router: Router,
    public routerOutlet: IonRouterOutlet,
    public user: UserData,
    public product: ProductData,
    public modelService: ModelService,
    public cartService: CartService,
    public platform: Platform
  ) {}

  ngOnInit() {
    this.getUserData();
    this.setUserId('ngOnInit');
    this.setIsAdmin();
    this.getHomePage();
  }

  ionViewWillEnter() {
    this.setIsAdmin();
  }

  viewAll() {
    this.router.navigateByUrl('/app/tabs/allproducts');
  }

  getHomePage() {
    this.modelService.presentLoading('Loading content...');
    this.product.getHomePageData()
        .subscribe((data: any) => {
          this.modelService.dismissLoading();
          if (data.success) {
            this.homePageData.firstCarousel = data.homePage[0].content;
            this.homePageData.secondCarousel = data.homePage[1].content;
            this.homePageData.showCategorys = data.homePage[2].content;
            this.homePageData.showBrands = data.homePage[3].content;
          } else {
            this.modelService.presentToast(data.msg, 2000, 'danger');
          }
        });
  }

  setIsAdmin() {
    this.user.getIsAdmin().subscribe((isAdmin: boolean) => {
      this.isAdmin = isAdmin;
    });
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

}
