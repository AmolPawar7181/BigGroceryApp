import { Component, OnInit } from '@angular/core';
import { CartService } from '../../providers/cart-service';
import { BehaviorSubject } from 'rxjs';

@Component({
  templateUrl: 'tabs-page.html'
})
export class TabsPage implements OnInit {
  cartItemCount = 0;

  constructor(public cartService: CartService) {}

  ngOnInit() {
    this.cartService.getCartItemCount().subscribe((count) => {
      this.cartItemCount = count;
      console.log('tabs ', this.cartItemCount);
    });
  }
}
