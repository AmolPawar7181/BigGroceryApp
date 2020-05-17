import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserData } from '../../providers/user-data';
import { CartService } from '../../providers/cart-service';
import { ModelService } from '../../providers/models/model-service';
import { ProductData } from '../../providers/product-data';
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

  constructor(public user: UserData, public cartService: CartService,
              public modelService: ModelService, public router: Router,
              public productData: ProductData
    ) { }

  ngOnInit() {
    this.listenForEvents();
    this.setUserId();
  }

  addToCart(productId: any) {
    console.log('addToCart called');
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
    console.log('removeFromCart called');
    this.modelService.presentLoading('Please wait...');
    this.cartService.removeFromCart(this.userId, productId, count)
    .subscribe((cartDetails: any) => {
      this.modelService.dismissLoading();
      if (cartDetails.success) {
       this.cartItemCount = cartDetails.data.length;
       this.cartItems = cartDetails.data;
       this.calculateCart(cartDetails.data);
       this.cartService.addCartItemCount(this.cartItemCount);
       // this.modelService.presentToast(cartDetails.msg, 1500, 'success');
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
         console.log('cartDetails.data ', cartDetails);
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

  checkOut() {
    const order = {
      userId: this.userId,
      total: this.total,
      products: this.cartItems
    };
    console.log('order ', order);
    this.modelService.presentLoading('Please wait...');
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

  calculateCart(cartDetails: any) {
    this.total = 0;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < cartDetails.length; i++) {
        this.total = this.total + (cartDetails[i].details.price * cartDetails[i].count);
    }
  }

  setUserId() {
    this.user.getUserId()
      .subscribe((userId) => {
        console.log('subscribe to userid ', userId);
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
      console.log('cartUpdated');
      this.productData.getCart().then((cart: any) => {
        this.cartItemCount = cart.length;
        this.cartItems = cart;
      });
    });
  }

}
