import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NotificationType } from '../notification-type-enum';
import { AuthenticationService } from '../service/authentication.service';
import { CustomHttpResponse } from '../service/model/custom-http-response';
import { FileUploadStatus } from '../service/model/file-upload.status';
import { User } from '../service/model/user';
import { NotificationService } from '../service/notification.service';
import { UserService } from '../service/user.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  private titleSubject = new BehaviorSubject<string>('Users');
  public titleAction$ = this.titleSubject.asObservable();
  public users : User[];
  public user : User;
  refreshing: boolean;
  private subscriptions: Subscription[] = [];
  public selectedUser: User;
  public filename: string;
  public profileImage: File;
  public editUser = new User();
  private currentUserName: string;
  public fileStatus = new FileUploadStatus();


  constructor(private router : Router, private authenticationService : AuthenticationService ,private userService : UserService, private notificationService : NotificationService) { }

  ngOnInit(): void {  
    this.user = this.authenticationService.getUserFromLocalCache();
    this.getUsers(true);
  }

  public changeTitle(title : string):void {
    this.titleSubject.next(title);
  }

  public getUsers(showNotification : boolean): void {
    this.refreshing = true;
    this.subscriptions.push(
      this.userService.getUsers().subscribe(
        (response : User[]) => {
          this.userService.addUsersToLocalStorage(response);
          this.users = response;
          console.log("GetAllUsers : "+this.users);
          this.refreshing = false;
          if(showNotification){
            this.sendNotification(NotificationType.SUCCESS, `${response.length} user(s) loaded successfully.`)
          }
        },
        (httpErrorResponse : HttpErrorResponse) => {
          console.log(httpErrorResponse);
          this.refreshing = false;
          this.sendNotification(NotificationType.ERROR, httpErrorResponse.error.message);
        }
      )
      
    )
  }

  public onSelectUser(selectedUser: User): void {
    this.selectedUser = selectedUser;
    this.clickButton('openUserInfo');
  }

  public onProfileImageChange(filename: string, profileImage : File): void {
    this.filename = filename;
    this.profileImage = profileImage;
    console.log(filename, profileImage);
  }

  public saveNewUser() : void {
    this.clickButton('new-user-save');
  }

  public onAddNewUser(userForm: NgForm): void {
    const formData = this.userService.createUserFormData(null, userForm.value, this.profileImage);
      this.subscriptions.push(
        this.userService.addUser(formData).subscribe(
          (response : User) => {
            this.clickButton('new-user-close');
            this.getUsers(false);
            this.filename = null ;
            this.profileImage = null;
            userForm.reset;
            this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} added successfully`);
          },
          (httpErrorResponse : HttpErrorResponse) => {
            console.log(httpErrorResponse);
            this.refreshing = false;
            this.sendNotification(NotificationType.ERROR, httpErrorResponse.error.message);
            this.profileImage = null;
          }
      )
    );
  }

  public onUpdateUser(): void {
    const formData = this.userService.createUserFormData(this.currentUserName, this.editUser, this.profileImage);
    this.subscriptions.push(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          this.clickButton('closeEditUserModalButton');
          this.getUsers(false);
          this.filename = null;
          this.profileImage = null;
          this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated successfully`);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.profileImage = null;
        }
      )
      );
  }


  public onLogOut() : void {
    this.authenticationService.logOut();
    this.router.navigateByUrl('/login');
    this.sendNotification(NotificationType.SUCCESS, "You have been successfully logged out.");    
  }

  public onUpdateProfileImage(): void {
    const formData = new FormData();
    formData.append('username',this.user.username);
    formData.append('profileImage', this.profileImage);
    this.subscriptions.push(
      this.userService.updateProfileImage(formData).subscribe(
        (event : HttpEvent<any>) => {
          this.reportUploadProgress(event);
        },
        (httpErrorResponse : HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, httpErrorResponse.error.message);
          this.fileStatus.status ='done';
        }
    )
  );
  }
  reportUploadProgress(event: HttpEvent<any>) {
    switch (event.type){
      case HttpEventType.UploadProgress:
        this.fileStatus.percentage= Math.round(100 * event.loaded / event.total)
        this.fileStatus.status ='progress';
        break;
      case HttpEventType.Response:
        if(event.status=== 200){
          this.user.profileImageUrl = `${event.body.profileImageUrl}?time=${new Date().getTime()}`;
          this.sendNotification(NotificationType.SUCCESS, `Profile image updated successfully`);
          this.fileStatus.status ='done';
          break;
        }else{
          this.sendNotification(NotificationType.ERROR, `Unable to upload image, Please try again.`);
          break;
        }
      default:
        'Finished all processes'
    }
  }

  public updateProfileImage(): void {
    this.clickButton('profile-image-input');
  }

  public onUpdateCurrentUser(user : User): void {
    this.currentUserName = user.username;
    this.refreshing= true;
    const formData = this.userService.createUserFormData(this.currentUserName, user, this.profileImage);
      this.subscriptions.push(
        this.userService.updateUser(formData).subscribe(
          (response : User) => {
            this.authenticationService.addUserToLocalCache(user);
            this.getUsers(false);
            this.filename = null ;
            this.profileImage = null;
            this.sendNotification(NotificationType.SUCCESS, `${response.firstName} ${response.lastName} updated successfully`);
            this.refreshing= false;
          },
          (httpErrorResponse : HttpErrorResponse) => {
            console.log(httpErrorResponse);
            this.refreshing = false;
            this.sendNotification(NotificationType.ERROR, httpErrorResponse.error.message);
            this.profileImage = null;
          }
      )
    );
  }

  public onEditUser(editUser : User): void {
    this.editUser = editUser;
    this.currentUserName = editUser.username;
    this.clickButton('openUserEdit');
  }

  public onDeleteUser(username : string){
    this.userService.deleteUser(username).subscribe(
      (response : CustomHttpResponse )=> {
        this.sendNotification(NotificationType.ERROR, response.message);
        this.getUsers(true);
      },
      (httpErrorResponse : HttpErrorResponse) => {
        this.sendNotification(NotificationType.ERROR, httpErrorResponse.error.message);
        this.profileImage = null;
      }
    )
  }

  public searchEmployees(key: string):void{
    const results : User[]= [];
    for(const user of this.users){
      if(user.firstName.toLowerCase().indexOf(key.toLowerCase())!== -1
      || user.lastName.toLowerCase().indexOf(key.toLowerCase())!== -1
      || user.email.toLowerCase().indexOf(key.toLowerCase())!== -1
      || user.username.toLowerCase().indexOf(key.toLowerCase())!== -1)
      {
        results.push(user);
      }
    }
    this.users= results;
    if(results.length == 0 || !key){
      this.getUsers(false);
    }
  }

  public onResetPassword(emailForm: NgForm): void {
    this.refreshing = true;
    const emailAddress = emailForm.value['reset-password-email'];
    this.subscriptions.push(
      this.userService.resetPassword(emailAddress).subscribe(
        (response: CustomHttpResponse) => {
          this.sendNotification(NotificationType.SUCCESS, response.message);
          this.refreshing = false;
        },
        (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.WARNING, error.error.message);
          this.refreshing = false;
        },
        () => emailForm.reset()
      )
    );
  }


  private sendNotification(notificationType: NotificationType, message: string): void {
    if (message) {
      this.notificationService.notify(notificationType, message);
    } else {
      this.notificationService.notify(notificationType, 'An error occurred. Please try again.');
    }
  }
  private clickButton(buttonId: string): void {
    document.getElementById(buttonId).click();
  }
  

}
