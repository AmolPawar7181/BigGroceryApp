import { AfterViewInit, Component } from '@angular/core';
import { Router } from '@angular/router';

import { AlertController } from '@ionic/angular';
import { ModelService } from '../../providers/models/model-service';
import { UserData } from '../../providers/user-data';


@Component({
  selector: 'page-account',
  templateUrl: 'account.html',
  styleUrls: ['./account.scss'],
})
export class AccountPage implements AfterViewInit {
  userProfileData: any = {address: '', phone: '', username: ''};
  historyData: any = [];
  slideOpts = {
    initialSlide: 1,
    speed: 400
  };

  constructor(
    public alertCtrl: AlertController,
    public router: Router,
    public userData: UserData,
    public modelService: ModelService
  ) { }

  ngAfterViewInit() {
    this.getUsername();
  }

  updatePicture() {
    console.log('Clicked to update picture');
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
            this.userData.setUserData(data.username);
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
        console.log(this.userProfileData);
        this.getUserHistory(value.userId);
      }
    });
  }

  getUserHistory(userId: any) {

    this.modelService.presentLoading('Please wait...');
    this.userData.getUserHistory(userId).subscribe((data: any) => {
      this.modelService.dismissLoading();

      if (data.success) {
        this.historyData = data.data;
        console.log(this.historyData);
      } else {
          this.modelService.presentToast(data.msg, 3000, 'danger');
      }
    });
  }

  // changePassword() {
  //   console.log('Clicked to change password');
  // }

  logout() {
    this.userData.logout();
    this.router.navigateByUrl('/login');
  }

  // support() {
  //   this.router.navigateByUrl('/support');
  // }
}
