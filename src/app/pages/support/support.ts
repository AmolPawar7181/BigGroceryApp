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

  supportMessage: any = { datenTime: '',  msg: ''};
  orderId: any;
  orderMessage: any = [];

  constructor(
    public modalCtrl: ModalController,
    public navParams: NavParams,
    public modelService: ModelService,
    public adminData: AdminData
  ) { }

  ionViewWillEnter() {
    this.orderId = this.navParams.get('orderId');
    console.log('this.userId ', this.orderId);
  }

  submit(form: NgForm) {
    this.submitted = true;
    console.log(this.supportMessage);

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
      console.log(data);
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
  // If the user enters text in the support question and then navigates
  // without submitting first, ask if they meant to leave the page
  // async ionViewCanLeave(): Promise<boolean> {
  //   // If the support message is empty we should just navigate
  //   if (!this.supportMessage || this.supportMessage.trim().length === 0) {
  //     return true;
  //   }

  //   return new Promise((resolve: any, reject: any) => {
  //     const alert = await this.alertCtrl.create({
  //       title: 'Leave this page?',
  //       message: 'Are you sure you want to leave this page? Your support message will not be submitted.',
  //       buttons: [
  //         { text: 'Stay', handler: reject },
  //         { text: 'Leave', role: 'cancel', handler: resolve }
  //       ]
  //     });

  //     await alert.present();
  //   });
  // }
}
