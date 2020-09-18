import { Component, ViewChildren, QueryList } from '@angular/core';
import { Router, } from '@angular/router';

import { AlertController, Platform, ModalController } from '@ionic/angular';
import { FivGallery } from '@fivethree/core';

import { ModelService } from '../../providers/models/model-service';
import { UserData } from '../../providers/user-data';
import { MapPage } from '../map/map';


@Component({
  selector: 'page-account',
  templateUrl: 'account.html',
  styleUrls: ['./account.scss'],
})
export class AccountPage {
  // @ViewChild('gallery', { static: false }) gallery: FivGallery;
  @ViewChildren(FivGallery) fivGals: QueryList<FivGallery>;
  userProfileData: any = {address: '', phone: '', username: ''};
  historyData: any = [];
  userId: any;
  slideOpts = {
    initialSlide: 1,
    speed: 400
  };
  backBtnSub: any;
  address: any;

  constructor(
    public alertCtrl: AlertController,
    public router: Router,
    public userData: UserData,
    public modelService: ModelService,
    public platform: Platform,
    public modalCtrl: ModalController
  ) { }

  ionViewWillEnter() {
    this.getUsername();
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
      this.address =  data;
    }
  }


  // Present an alert with the current username populated
  // clicking OK will update the username and display it
  // clicking Cancel will close the alert and do nothing
  async changeUsername() {
    const alert = await this.alertCtrl.create({
      header: 'Change Username',
      buttons: [
        'Cancel',
        {
          text: 'Ok',
          handler: (data: any) => {
            // this.userData.setUserData(data.username);
            this.getUsername();
          }
        }
      ],
      inputs: [
        {
          type: 'text',
          name: 'username',
          value: this.userProfileData.username,
          placeholder: 'username'
        }
      ]
    });
    await alert.present();
  }

  getUsername() {
    this.userData.getUserData().then((value: any) => {
      if (value) {
        this.userProfileData = value;
        this.userId = value.userId;
        // console.log(this.userProfileData);
        this.getUserHistory(value.userId);
        if (value.deliveryAddress) {
          this.address = value.deliveryAddress;
        } else {
          value.addresses.forEach((address: any, index: number) => {
            if (address.isDefault) {
              console.log(address);
              this.address = address;
            }
          });
        }
      }
    });
  }

  getUserHistory(userId: any) {

    this.modelService.presentLoading('Please wait...');
    this.userData.getUserHistory(userId).subscribe((data: any) => {
      this.modelService.dismissLoading();

      if (data.success) {
        this.historyData = data.data;
        // console.log(this.historyData);
      } else {
          this.modelService.presentToast(data.msg, 3000, 'danger');
      }
    });
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

  logout() {
    this.userData.logout(this.userId);
    this.router.navigateByUrl('/login');
  }

}
