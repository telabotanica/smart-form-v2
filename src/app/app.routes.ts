import { Routes } from '@angular/router';
import {Home} from './pages/home/home';
import {SingleTrail} from './pages/single-trail/single-trail';
import {MesSentiers} from './pages/mes-sentiers/mes-sentiers';
import {authGuard} from './core/auth/auth-guard';
import {FichePage} from './pages/fiche/fiche';
import {Cgu} from './pages/cgu/cgu';
import {adminGuard} from './core/auth/admin-guard';

export const routes: Routes = [
  {path: '', component: Home, title: "Smart'Flore"},
  {path: 'me', component: MesSentiers, canActivate: [authGuard], title: 'Mes sentiers - Smart\'Flore'},
  {path: 'trail/:id', component: SingleTrail, title: 'sentier - Smart\'Flore'},
  {path: 'fiche/:referentiel/:num_taxonomic/:num_nom', component: FichePage, title: "Fiche Smart'Flore"},
  {path: 'cgu', component: Cgu, title: 'CGU - Smart\'Flore'},
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
    title: "Administration - Smart'Flore",
  },
  // { path: 'unauthorized', component: Unauthorized, title: "Accès refusé - Smart'Flore" },
  // {path: 'lazy', loadChildren: () => import('./features/sentier/components/single-trail/single-trail.module').then(m => m.SingleTrailModule)},
  { path: 'not-found', component: Home , title: "Smart'Flore"},
  { path: '**', redirectTo: 'not-found'}
];
