import { Routes } from '@angular/router';
import {Home} from './pages/home/home';
import {SingleTrail} from './pages/single-trail/single-trail';
import {MesSentiers} from './pages/mes-sentiers/mes-sentiers';
import {authGuard} from './core/auth/auth-guard';
import {Fiche} from './pages/fiche/fiche';

export const routes: Routes = [
  {path: '', component: Home},
  {path: 'me', component: MesSentiers, canActivate: [authGuard]},
  {path: 'trail/:id', component: SingleTrail},
  {path: 'fiche/:referentiel/:num_taxonomic/:num_nom', component: Fiche},
  // {path: 'lazy', loadChildren: () => import('./features/sentier/components/single-trail/single-trail.module').then(m => m.SingleTrailModule)},
  { path: 'not-found', component: Home },
  { path: '**', redirectTo: 'not-found'}
];
