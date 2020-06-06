import { Component } from '@angular/core';

import { NavParams, ModalController } from '@ionic/angular';

@Component({
  selector: 'page-policy',
  templateUrl: 'policy.html',
  styleUrls: ['./policy.scss'],
})
export class PolicyPage {
  showPolicy = '';
  constructor(
    private navParams: NavParams,
    private modalCtrl: ModalController,
  ) {}

  ionViewWillEnter() {
    const showPolicy = this.navParams.get('showPolicy');
    if (showPolicy) {
      this.showPolicy = showPolicy;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
