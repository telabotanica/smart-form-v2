import { Routes } from '@angular/router';
import {Home} from './core/layout/home/home';
import {SingleTrail} from './features/sentier/components/single-trail/single-trail';
import {MesSentiers} from './features/sentier/components/mes-sentiers/mes-sentiers';
import {authGuard} from './core/auth/auth-guard';

export const routes: Routes = [
  {path: '', component: Home},
  {path: 'me', component: MesSentiers, canActivate: [authGuard]},
  {path: 'trail/:id', component: SingleTrail},
  // {path: 'lazy', loadChildren: () => import('./features/sentier/components/single-trail/single-trail.module').then(m => m.SingleTrailModule)},
  { path: 'not-found', component: Home },
  { path: '**', redirectTo: 'not-found'}
];
