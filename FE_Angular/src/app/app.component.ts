import { Component } from '@angular/core';
import { SocialAuthService } from "@abacritt/angularx-social-login";
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs'
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'socialLoginApp';
  user: any;
  loggedIn: any;
  constructor(private authService: SocialAuthService, public _authService: AuthService) {

  }

  ngOnInit() {
    this.authService.authState.subscribe((user: any) => {
      this.user = user;
      this.loggedIn = (user != null);
      console.log({ loggedInAccount: user });
      this.handelSignIn(this.user.idToken)
    });

  }

  async handelSignIn(idToken: any) {
    // this._authService.loginWithGmail({ idToken }).subscribe(
    //   (data) => { console.log(data) }
    // )

    try {

      const data = await firstValueFrom(this._authService.loginWithGmail({ idToken }));
      console.log(data);
      console.log('Success to login');
    } catch (error) {
      console.log('Failed to login');
      // signUp 
      try {
        const data = await firstValueFrom(this._authService.signUpWithGmail({ idToken }));
        console.log(data);
        console.log('Success to signUp');
      } catch (error) {
        console.log(error);
        console.log('Failed to signUp');

      }

    }

  }
}
