import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Router} from '@angular/router';
import {environment} from '../../../../environments/environment';
import {CookieService} from 'ngx-cookie-service';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private smartfloreService = environment.smartfloreService;
  private authUrl = environment.serviceAuthBaseUrl;

  http = inject(HttpClient)
  router = inject(Router)

  cookieService = inject(CookieService);
  cookieName = environment.cookieName;
  cookie = this.cookieService.get(this.cookieName)

  login(username: string, password: string): Observable<string> {
    return this.http.post<any>(this.smartfloreService + 'login', {"login": username, "password": password})
  }

  // login(username: any, password: any) {
  //   return this.http.get<any>(this.authUrl + 'connexion?login=' + username + '&password=' + password)
  // }

  logout(): Observable<any> {
    return this.http.get<any>(this.authUrl + 'deconnexion')
  }

  identite(): Observable<any> {
    return this.http.get<any>(this.authUrl + 'identite')
  }

  isAdmin(token: string): Observable<boolean>{
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.get<any>(this.smartfloreService + 'admincheck',{headers} )
  }

  getAuthHeader(): Observable<HttpHeaders> {
    let headers = new HttpHeaders();

    return new Observable(observer => {
      if (this.cookie) {
        this.identite().subscribe({
          next: (data: any) => {
            const token = data.token;
            headers = headers.set("Authorization", token);
            observer.next(headers);
            observer.complete();
          },
          error: (err: any) => {
            console.log(err.message);
            observer.error(err);
          }
        });
      } else {
        observer.next(headers);
        observer.complete();
      }
    });
  }
}
