import { Component } from '@angular/core';
import { ConferenceData } from '../../providers/conference-data';
import {
  ActionSheetController,
  ToastController,
  Platform,
  LoadingController,
  Config,
  ModalController,
  NavParams,
} from '@ionic/angular';

@Component({
  selector: 'page-speaker-list',
  templateUrl: 'speaker-list.html',
  styleUrls: ['./speaker-list.scss'],
})
export class SpeakerListPage {
  speakers: any[] = [];
  userData: any;

  constructor(public navParams: NavParams) {}

  ionViewWillEnter() {
    const userData = this.navParams.get('userData');
    console.log('userData ', userData);
    if (userData) {
      this.userData = userData;
    }
  }
}
