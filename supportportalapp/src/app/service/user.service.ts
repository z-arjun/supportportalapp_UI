import { HttpClient, HttpErrorResponse, HttpEvent, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from './model/user';
import { JwtHelperService } from "@auth0/angular-jwt";
import { CustomHttpResponse } from './model/custom-http-response';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public host = environment.apiUrl;

  constructor(private http : HttpClient) { }

  public getUsers() : Observable< User[] | HttpErrorResponse > {
    return this.http.get<User[]>(`${this.host}/user/list`);
  }

  public addUser(formData : FormData) : Observable< User | HttpErrorResponse > {
    return this.http.post<User>(`${this.host}/user/add`, formData);
  }

  public updateUser(formData : FormData) : Observable<User | HttpErrorResponse > {
    return this.http.post<User>(`${this.host}/user/update`, formData);
  }

  public resetPassword(email : string) : Observable<CustomHttpResponse | HttpErrorResponse > {
    return this.http.get<CustomHttpResponse>(`${this.host}/user/resetpassword/${email}`);
  } 

  public updateProfileImage(formData : FormData) : Observable< HttpEvent<User>  | HttpErrorResponse > {
    return this.http.post<User>(`${this.host}/user/updateProfileImage`, formData, 
    {
      reportProgress: true,
      observe : 'events'
    });
  }

  public deleteUser(username : string) : Observable< CustomHttpResponse | HttpErrorResponse > {
    return this.http.delete<CustomHttpResponse>(`${this.host}/user/delete/${username}`);
  }

  public addUsersToLocalStorage(users : User[]) : void {
    localStorage.setItem('users', JSON.stringify(users))
  }

  public getUsersToLocalStorage(users : User[]) : void {
    if(localStorage.getItem('users')){
      return JSON.parse(localStorage.getItem('users'));
    }
    return null;
  }

  public createUserFormData(loggedInUsername: string, user: User, profileImage : File): FormData{
    const formData = new FormData();
    formData.append('currentUsername', loggedInUsername);
    formData.append('firstName', user.firstName);
    formData.append('lastName', user.lastName);
    formData.append('username', user.username);
    formData.append('email', user.email);
    formData.append('profileImage', profileImage);
    formData.append('role', user.role);
    formData.append('isNonLocked', JSON.stringify(user.notLocked));
    formData.append('isActive', JSON.stringify(user.active));
    return formData;
  }
}
