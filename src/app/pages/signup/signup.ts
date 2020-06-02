import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';

import { UserData } from '../../providers/user-data';

import { UserOptions } from '../../interfaces/user-options';
import { ModelService } from '../../providers/models/model-service';
import { BehaviorSubject } from 'rxjs';
import { SmsRetriever } from '@ionic-native/sms-retriever/ngx';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
  styleUrls: ['./signup.scss'],
})
export class SignupPage {
  @ViewChild('ngOtpInput', { static: true }) ngOtpInputRef: any;
  phoneNumber = null;
  zipCodes: any = [];
  signup: UserOptions = { username: '', password: '', phone : this.phoneNumber, address : '', email : '', zip: this.zipCodes };
  otp = null;
  optVerified = false;
  optSent = false;
  signupSubmitted = false;
  sendOTPSubmitted = false;
  verifyOTPSubmitted = false;
  time: BehaviorSubject<string> = new BehaviorSubject('00:00');
  timer: number;

  maxAttempt = 3;
  reSendOTP = false;
  interval: any;
  smsHash = '';
  response: any;

  constructor(
    public router: Router,
    public userData: UserData,
    private menu: MenuController,
    public modelService: ModelService,
    private smsRetriever: SmsRetriever
  ) {
  }

  ionViewWillEnter() {
      this.menu.enable(false);
      this.userData.getAllowedZipCodes()
          .then((res: any) => {
            if (res.success) {
              this.zipCodes = res.data.codes;
            }
          });
  }

  private mobileValidator(num: number) {
    const numBer = num.toString();
    const n7 =  /^7[0-9].*$/;
    const n8 =  /^8[0-9].*$/;
    const n9 =  /^9[0-9].*$/;
    if (numBer.length === 10 && ( n7.test(numBer) || n8.test(numBer) || n9.test(numBer))) {
      return true;
    } else {
      return false;
    }
  }

  onOtpChange(event: any) {
    this.otp = event;
  }

  onSignup(form: NgForm) {
    this.signupSubmitted = true;
    if (form.valid) {
      if (this.areaAvailable(this.signup.zip)) {
        this.modelService.presentLoading('Please wait...');
        this.userData.signup(this.signup)
          .subscribe((res: any) => {
              this.modelService.dismissLoading();
              if (res.success) {
                const msg = 'User created successfully, you will be redirected to login.';
                this.modelService.presentToast(msg, 4000, 'success');
                setTimeout(() => {
                  this.router.navigateByUrl('/login');
                }, 2000);
              } else {
                this.modelService.presentToast(res.msg, 2000, 'danger');
              }
          });
        } else {
          this.modelService.presentToast('Oh ho, Currently we are not delivering in your area. Sorry for inconvenience', 3000, 'danger');
        }
      }
  }

  areaAvailable(zip: any) {
    const index =  this.zipCodes.indexOf(zip);
    return index !== -1 ? true : false;
  }

  sendOTP(form: NgForm) {
    this.sendOTPSubmitted = true;
    if (form.valid) {
      if (this.mobileValidator(this.phoneNumber)) {
        this.modelService.presentLoading('Validating number...');
        this.userData.checkNumber(this.phoneNumber)
            .subscribe((res: any) => {
              this.modelService.dismissLoading();
              if (res.success) {
                this.modelService.presentLoading('Sending OTP...');
                // generate hash then send SMS
                this.smsRetriever.getAppHash()
                    .then((hash: any) => {
                      this.smsHash = hash;
                      this.userData.sendOTP(this.phoneNumber, this.smsHash)
                          .subscribe((resOtp: any) => {
                            this.modelService.dismissLoading();
                            if (resOtp.type === 'success') {
                              this.maxAttempt = this.maxAttempt - 1;
                              this.startTimer(1);
                              this.retriveSMS();
                              this.optSent = true;
                              this.modelService.presentToast('OTP sent successfully', 2000, 'success');
                           } else {
                            this.modelService.presentToast(`err: ${resOtp.message}`, 2000, 'danger');
                           }
                          }, (err: any) => {
                            this.modelService.dismissLoading();
                            this.modelService.presentToast(`err: ${err}`, 2000, 'danger');
                          });
                    });
                } else {
                  this.modelService.presentToast(res.msg, 2000, 'danger');
                }
            }, (err: any) => {
              alert('error checkNumber');
            });
      } else {
        form.controls.phone.setErrors({invalid: true});
        this.sendOTPSubmitted = true;
      }
    }
  }

 async genHash() {
    this.smsRetriever.getAppHash()
        .then((res: any) => {
          this.smsHash = res;
        })
        .catch((error: any) => {
          console.error(error);
        });
  }

  retriveSMS() {
    this.smsRetriever.startWatching()
        .then((res: any) => {
          // <#> 1234 is your 4 digit OTP for Grocery app. LDHDHDS
          const otp = res.Message.toString().substr(4, 4);
          this.ngOtpInputRef.setValue(otp);
        });
  }

  resendOTP() {
    this.reSendOTP = false;
    if (this.maxAttempt > 0) {
        this.modelService.presentLoading('Sending OTP...');
        this.smsRetriever.getAppHash()
            .then((hash: any) => {
              this.smsHash = hash;
              this.userData.sendOTP(this.phoneNumber, this.smsHash)
                  .subscribe((resOtp: any) => {
                    this.modelService.dismissLoading();
                    if (resOtp.type === 'success') {
                      this.maxAttempt = this.maxAttempt - 1;
                      this.startTimer(1);
                      this.retriveSMS();
                      this.optSent = true;
                      this.modelService.presentToast('OTP sent successfully', 2000, 'success');
                    } else {
                      this.modelService.presentToast(`err: ${resOtp.message}`, 2000, 'danger');
                    }
                  });
              })
              .catch((error: any) => {
                console.error(error);
              });
      } else {
        this.modelService.presentToast('You have used all the attempts, please use another number', 2000, 'success');
      }
  }

  startTimer(duration: number) {
    clearInterval(this.interval);
    this.timer = duration * 60;
    this.interval = setInterval( () => {
      this.updateTimeValue();
    }, 1000);
  }

  updateTimeValue() {
    let minutes: any = this.timer / 60;
    let seconds: any = this.timer % 60;

    minutes = String('0' + Math.floor(minutes)).slice(-2);
    seconds = String('0' + Math.floor(seconds)).slice(-2);

    const text = minutes + ':' + seconds;
    this.time.next(text);

    --this.timer;

    if (this.timer < 0) {
      clearInterval(this.interval);
      this.reSendOTP = true;
    }
  }

  async verifyOTP(form: NgForm) {
    this.verifyOTPSubmitted = true;
    if (form.valid) {
      const localOtp = await this.userData.getOTP();
      if (this.otp == localOtp) {
        this.optVerified = true;
        this.userData.removeOTP();
        this.signup.phone = this.phoneNumber;
      } else {
        this.modelService.presentToast('OTP did not matched', 2000, 'danger');
      }
    }
  }

}
