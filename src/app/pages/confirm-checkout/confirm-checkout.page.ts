import { Component, OnInit } from '@angular/core';
import { NavParams, ModalController } from '@ionic/angular';
@Component({
  selector: 'app-confirm-checkout',
  templateUrl: './confirm-checkout.page.html',
  styleUrls: ['./confirm-checkout.page.scss'],
})
export class ConfirmCheckoutPage implements OnInit {
  orderDetails: any;
  userData: any;
  orderId: any;
  animate = true;
  constructor(private navParams: NavParams, private modalCtrl: ModalController) { }

  ngOnInit() {
    this.orderId = this.navParams.get('orderId');
    this.userData = this.navParams.get('userData');
    this.orderDetails = this.navParams.get('orderDetails');

    console.log('this.orderDetails ', this.orderDetails);
    console.log('this.userData ', this.userData);
    console.log('this.orderId ', this.orderId);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

}
