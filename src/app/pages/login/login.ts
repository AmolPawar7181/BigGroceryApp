import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { UserData } from '../../providers/user-data';

import { UserOptions } from '../../interfaces/user-options';
import { ModelService } from '../../providers/models/model-service';


@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  styleUrls: ['./login.scss'],
})
export class LoginPage {
  login: UserOptions = { username: '', password: '' };
  submitted = false;

  constructor(
    public userData: UserData,
    public router: Router,
    public storage: Storage,
    private menu: MenuController,
    public modelService: ModelService
  ) { }

  // async ngOnInit() {
  //   this.checkLoginStatus();
  // }

  checkLoginStatus() {
    return this.userData.isLoggedIn().then(loggedIn => {
      this.router.navigateByUrl('/app/tabs/schedule');
    });
  }


  onLogin(form: NgForm) {
    this.submitted = true;

    if (form.valid) {
      this.modelService.presentLoading('Please wait...');
      this.userData.login(this.login)
      .subscribe((res: any) => {
        console.log(res);
        this.modelService.dismissLoading();
        if (res.success) {
            console.log('login success ', res.userData);
            this.userData.setUserData(res.userData)
            .then(() => {
              this.router.navigateByUrl('/app/tabs/schedule').then(() => {
                form.resetForm();
                this.submitted = false;
              });
            });
        } else {
          this.modelService.presentToast(res.msg, 2000, 'danger');
          console.log(res.msg);
        }
    });
    }
  }

  onSignup() {
    this.router.navigateByUrl('/signup');
  }

  ionViewWillEnter() {
    this.storage.get('hasLoggedIn').then(res => {
      if (res === true) {
        this.router.navigateByUrl('/app/tabs/schedule', { replaceUrl: true });
      } else {
        console.log('ionViewWillEnter else res login', res);
      }
    });

    this.menu.enable(false);
  }

  ionViewWillLeave() {
    // enable the root left menu when leaving the tutorial page
    this.menu.enable(true);
  }
}
