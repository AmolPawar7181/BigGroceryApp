import { Injectable } from '@angular/core';
import { CanLoad, Router, CanActivate } from '@angular/router';
import { Storage } from '@ionic/storage';
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private storage: Storage, private router: Router) {}

  canActivate() {
    return this.storage.get('hasLoggedIn').then(res => {
      if (res) {
        return true;
      } else {
        this.router.navigate(['login']);
        return false;
      }
    });
  }
}
