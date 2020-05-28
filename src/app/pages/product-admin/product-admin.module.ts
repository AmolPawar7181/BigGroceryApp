import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ProductAdminPage} from './product-admin';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  declarations: [
    ProductAdminPage,
  ],
  entryComponents: [
    ProductAdminPage,
  ],
  exports: [
    ProductAdminPage,
   ]
})
export class ProductAdminModule { }
