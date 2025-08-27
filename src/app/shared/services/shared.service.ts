import {Injectable, signal} from '@angular/core';
import {Errors} from '../../core/models/errors.model';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  // errors = signal<Errors>({ errors: {} });
}
