import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FivGalleryModule } from '@fivethree/core';

import { SpeakerListPage } from './speaker-list';
import { SpeakerListPageRoutingModule } from './speaker-list-routing.module';
// import { ImageGalleryPageModule } from '../image-gallery/image-gallery.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SpeakerListPageRoutingModule,
    FivGalleryModule,
   // ImageGalleryPageModule
  ],
  declarations: [SpeakerListPage],
})
export class SpeakerListModule {}
