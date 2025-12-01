import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth';
import { LoginGuard } from './auth/guards/login';
import { GamificacionComponent } from './components/gamificacion/gamificacion.component';
import { AquaTriviaComponent } from './components/gamificacion/aqua-trivia/aqua-trivia.component';
import { AquaBucketComponent } from './components/gamificacion/aqua-bucket/aqua-bucket.component';
import { AquaCardsComponent } from './components/gamificacion/aqua-cards/aqua-cards.component';
import { AquaMatchComponent } from './components/gamificacion/aqua-match/aqua-match.component';
import { AquaSaveComponent } from './components/gamificacion/aqua-save/aqua-save.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/componentLogin/login.component').then(c => c.LoginComponent),
    canActivate: [LoginGuard] 
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'reportes/diario',
    loadComponent: () => import('./components/reports/reporte-diario/reporte-diario.component').then(c => c.ReporteDiarioComponent),
    canActivate: [AuthGuard] 
  },
  {
  path: 'reportes/historico',
  loadComponent: () => import('./components/reports/reporte-historico/reporte-historico.component').then(m => m.ReporteHistoricoComponent),
 canActivate: [AuthGuard]   
  },
  {
    path: 'consumption-prediction',
    loadComponent: () => import('./components/consumption-prediction/consumption-prediction.component').then(c => c.ConsumptionPredictionComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'consumption-alerts',
    loadComponent: () => import('./components/consumption-alerts/consumption-alerts.component').then(c => c.ConsumptionAlertsComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'gamificacion',
    loadComponent: () => import('./components/gamificacion/gamificacion.component').then(c => c.GamificacionComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'account-settings',
    loadComponent: () => import('./components/account-settings/account-settings.component').then(c => c.AccountSettingsComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'privacidad',
    loadComponent: () => import('./components/privacidad/privacidad.component').then(c => c.PrivacidadComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'terminos',
    loadComponent: () => import('./components/terminos/terminos.component').then(c => c.TerminosComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: '404',
    loadComponent: () => import('./utils/not-found/not-found.component').then(c => c.NotFoundComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'events',
    loadComponent: () => import('./components/events/event-list/event-list.component').then(c => c.EventListComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'events/create',
    loadComponent: () => import('./components/events/event-form/event-form.component').then(c => c.EventFormComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'events/edit/:id',
    loadComponent: () => import('./components/events/edit-form/edit-form.component').then(c => c.EditFormComponent),
    canActivate: [AuthGuard] 
  },
    {
    path: 'events/summary',
    loadComponent: () => import('./components/events/event-graphic/event-graphic.component').then(c => c.EventGraphicComponent),
    canActivate: [AuthGuard] 
  },
      {
    path: 'consumo-admin',
    loadComponent: () => import('./components/admin/consumo-admin/consumo-admin.component').then(c => c.ConsumoAdminComponent
    ),
    canActivate: [AuthGuard] 
  },
    {
    path: 'eventos-admin',
    loadComponent: () => import('./components/admin/eventos-admin/eventos-admin.component').then(c => c.EventosAdminComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'localidad-admin',
    loadComponent: () => import('./components/admin/localidad-admin/localidad-admin.component').then(c => c.LocalidadAdminComponent),
    canActivate: [AuthGuard] 
  },
  {
    path: 'gamification-admin',
    loadComponent: () => import('./components/admin/gamification-admin/gamification-admin.component').then(c => c.GamificacionAdminComponent ),
    canActivate: [AuthGuard] 
  },
  { path: 'gamificacion', component: GamificacionComponent },
  { path: 'gamificacion/trivia', component: AquaTriviaComponent },
  { path: 'gamificacion/aqua-bucket', component: AquaBucketComponent },
  { path: 'gamificacion/aqua-cards', component: AquaCardsComponent },
  { path: 'gamificacion/aqua-match', component: AquaMatchComponent },
  { path: 'gamificacion/aqua-save', component: AquaSaveComponent },
  { path: '', redirectTo: 'gamificacion', pathMatch: 'full' },
  { path: '**', redirectTo: 'gamificacion' },
  { path: '**', redirectTo: 'login' } ,

];
