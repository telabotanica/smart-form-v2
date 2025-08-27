import {inject, Injectable} from '@angular/core';
import {CookieService} from "ngx-cookie-service";
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CookiesService {
  private cookieName = environment.cookieName

  cookieService = inject(CookieService);

  checkUserLoggedIn(): boolean{
    const token = this.cookieService.get(this.cookieName);
    return !!token;
  }

  userInfos(token: string): DecodedUser {
    return this.decodeToken(token) as DecodedUser;
  }

  getToken(cookie: string): string {
    const parts = cookie.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token');
    }

    return parts[0];
  }

  decodeToken(token: string): DecodedUser {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token');
    }

    const payload = parts[1];
    const decodedPayload = this.urlSafeBase64Decode(payload);
    return JSON.parse(decodedPayload);
  }

  private urlSafeBase64Decode(input: string): string {
    let str = input.replace(/-/g, '+').replace(/_/g, '/');
    switch (str.length % 4) {
      case 0: { break; }
      case 2: { str += '=='; break; }
      case 3: { str += '='; break; }
      default: {
        throw new Error('Invalid base64 string');
      }
    }
    return atob(str);
  }

}

export type DecodedUser = {
  iss: string;
  token_id: string;
  sub: string;
  iat: number;
  exp: number;
  scopes: string[];
  id: string;
  prenom: string | null;
  nom: string | null;
  pseudo: string;
  intitule: string;
  avatar: string;
  dateDerniereModif: boolean;
  groupes: string[];
  permissions: string[];
  nomWiki: string;
  pseudoUtilise: boolean;
};
