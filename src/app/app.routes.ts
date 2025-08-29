import { Routes } from '@angular/router';
import {Home} from './core/layout/home/home';

export const routes: Routes = [
  {path: '', component: Home},
  { path: 'not-found', component: Home },
  { path: '**', redirectTo: 'not-found'}
];
