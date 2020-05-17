import { Injectable } from '@angular/core';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
  })
export class ModelService {
  loading: any;
  isLoading = false;
  constructor(public toastCtrl: ToastController,
              public loadingCtrl: LoadingController,
              public alertCtrl: AlertController
              ) {}

  async presentToast(msg, duration, color) {
      const toast = await this.toastCtrl.create({
        message: msg,
        duration,
        position: 'bottom',
        color
      });
      toast.present();
  }

  async presentLoading(msg) {
    this.isLoading = true;
    return await this.loadingCtrl.create({
      message: msg
    }).then((a) => {
      a.present().then(() => {
        if (!this.isLoading) {
          a.dismiss().then(() => console.log('abort presenting'));
        }
      });
    });
  }

  async dismissLoading() {
    this.isLoading = false;
    return await this.loadingCtrl.dismiss().then(() => console.log('dismissed'));
  }


  async presentConfirm(header: any, message: any, cancelText: any, okText: any): Promise<any> {
      return new Promise(async (resolve) => {
        const alert = await this.alertCtrl.create({
          header,
          message,
          buttons: [
            {
              text: cancelText,
              role: 'cancel',
              cssClass: 'secondary',
              handler: (cancel) => {
                resolve('cancel');
              }
            }, {
              text: okText,
              handler: (ok) => {
                resolve('ok');
              }
            }
          ]
        });
        alert.present();
      });
    }
}
