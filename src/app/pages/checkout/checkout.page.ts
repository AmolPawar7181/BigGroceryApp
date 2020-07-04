import { Component, OnInit } from '@angular/core';
import { NavParams, ModalController } from '@ionic/angular';
@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit {
  orderDetails: any;
  userData: any;
  orderId: any;
  constructor(private navParams: NavParams, private modalCtrl: ModalController) { }

  ngOnInit() {
    this.orderId = this.navParams.get('orderId');
    this.userData = this.navParams.get('userData');
    this.orderDetails = this.navParams.get('orderDetails');

    // console.log('this.orderDetails ', this.orderDetails);
    // console.log('this.userData ', this.userData);
    // console.log('this.orderId ', this.orderId);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

}
