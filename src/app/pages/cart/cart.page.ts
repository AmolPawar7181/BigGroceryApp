import { Component, OnInit, ViewChildren, QueryList  } from '@angular/core';
import { Router } from '@angular/router';
import { IonRouterOutlet, ModalController, Platform, ActionSheetController } from '@ionic/angular';
import { FivGallery } from '@fivethree/core';

import { UserData } from '../../providers/user-data';
import { CartService } from '../../providers/cart-service';
import { ModelService } from '../../providers/models/model-service';
import { ProductData } from '../../providers/product-data';
import { AdminData } from '../../providers/admin-data';
import { SpeakerListPage } from '../speaker-list/speaker-list';
import { WebIntent } from '@ionic-native/web-intent/ngx';
import { CheckoutPage } from '../checkout/checkout.page';
import { MapPage } from '../map/map';
declare var RazorpayCheckout: any;

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {
  // @ViewChild('gallery', { static: false }) gallery: FivGallery;
  // @ViewChildren('fivGallery', { read: ElementRef }) fivGals: QueryList<ElementRef>;
  @ViewChildren(FivGallery) fivGals: QueryList<FivGallery>;
  userId: any;
  cartItemCount: any;
  cartItems: any = [];
  total = 0;
  saved = 0;
  userData: any;
  razorData: any = { currency: '', key: '', name: '', description: ''};
  traId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8);
  trRef = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8);
  upiData = { payeeVPA: '', payeeName: '', amount: 0, tranId: '', currency: 'INR', tranNote: 'Payment%20for%20Groceries', trRef: ''};
  upiResponse: any;
  payementMethod: any;
  cartproducts = [];
  backBtnSub: any;
  codAvailable: boolean;
  deChrg = 0;
  productAmount = 0;
  minTotal = 0; // getting from server to get free delivery
  minAmount = 0; // to get free delivery
  isFreeDelivery: boolean;
  savedProducts: any = [];
  slideOpts = {
    slidesPerView: 2,
  };
  isCheckout = false;

  constructor(public user: UserData, public cartService: CartService,
              public modelService: ModelService, public router: Router,
              public productData: ProductData, public adminData: AdminData,
              public modalCtrl: ModalController, public routerOutlet: IonRouterOutlet,
              public webIntent: WebIntent, public platform: Platform,
              private actionCtrl: ActionSheetController
    ) { }

  ngOnInit() {
    this.listenForEvents();
    this.setUserId();
    this.getUserData();
    this.setPayData();
  }

  // this will check payment method
  // and will trigger the function accordingly

  // payWith() {
  //   if (this.payementMethod === 'upi') {
  //     // console.log('this.codAvailable ', this.codAvailable);
  //     // if cash on delivery available
  //     if (this.codAvailable) {
  //       this.selectCODorUPI('UPI - Google pay, PhonePe...', 'upi');
  //     } else {
  //       this.payWithUpi();
  //     }
  //   } else if (this.payementMethod === 'rez') {
  //     // if cash on delivery available
  //     if (this.codAvailable) {
  //       this.selectCODorUPI('Net banking, Debit Card...', 'rez');
  //     } else {
  //       this.payWithRazorpay();
  //     }
  //   }
  // }

  createButtons() {
    const buttons = [];
    // tslint:disable-next-line: forin
    // for (const index in product.quantities) {

    if (this.codAvailable) {
      const button = {
        text: 'COD - Cash on delivery',
        icon: 'cash-outline',
        handler: () => {
          this.payWithCOD();
        }
      };
      buttons.push(button);
    }

    if (this.upiData) {
      const button = {
        text: 'UPI - Google pay, PhonePe...',
        icon: 'phone-portrait-outline',
        handler: () => {
          this.payWithUpi();
        }
      };
      buttons.push(button);
    }

    if (this.razorData) {
      const button = {
        text: 'Net Banking, Debit Card...',
        icon: 'card-outline',
        handler: () => {
          this.payWithRazorpay();
        }
      };
      buttons.push(button);
    }

    return buttons;
  }

  async makePayment() {
    const actionSheet = await this.actionCtrl.create({
      header: 'Select payment method',
      cssClass: 'cart-action-sheet',
      buttons: this.createButtons()
    });
    await actionSheet.present();
  }

  payWithCOD() {
    this.checkOut('COD', 'COD');
  }

  payWithUpi() {
    this.upiData.amount = this.total;
    this.upiData.tranId =  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8);
    this.upiData.trRef =  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8);

    const options = {
      action: this.webIntent.ACTION_VIEW,
      url: `upi://pay?pa=${this.upiData.payeeVPA}&pn=${this.upiData.payeeName}&tid=${this.upiData.tranId}&am=${this.upiData.amount}&cu=${this.upiData.currency}&tn=${this.upiData.tranNote}&tr=${this.upiData.trRef}`
    };

    this.webIntent.startActivityForResult(options)
        .then((success: any) => {
          this.upiResponse = success;
          if (success.extras.Status === 'SUCCESS' || success.extras.Status === 'Success') {
            this.modelService.presentToast(`Success ${success})`, 3000, 'success');
            this.addUpiSuccess(success);
            this.checkOut(success.extras.txnRef, this.payementMethod);
          } else if (success.extras.Status === 'SUBMITTED') {
            this.addUpiSuccess(success);
            this.checkOut(success.extras.txnRef, this.payementMethod);
            this.modelService.presentToast(`Success ${success})`, 3000, 'success');
          } else if (success.extras.Status === 'Failed' || success.extras.Status === 'FAILURE') {
            this.addUpiSuccess(success);
            this.modelService.presentToast(`(Error ${success.extras.Status})`, 3000, 'danger');
          } else {
            this.addUpiSuccess(success);
            this.modelService.presentToast(`(Error ${success.extras.Status})`, 3000, 'danger');
          }
        }, (rejected: any) => {
          this.upiResponse = rejected;
          this.addUpiSuccess(rejected);
          this.modelService.presentToast(`(Rejected ${rejected})`, 3000, 'danger');
        })
        .catch((error: any) => {
          alert('Error in webintent');
        });
  }

  addUpiSuccess(res: any) {
    this.productData.addUpiData(res)
        .subscribe();
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
      this.checkOut(paymentId, this.payementMethod);
    };

    const cancelCallback = (error: any) => {
      this.modelService.presentToast(`${error.description} (Error ${error.code})`, 3000, 'danger');
      // console.log('error cancelCallBack', error);
    };

    RazorpayCheckout.open(options, successCallback, cancelCallback);
  }

  addToCart(product: any, pos: any) {
    // console.log('this.cartItems ', this.cartItems);
    if (this.userId) {
    this.modelService.presentLoading('Please wait...');
    this.productData.addToCart(this.userId, product.productId).subscribe((cart: any) => {
      this.modelService.dismissLoading();
      if (cart.length > 0) {
         this.cartItems.forEach((item: any, index: any) => {
             item.count = cart[index].data.count;
         });

         this.calculateCart(this.cartItems);
         this.setProductsById(cart);
         this.productData.updateCart(product);
         // console.log('after update ', this.cartItems);
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

  addToCartFromSaved(product: any, pos: any) {
    if (this.userId) {
    this.modelService.presentLoading('Please wait...');
    this.productData.addToCart(this.userId, product.productId).subscribe((cart: any) => {
      this.modelService.dismissLoading();
      console.log('before ', this.cartItems);
      // console.log('product ', product);
      if (cart.length > 0) {
        this.cartService.removeSaveForLater(this.userId, product.saveId)
            .subscribe();
        product.count = 1;
        this.cartItems.push(product);
        console.log('after ', this.cartItems);
        this.cartService.addCartItemCount(this.cartItemCount);
        this.calculateCart(this.cartItems);
        this.savedProducts.splice(pos, 1);
        this.cartItemCount = cart.length;
        this.productData.updateCart(product);
       } else {
        this.modelService.presentToast(cart.msg, 3000, 'danger');
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
       this.setProductsById(cartDetails.data);
       this.checkRemovedItems(productId, cartDetails.data);
       this.productData.setCart(cartDetails);
      } else {
       console.log('removefromcart else ', cartDetails);
       this.checkRemovedItems(productId, 'empty');
       this.cartItems = [];
       this.total = 0;
       this.saved = 0;
       this.productAmount = 0;
       this.cartService.addCartItemCount(0);
       this.productData.setCart(cartDetails);
       this.modelService.presentToast(cartDetails.msg, 1500, 'danger');
      }
   });
  }

  getCartDetails() {
    console.log('getCartDetails ');
    this.modelService.presentLoading('Please wait...');
    this.user.getUserData()
    .then((user: any) => {
      if (user) {
      this.userId = user.userId;
      this.cartService.getCartDetails(this.userId)
      .subscribe((cartDetails: any) => {
         this.modelService.dismissLoading();
         console.log('cartDetails.data ', cartDetails);
         this.getSavedForLater();
         if (cartDetails.data && cartDetails.data.length > 0) {
          this.cartItemCount = cartDetails.data.length;
          this.cartItems = cartDetails.data;
          this.cartService.addCartItemCount(this.cartItemCount);
          this.calculateCart(cartDetails.data);
          // console.log('getcart ', this.cartItems);
          this.productData.setCart(cartDetails);
          // console.log('after ', this.cartItems);
         } else {
          this.cartItems = [];
          this.productData.setCart(cartDetails);
          this.modelService.presentToast(cartDetails.msg, 3000, 'danger');
         }
      });
     }
    });
  }

  checkOut(paymentId: any, paymentMethod: any) {
    const order = {
      userId: this.userId,
      total: this.total,
      products: this.cartItems,
      paymentId,
      paymentMethod,
      productAmount: this.productAmount,
      deChrg: this.isFreeDelivery ? 0 : this.deChrg,
      deliveryData: this.userData.deliveryAddress
    };
    // console.log('order ', order);
    this.modelService.presentLoading('Confirming order, Please wait...');
    this.cartService.placeOrder(order)
    .subscribe((orderDetails: any) => {
      this.modelService.dismissLoading();
      if (orderDetails.success) {
       this.cartService.sendSms(this.userData.phone, this.total).subscribe();
       this.cartItemCount = 0;
       this.cartItems = [];
       this.total = 0;
       this.saved = 0;
       this.productAmount = 0;
       this.cartService.addCartItemCount(0);
       this.modelService.presentToast(orderDetails.msg, 1500, 'success');
       this.openCheckOutPage(orderDetails.orderId, order);
       this.productData.setCart({success: false, msg: 'Cart is empty'});
      } else {
       this.cartItems = [];
       this.total = 0;
       this.saved = 0;
       this.productAmount = 0;
       this.cartService.addCartItemCount(0);
       this.modelService.presentToast(orderDetails.msg, 1500, 'danger');
       this.productData.setCart({success: false, msg: 'Cart is empty'});
      }
    });
  }

  async openCheckOutPage(orderId: any, orderDetails: any) {

    const modal = await this.modalCtrl.create({
      component: CheckoutPage,
      swipeToClose: true,
      componentProps: { orderId, userData: this.userData, orderDetails },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
        this.setIsCheckout();
    }
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
    this.saved = 0;
    this.productAmount = 0;
    for (let i = 0; i < cartDetails.length; i++) {
        // this.total = this.total + (cartDetails[i].details.price * cartDetails[i].count);
        this.productAmount = this.productAmount + (cartDetails[i].details.price * cartDetails[i].count);
        // tslint:disable-next-line: max-line-length
        this.saved = this.saved + ((cartDetails[i].details.mrp * cartDetails[i].count) - (cartDetails[i].details.price * cartDetails[i].count));
    }

    if (this.productAmount >= this.minTotal) {
      this.isFreeDelivery = true;
      this.total = this.productAmount;
    } else {
      this.isFreeDelivery = false;
      this.minAmount = this.minTotal - this.productAmount;
      this.total = this.productAmount + this.deChrg;
    }
  }

  getUserData() {
    this.user.getUserData()
        .then((user: any) => {
          if (user) {
            this.userData = user;
            if (!user.deliveryAddress) {
              user.addresses.forEach((value: any) => {
                if (value.isDefault) {
                  this.userData.deliveryAddress = value;
                  return;
                }
              });
            }
          }
          console.log('getuserdata ', this.userData);
        });
  }

  setIsCheckout() {
    this.modelService.presentLoading('');
    setTimeout(() => {
      this.isCheckout = !this.isCheckout;
      this.modelService.dismissLoading();
    }, 1000);
  }

  setPayData() {
    this.adminData.getPayData()
        .then((payData: any) => {
          if (payData.success) {
            this.setPaymentMethod(payData);
          } else {
            this.modelService.presentLoading('Please wait...');
            this.adminData.getPayMethodData()
                .subscribe((res: any) => {
                  this.modelService.dismissLoading();
                  if (res.success) {
                    this.setPaymentMethod(res);
                  } else {
                    this.modelService.presentToast(res.msg, 2000, 'danger');
                  }
                });
          }
        });
  }

  getSavedForLater() {
    this.user.getUserData()
    .then((user: any) => {
      if (user) {
        this.user.getSavedForLater(user.userId)
            .subscribe((savedProducts: any) => {
              if (savedProducts.success) {
                this.savedProducts = savedProducts.data;
                for (let i = 0; i < this.savedProducts.length; i++) {
                  const productAvailable = this.cartItems.find((ob: any) => ob.productId === this.savedProducts[i].productId);
                  if (productAvailable !== undefined) {
                      this.savedProducts[i].isAddedTocart = true;
                    } else {
                      this.savedProducts[i].isAddedTocart = false;
                    }
                }
              } else {
                this.savedProducts = [];
              }
            });
          }
      });
  }

  async addAddress() {
    const modal = await this.modalCtrl.create({
      component: MapPage,
      swipeToClose: true,
      componentProps: {}
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.getUserData();
    }
  }

  async presentDetails(productDetails: any, pos: any) {
    const userId = this.userId;
    const newProductDetails = {
      productId: productDetails.productId,
      saveId: productDetails.saveId,
      ...productDetails.details
    };
    const modal = await this.modalCtrl.create({
      component: SpeakerListPage,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { productDetails: newProductDetails, userId },
    });
    await modal.present();

    const {data} = await modal.onWillDismiss();
    if (data.isRemoved) {
      this.savedProducts.splice(pos, 1);
    }
  }

  setPaymentMethod(payData: any) {
    // console.log('setPaymentMethod ', payData);
    //if (payData.upiData) {
      this.upiData = payData.upiData;
      this.razorData = payData.rezData;
      this.payementMethod = 'upi';
      this.codAvailable = payData.cod;
      this.deChrg = payData.deChrg;
      this.minTotal = payData.minTotal;
    //} else if (payData.rezData) {
      
      // this.payementMethod = 'rez';
      // this.codAvailable = payData.cod;
      // this.deChrg = payData.deChrg;
      // this.minTotal = payData.minTotal;
    // }
  }

 setProductsById(cartDetails: any) {
    // console.log('setProductsById ', cartDetails);
    if (cartDetails[0].data) {
      // console.log('cartDetails.data ', cartDetails.data);
      for (let i = 0; i < cartDetails.length; i++) {
          const product = {
            id: cartDetails[i].id,
            count: cartDetails[i].data.count
          };
          if (i === 0) {
            this.cartService.addCartItemsByProduct(product, 0);
          } else {
            this.cartService.addCartItemsByProduct(product);
          }
        }
    } else {
      // console.log('else this.cartproducts ', this.cartproducts);
      for (let i = 0; i < cartDetails.length; i++) {
        const product = {
          id: cartDetails[i].productId,
          count: cartDetails[i].count
        };
        if (i === 0) {
          this.cartService.addCartItemsByProduct(product, 0);
        } else {
          this.cartService.addCartItemsByProduct(product);
        }
      }
     }
  }

  checkRemovedItems(productId: any, newArr: any) {
    // let proId: any;
    // newArr will have empty value when cart is empty
    if (newArr !== 'empty') {
      // will check if product is deleted from cart
      if (!newArr.some((obj: any) => obj.productId === productId)) {
        // console.log(productId, 'not found');
        this.triggerDeleteEvent(productId);
      }
    } else {
      this.triggerDeleteEvent(productId);
    }
  }

  onImageOpen() {
    this.backBtnSub = this.platform.backButton.subscribeWithPriority(10000, () => {
      this.closeImagePopup();
    });
  }

  onImageClose() {
    this.backBtnSub.unsubscribe();
  }

  closeImagePopup() {
    const gallery = this.fivGals.toArray();
    for (let i = 0; i < gallery.length; i++) {
      if (gallery[i].initialImage) {
        gallery[i].close();
        break;
      }
    }
  }

  triggerDeleteEvent(productId: any) {
    this.cartService.addDeletedProId(productId);
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
        if (cart.success) {
          // console.log('cartUpdated ', cart);
          this.cartItemCount = cart.length;
          // this.cartItems = cart.data;
        }
      });
    });
  }

}
