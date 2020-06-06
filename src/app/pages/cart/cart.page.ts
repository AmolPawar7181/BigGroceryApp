import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonRouterOutlet, ModalController } from '@ionic/angular';

import { UserData } from '../../providers/user-data';
import { CartService } from '../../providers/cart-service';
import { ModelService } from '../../providers/models/model-service';
import { ProductData } from '../../providers/product-data';
import { AdminData } from '../../providers/admin-data';
import { SpeakerListPage } from '../speaker-list/speaker-list';

declare var RazorpayCheckout: any;

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {
  userId: any;
  cartItemCount: any;
  cartItems: any = [];
  total = 0;
  saved = 0;
  userData: any;
  razorData: any = { currency: '', key: '', name: '', description: ''};
  upiData: any;

  constructor(public user: UserData, public cartService: CartService,
              public modelService: ModelService, public router: Router,
              public productData: ProductData, public adminData: AdminData,
              public modalCtrl: ModalController, public routerOutlet: IonRouterOutlet,
    ) { }

  ngOnInit() {
    this.listenForEvents();
    this.setUserId();
    this.getUserData();
    this.setRazorData();
  }

  payWithRazorpay() {
    const options = {
      description: this.razorData.description,
      currency: this.razorData.currency, // your 3 letter currency code
      key: this.razorData.key, // your Key Id from Razorpay dashboard
      amount: this.total * 100, // Payment amount in smallest denomiation e.g. cents for USD
      name: this.razorData.name,
      prefill: {
        email: this.userData.email,
        contact: this.userData.phone,
        name: this.userData.username
      },
      modal: {
        ondismiss() {
          console.log('modal dismissed');
        }
      }
    };

    const successCallback = (paymentId: any) =>  {
      // console.log('success ', paymentId);
      this.checkOut(paymentId);
    };

    const cancelCallback = (error: any) => {
      this.modelService.presentToast(`${error.description} (Error ${error.code})`, 3000, 'danger');
      // console.log('error cancelCallBack', error);
    };

    this.modelService.presentConfirm('Are you sure?', `You have added all the items needed?`, 'add items', 'make payment')
        .then(res => {
          if (res === 'ok') {
          RazorpayCheckout.open(options, successCallback, cancelCallback);
          }
        });
  }

  addToCart(productId: any) {
    if (this.userId) {
    this.modelService.presentLoading('Please wait...');
    this.productData.addToCart(this.userId, productId).subscribe((cart: any) => {
      this.modelService.dismissLoading();
      if (cart.length > 0) {
         this.cartItems.forEach((item: any, index: any) => {
             item.count = cart[index].data.count;
         });
         this.calculateCart(this.cartItems);
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

  removeFromCart(productId: any, count: any) {
    this.modelService.presentLoading('Please wait...');
    this.cartService.removeFromCart(this.userId, productId, count)
    .subscribe((cartDetails: any) => {
      this.modelService.dismissLoading();
      if (cartDetails.success) {
       this.cartItemCount = cartDetails.data.length;
       this.cartItems = cartDetails.data;
       this.calculateCart(cartDetails.data);
       this.cartService.addCartItemCount(this.cartItemCount);
      } else {
       this.cartItems = [];
       this.total = 0;
       this.cartService.addCartItemCount(0);
       this.modelService.presentToast(cartDetails.msg, 1500, 'danger');
      }
   });
  }

  getCartDetails() {
    this.modelService.presentLoading('Please wait...');
    this.user.getUserData()
    .then((user: any) => {
      if (user) {
      this.userId = user.userId;
      this.cartService.getCartDetails(this.userId)
      .subscribe((cartDetails: any) => {
         this.modelService.dismissLoading();
         // console.log('cartDetails.data ', cartDetails);
         if (cartDetails.data && cartDetails.data.length > 0) {
          this.cartItemCount = cartDetails.data.length;
          this.cartItems = cartDetails.data;
          this.cartService.addCartItemCount(this.cartItemCount);
          this.calculateCart(cartDetails.data);
         } else {
          this.modelService.presentToast(cartDetails.msg, 3000, 'danger');
         }
      });
     }
    });
  }

  checkOut(paymentId: any) {
    const order = {
      userId: this.userId,
      total: this.total,
      products: this.cartItems,
      paymentId
    };
    // console.log('order ', order);
    this.modelService.presentLoading('Confirming order, Please wait...');
    this.cartService.placeOrder(order)
    .subscribe((orderDetails: any) => {
      this.modelService.dismissLoading();
      if (orderDetails.success) {
       this.cartItemCount = 0;
       this.cartItems = [];
       this.total = 0;
       this.cartService.addCartItemCount(0);
       this.modelService.presentToast(orderDetails.msg, 1500, 'success');
      } else {
       this.cartItems = [];
       this.total = 0;
       this.cartService.addCartItemCount(0);
       this.modelService.presentToast(orderDetails.msg, 1500, 'danger');
      }
    });
  }

  async presentAddressPage() {

    const modal = await this.modalCtrl.create({
      component: SpeakerListPage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { userData: this.userData },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();

    // Close any open sliding items when the schedule updates
  }

  calculateCart(cartDetails: any) {
    this.total = 0;
    for (let i = 0; i < cartDetails.length; i++) {
        this.total = this.total + (cartDetails[i].details.price * cartDetails[i].count);
    }
  }

  getUserData() {
    this.user.getUserData()
        .then((user: any) => {
          this.userData = user;
          // console.log(this.userData);
        });
  }

  setRazorData() {
    this.adminData.getRezData()
        .then((razor: any) => {
          if (razor.success) {
            this.razorData = razor.rezData;
            // console.log('if ', this.razorData);
          } else {
            this.modelService.presentLoading('Please wait...');
            this.adminData.getRazorData()
                .subscribe((res: any) => {
                  this.modelService.dismissLoading();
                  this.razorData = res.rezData;
                  // console.log('else ', this.razorData);
                });
          }
        });
  }

  setUserId() {
    this.user.getUserId()
      .subscribe((userId) => {
        // console.log('subscribe to userid ', userId);
        if (userId) {
         this.userId = userId;
        } else {
          this.userId = null;
        }
    });
  }

  ionViewWillEnter() {
    this.user.isLoggedIn().then((res) => {
      if (!res) {
        this.router.navigate(['login']);
      } else {
        this.getCartDetails();
      }
    });
  }

  ionViewDidEnter() {
    this.hideTabs();
  }

  ionViewWillLeave() {
    this.showTabs();
  }

  hideTabs() {
    const tabBar = document.getElementById('myTabBar');
    if (tabBar.style.display !== 'none') { tabBar.style.display = 'none'; }
  }

  showTabs() {
    const tabBar = document.getElementById('myTabBar');
    if (tabBar.style.display !== 'flex') { tabBar.style.display = 'flex'; }
  }

  listenForEvents() {
    window.addEventListener('user:logout', () => {
      this.cartItemCount = null;
      this.cartItems = [];
    });

    window.addEventListener('user:cartUpdated', () => {
      // console.log('cartUpdated');
      this.productData.getCart().then((cart: any) => {
        this.cartItemCount = cart.length;
        this.cartItems = cart;
      });
    });
  }

}
