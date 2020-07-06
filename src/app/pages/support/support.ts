import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalController, NavParams } from '@ionic/angular';

import { ModelService } from '../../providers/models/model-service';
import { AdminData } from '../../providers/admin-data';


@Component({
  selector: 'page-support',
  templateUrl: 'support.html',
  styleUrls: ['./support.scss'],
})
export class SupportPage {
  submitted = false;

  supportMessage: any = { datenTime: '',  msg: 'Your order will be delivered on above given time'};
  orderId: any;
  orderMessage: any = [];
  msgType = true;

  constructor(
    public modalCtrl: ModalController,
    public navParams: NavParams,
    public modelService: ModelService,
    public adminData: AdminData
  ) { }

  ionViewWillEnter() {
    this.orderId = this.navParams.get('orderId');
  }

  toggleChecked(event: any) {
    if (event) {
      this.supportMessage.msg = 'Your order will be delivered on above given time';
    } else {
      this.supportMessage.msg = 'Please collect your order on above given time';
    }
  }

  submit(form: NgForm) {
    this.submitted = true;

    if (form.valid) {
      this.modelService.presentLoading('Please wait...');
      this.orderMessage.push({
          dateTime: Date.parse(this.supportMessage.datenTime),
          msg: this.supportMessage.msg
      });

      const data = {
        orderId: this.orderId,
        msg: this.orderMessage
      };
      this.adminData.messageUser(data)
          .subscribe((res: any) => {
            this.modelService.dismissLoading();
            if (res.success) {
              this.supportMessage = { datenTime: '',  msg: ''};
              this.submitted = false;
              this.modelService.presentToast(res.msg, 2000, 'success');
              this.dismiss();
            } else {
              this.modelService.presentToast(res.msg, 2000, 'success');
            }
          });
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
