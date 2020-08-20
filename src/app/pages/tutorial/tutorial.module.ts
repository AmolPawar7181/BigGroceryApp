import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { TutorialPage } from './tutorial';
import { TutorialPageRoutingModule } from './tutorial-routing.module';
import { NgxLottieViewModule } from 'ngx-lottie-view';
@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    TutorialPageRoutingModule,
    NgxLottieViewModule
  ],
  declarations: [TutorialPage],
  entryComponents: [TutorialPage],
})
export class TutorialModule {}
