import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';

import { MenuController, Platform, ToastController, IonRouterOutlet, ModalController } from '@ionic/angular';

import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { PlatformLocation } from '@angular/common';
import { Storage } from '@ionic/storage';

import { UserData } from './providers/user-data';
import { ProductData } from './providers/product-data';
import { CartService } from './providers/cart-service';
import { ModelService } from './providers/models/model-service';
// import { AdminData } from './providers/admin-data';

// const { App } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  @ViewChild(IonRouterOutlet, {static: false}) routerOutlet: IonRouterOutlet;
  appPages = [
    {
      title: 'Home',
      url: '/app/tabs/schedule',
      icon: 'home'
    },
    {
      title: 'Products',
      url: '/app/tabs/allproducts',
      icon: 'albums'
    },
    {
      title: 'Cart',
      url: '/app/tabs/cart',
      icon: 'cart'
    }
  ];
  loggedIn = false;
  dark = false;
  isAdmin: boolean;
  profileData: any;
  backButtonPressedOnceToExit: boolean;

  constructor(
    private menu: MenuController,
    private platform: Platform,
    private router: Router,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private storage: Storage,
    private userData: UserData,
    private swUpdate: SwUpdate,
    private toastCtrl: ToastController,
    private productData: ProductData,
    private cartService: CartService,
    private modelService: ModelService,
    private location: PlatformLocation,
    private modalCtrl: ModalController,
    // private adminData: AdminData
  ) {
    this.initializeApp();
    this.location.onPopState(async () => {
      // console.log('on pop');
      const modal = await this.modalCtrl.getTop();
      if (modal) {
        modal.dismiss();
        // console.log('on pop');
      }
    });
  }

  async ngOnInit() {
    // console.log(this.checkLoginStatus());
    this.checkLoginStatus();
    this.listenForLoginEvents();
    // this.setFilterData();
    // this.setAllowedZipCodes();
    // this.setPayData();
    this.setIsAdmin();

    this.swUpdate.available.subscribe(async res => {
      const toast = await this.toastCtrl.create({
        message: 'Update available!',
        position: 'bottom',
        buttons: [
          {
            role: 'cancel',
            text: 'Reload'
          }
        ]
      });

      await toast.present();

      toast
        .onDidDismiss()
        .then(() => this.swUpdate.activateUpdate())
        .then(() => window.location.reload());
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // this.statusBar.styleLightContent();
      this.statusBar.backgroundColorByHexString('#3880ff');
      this.splashScreen.hide();
      // console.log(this.userData.isLoggedIn());
      if (this.userData.isLoggedIn()) {
        // console.log('isloggedIn from app');
        this.userData.setIsAdmin();
        this.setProfileData();
      }
      this.platform.backButton.subscribeWithPriority(0, async () => {

        if (this.routerOutlet && this.routerOutlet.canGoBack()) {
             this.routerOutlet.pop();
        } else if (this.router.url === '/app/tabs/schedule') {
          if (this.backButtonPressedOnceToExit) {
              navigator['app'].exitApp();
            } else {
              return this.showExitToast();
            }
        } else if (this.router.url === '/login') {
          navigator['app'].exitApp();
        } else {
          history.back();
        }
      });
    });
  }

  showExitToast() {
    this.modelService.presentToast('Press back again to exit', 1500, '');
    this.backButtonPressedOnceToExit = true;
    setTimeout(() => {
      this.backButtonPressedOnceToExit = false;
    }, 2000);
}

  checkLoginStatus() {
    return this.userData.isLoggedIn().then(loggedIn => {
      return this.updateLoggedInStatus(loggedIn);
    });
  }

  updateLoggedInStatus(loggedIn: boolean) {
    setTimeout(() => {
      this.loggedIn = loggedIn;
    }, 300);
  }

  listenForLoginEvents() {
    window.addEventListener('user:login', () => {
     // console.log('user:login');
      this.updateLoggedInStatus(true);
      setTimeout(() => {
        this.setProfileData();
      }, 1000);
    });

    window.addEventListener('user:signup', () => {
      this.updateLoggedInStatus(true);
    });

    window.addEventListener('user:logout', () => {
      console.log('event listener on app user logout');
      this.productData.removeCart();
      this.cartService.addCartItemCount(0);
      this.userData.setUserId(null);
      this.updateLoggedInStatus(false);
      this.setProfileData();
      this.router.navigateByUrl('/app/tabs/schedule', {});
    });
  }

  logout() {
    this.modelService.presentLoading('Please wait...');
    this.userData.logout(this.profileData.userId)
        .subscribe((res: any) => {
          this.modelService.dismissLoading();
          if (res.success) {
            this.userData.removeStorage()
              .then(() => {
                this.modelService.presentToast(res.msg, 2000, 'success');
                return this.router.navigateByUrl('/app/tabs/schedule', {});
              });
          } else {
            this.modelService.presentToast(res.msg, 2000, 'danger');
          }
        });
  }

  openTutorial() {
    this.menu.enable(false);
    this.storage.set('ion_did_tutorial', false);
    this.router.navigateByUrl('/tutorial');
  }

  setIsAdmin() {
    this.userData.getIsAdmin().subscribe((isAdmin: boolean) => {
      // console.log('isAdmin', isAdmin);
      this.isAdmin = isAdmin;
    });
  }

  setProfileData() {
    this.userData.getUserData().then((value) => {
      if (value) {
        this.profileData = value;
      } else {
        this.profileData = null;
      }
    });
  }
  /*
  setFilterData() {
    this.productData.getAllFilters()
        .subscribe((filters: any) => {
          this.productData.setFiltersData(filters);
      });
  }

  setAllowedZipCodes() {
    this.userData.getZipCodes()
        .subscribe((codes: any) => {
          this.userData.setZipCodes(codes);
      });
  }

  setPayData() {
    this.adminData.getPayMethodData()
        .subscribe((data: any) => {
          this.adminData.setPayData(data);
        });
  }
  */
}
