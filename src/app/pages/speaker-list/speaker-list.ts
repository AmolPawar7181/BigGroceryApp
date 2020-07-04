import { Component, ViewChild } from '@angular/core';
import {
  Platform,
  ModalController,
  NavParams,
} from '@ionic/angular';
import { FivGallery } from '@fivethree/core';

import { Router } from '@angular/router';
import { ModelService } from '../../providers/models/model-service';
import { ProductData } from '../../providers/product-data';
import { CartService } from '../../providers/cart-service';

@Component({
  selector: 'page-speaker-list',
  templateUrl: 'speaker-list.html',
  styleUrls: ['./speaker-list.scss'],
})
export class SpeakerListPage {
  @ViewChild('gallery', { static: false }) gallery: FivGallery;

  speakers: any[] = [];
  product: any;
  slideOptsOne = {
    initialSlide: 0,
    slidesPerView: 1,
    autoplay: true
  };
  userId: any;
  backBtnSub: any;

  constructor(public navParams: NavParams, public modelService: ModelService,
              public productData: ProductData, private router: Router,
              public cartService: CartService, public modalCtrl: ModalController,
              public platform: Platform, ) {}

  ionViewWillEnter() {
    this.product = this.navParams.get('productDetails');
    this.userId = this.navParams.get('userId');
    // console.log('productData ', this.product);
    // console.log('userId ', this.userId);

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
    this.gallery.close();
  }


  addToCart(productId: any) {
    if (this.userId) {
    this.modelService.presentLoading('Please wait...');
    this.cartService.addToCart(this.userId, productId).subscribe((cart: any) => {
      this.modelService.dismissLoading();
      if (cart.length > 0) {
        const productAvailable = cart.find((ob: any) => ob.id === productId);
        // console.log('before ', this.product.count);
        // console.log(productAvailable);
        // console.log(productAvailable.data.count);
        if (productAvailable !== undefined) {
          this.product.count = productAvailable.data.count;
        }
        this.product.addedTocart = true;

        this.productData.setCartEvent();
        this.cartService.addCartItemCount(cart.length);
        // this.setProductsById(cart);
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
      this.dismiss();
     }, 1000);
   }
  }

  removeFromCart(productId: any, count: any, pos: any) {
    this.modelService.presentLoading('Please wait...');
    this.cartService.removeFromCart(this.userId, productId, count)
        .subscribe((cartDetails: any) => {
          this.modelService.dismissLoading();
          if (cartDetails.success) {
            this.cartService.addCartItemCount(cartDetails.data.length);
            const productAvailable = cartDetails.data.find((ob: any) => ob.productId === productId);
            // console.log(productAvailable);
            if (productAvailable !== undefined) {
              this.product.count = productAvailable.count;
            } else {
              this.product.count = 0;
              this.product.addedTocart = false;
            }
            // this.setProductsById(cartDetails.data);
            // this.checkRemovedItems(productId, cartDetails.data);
          } else {
          //  this.cartItems = [];
          //  this.total = 0;
          // this.checkRemovedItems(productId, 'empty');
          this.product.count = 0;
          this.product.addedTocart = false;
          this.cartService.addCartItemCount(0);
          if (cartDetails.msg !== 'Cart is empty') {
            this.modelService.presentToast(cartDetails.msg, 1500, 'danger');
          }
          }
      });
  }

  addSaveForLater(productId: any) {
    if (this.userId) {
      this.modelService.presentLoading('Please wait...');
      this.cartService.addSaveForLater(this.userId, productId).subscribe((product: any) => {
        this.modelService.dismissLoading();
        if (product.success) {
         // console.log('res ', product);
         this.modelService.presentToast(product.msg, 2000, 'success');
        } else {
          this.modelService.presentToast(product.msg, 2000, 'danger');
        }
      });
     } else {
       this.modelService.presentToast('Please login to add item to save', 2000, 'danger');
       setTimeout(() => {
        this.dismiss();
        this.router.navigate(['login']);
       }, 2000);
     }
  }

  dismiss(data?: any) {
    // using the injected ModalController this page
    // can "dismiss" itself and pass back data
    this.modalCtrl.dismiss();
  }
}
