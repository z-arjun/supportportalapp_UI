import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationType } from '../notification-type-enum';
import { AuthenticationService } from '../service/authentication.service';
import { User } from '../service/model/user';
import { NotificationService } from '../service/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  public showLoading: boolean;
  private subcribtions : Subscription[] = [];

  constructor(private router : Router, private authenticationService: AuthenticationService,
     private notificationService : NotificationService) { }

  ngOnInit(): void {
    if(this.authenticationService.isLoggedIn()){
      this.router.navigateByUrl('/user/management')
    }else {
      this.router.navigateByUrl('/login')
    }
  }

  public onLogin( user: User): void {
    this.showLoading = true;
    this.subcribtions.push(
      this.authenticationService.login(user).subscribe(
        (response : HttpResponse<User>) => {
          const token = response.headers.get('Jwt-Token');
          this.authenticationService.saveToken(token);
          this.authenticationService.addUserToLocalCache(response.body);
          this.router.navigateByUrl('/user/management');
          this.showLoading = false;
        },
        (httpErrorResponse : HttpErrorResponse) => {
          console.log(httpErrorResponse);
          this.showLoading = false;
          this.sendErrorNotification(NotificationType.ERROR, httpErrorResponse.error.message);
        }
      )
    )
  }
  private sendErrorNotification(notificationType: NotificationType, message: string) : void{

    if(message){
      this.notificationService.notify(notificationType, message);
    }else {
      this.notificationService.notify(notificationType, "An error occured. Please try again");
    }
  }

  ngOnDestroy(): void {
    this.subcribtions.forEach(sub => sub.unsubscribe());
  }
  
}
