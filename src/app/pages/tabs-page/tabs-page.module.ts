import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { TabsPage } from './tabs-page';
import { TabsPageRoutingModule } from './tabs-page-routing.module';
import { MapModule } from '../map/map.module';
import { AboutModule } from '../about/about.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { SessionDetailModule } from '../session-detail/session-detail.module';
import { AboutCompanyModule } from '../about-company/about-company.module';
import { SpeakerListModule } from '../speaker-list/speaker-list.module';
// import { CartModule } from '../cart/cart.module';

@NgModule({
  imports: [
    AboutModule,
    CommonModule,
    IonicModule,
    MapModule,
    ScheduleModule,
    SessionDetailModule,
    AboutCompanyModule,
    SpeakerListModule,
    TabsPageRoutingModule,
    // CartModule
  ],
  declarations: [
    TabsPage,
  ]
})
export class TabsModule { }
