import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';

import { UserData } from '../../providers/user-data';
import { ModelService } from '../../providers/models/model-service';

@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
  styleUrls: ['./map.scss']
})
export class MapPage {
  @ViewChild('map',  {static: false}) mapElement: ElementRef;
  map: any;
  addNew: {address: string, zip: any, name: string, phone: number, isDefault: boolean} =
    { address: '', zip: null, name: '', phone: null, isDefault: false};
  lat: any;
  long: any;
  autocomplete: { input: '' };
  autocompleteItems: any[];
  location: any;
  placeid: any;
  GoogleAutocomplete: any;
  user: any;
  addresses: { address: string; isDefault: boolean }[] = [];
  isDefault: any = 0;
  newAddress: any;
  validAddress: false;
  isAddAddress: false;
  submitted = false;
  deliveryAddress: any;
  zipCodes: any = [];

  constructor(
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    public zone: NgZone,
    public platform: Platform,
    public userData: UserData,
    public modalCtrl: ModalController,
    public modelService: ModelService
    ) {  }

    ionViewWillEnter() {
      this.userData.getUserData()
          .then((user: any) => {
            if (user) {
              this.user = user;
              user.addresses.forEach((value, index) => {
                if (value.isDefault) {
                  this.isDefault = index + 0;
                }
              });
              this.addresses = user.addresses;
            }
          });

      this.userData.getAllowedZipCodes()
          .then((res: any) => {
            if (res.success) {
              this.zipCodes = res.data.codes;
            }
          });
    }

    getLocation() {
      const options = {
        enableHighAccuracy: true
      };
      this.geolocation.getCurrentPosition(options).then((resp) => {
        this.lat = resp.coords.latitude;
        this.long = resp.coords.longitude;
        this.getAddressFromCoords(this.lat, this.long);
      })
      .catch((error) => {
        this.modelService.presentToast(error.message, 2000, 'danger');
      });
    }

    checkPinCode(event: any) {
      if (event.target.value.length < 6) {
          this.modelService.presentToast('Please enter valid PIN code', 2000, 'danger');
          return;
      }
      // tslint:disable-next-line: radix
      const zip = parseInt(event.target.value);
      if (!this.areaAvailable(zip)) {
        this.modelService.presentToast('Oh ho, Currently we are not delivering in your area. Sorry for inconvenience', 3000, 'danger');
      }
    }

    areaAvailable(zip: any) {
      const index =  this.zipCodes.indexOf(zip);
      return index !== -1 ? true : false;
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

    getAddressFromCoords(lattitude: any, longitude: any) {
      const options: NativeGeocoderOptions = {
        useLocale: true,
        maxResults: 5
      };
      this.nativeGeocoder.reverseGeocode(lattitude, longitude, options)
        .then((result: NativeGeocoderResult[]) => {
          const cuAddress = `${result[0].areasOfInterest}, ${result[0].subThoroughfare}, ${result[0].subLocality}, ${result[0].locality}, ${result[0].subAdministrativeArea}, ${result[0].postalCode}`;
          this.addNew.zip = result[0].postalCode;
          this.addNew.address = cuAddress;
        })
        .catch((error: any) => {
          this.modelService.presentToast(error, 2000, 'danger');
        });

    }

    addNewAddress(form: NgForm) {
     this.submitted = true;
     if (form.valid) {
      console.log(form.valid, this.addNew);
      if (this.areaAvailable(this.addNew.zip)) {
        if (this.mobileValidator(this.addNew.phone)) {
          this.modelService.presentLoading('');
          this.userData
              .addAddress(this.addNew, this.user.userId)
              .subscribe((res: any) => {
                this.modelService.dismissLoading();
                if (res.success) {
                  const newAddress = JSON.parse(JSON.stringify(this.addNew));
                  this.user.addresses.push(newAddress);
                  console.log(this.user);
                  this.userData.setUserData(this.user).then(() => {
                    this.isAddAddress = false;
                    this.modelService.presentToast(res.msg, 2000, 'success');
                    form.resetForm();
                    this.submitted = false;
                  });
                } else {
                  this.modelService.presentToast(res.msg, 2000, 'danger');
                }
              });
        } else {
          this.modelService.presentToast('Please enter valid phone number', 3000, 'danger');
        }
      } else {
          this.modelService.presentToast('Oh ho, Currently we are not delivering in your area. Sorry for inconvenience', 3000, 'danger');
        }
     }
    }

    selectAddress(event: any) {
      if (event.target.value) {
        const value = (event.target.value).match(/(\d+)/);
        this.deliveryAddress = this.addresses[value[0]];
        this.user.deliveryAddress = this.addresses[value[0]];
        this.userData.setUserData(this.user).then(() => {
          this.dismiss();
        });
      }
    }


  dismiss(data?: any) {
    // using the injected ModalController this page
    // can "dismiss" itself and pass back data
    this.modalCtrl.dismiss(this.user.deliveryAddress);
  }

}
