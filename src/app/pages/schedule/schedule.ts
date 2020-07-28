import { Component, ViewChild, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { IonRouterOutlet, Platform } from "@ionic/angular";

import { UserData } from "../../providers/user-data";
import { ProductData } from "../../providers/product-data";
import { ModelService } from "../../providers/models/model-service";
import { CartService } from "../../providers/cart-service";
import { HomePageData } from "../../interfaces/product-options";
import { AdminData } from "../../providers/admin-data";

@Component({
  selector: "page-schedule",
  templateUrl: "schedule.html",
  styleUrls: ["./schedule.scss"],
})
export class SchedulePage implements OnInit {
  userId: any;
  slideOpts = {
    initialSlide: 1,
    speed: 400,
  };
  isAdmin: boolean;
  backBtnSub: any;
  homePageData: HomePageData = {
    firstCarousel: "",
    secondCarousel: "",
    showCategorys: "",
    showBrands: "",
  };
  slideOptsOne = {
    initialSlide: 0,
    slidesPerView: 1,
    autoplay: true,
  };

  constructor(
    public router: Router,
    public routerOutlet: IonRouterOutlet,
    public user: UserData,
    public product: ProductData,
    public modelService: ModelService,
    public cartService: CartService,
    public platform: Platform,
    public adminData: AdminData
  ) {}

  ngOnInit() {
    // console.log('ngOnInit');
    this.getUserData();
    this.setUserId("ngOnInit");
    this.setIsAdmin();
    this.getHomePage();
    this.setFilterData();
    this.setAllowedZipCodes();
    this.setPayData();
  }

  ionViewWillEnter() {
    // console.log('ionViewWillEnter');
    this.setIsAdmin();
  }

  viewAll() {
    this.router.navigateByUrl("/app/tabs/allproducts");
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
        this.modelService.presentLoading("Loading content...");
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
        this.modelService.presentToast(data.msg, 2000, "danger");
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
        this.cartService
          .getCartDetails(user.userId)
          .subscribe((cartDetails: any) => {
            // console.log('getUserData subsc, ', cartDetails);
            if (cartDetails.data && cartDetails.data.length > 0) {
              this.product.setCart(cartDetails);
              this.cartService.addCartItemCount(cartDetails.data.length);
            }
          });
      }
    });
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
