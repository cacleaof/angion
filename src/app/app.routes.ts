import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
    canActivate: [LoginGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'despesa',
    loadComponent: () => import('./despesa/despesa.component').then(m => m.DespesaComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'proj',
    loadComponent: () => import('./proj/proj.component').then(m => m.ProjComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'projeto-detalhe/:id',
    loadComponent: () => import('./projeto-detalhe/projeto-detalhe.component').then(m => m.ProjetoDetalheComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'task',
    loadComponent: () => import('./task/task.component').then(m => m.TaskComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'nproj',
    loadComponent: () => import('./nproj/nproj.component').then(m => m.NprojComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'projtab',
    loadComponent: () => import('./proj-tab/proj-tab.component').then(m => m.ProjTabComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'proj-task-tab/:projetoId',
    loadComponent: () => import('./proj-task-tab/proj-task-tab.component').then(m => m.ProjTaskTabComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'lib',
    loadComponent: () => import('./lib/lib.component').then(m => m.LibComponent),
    canActivate: [AuthGuard]
  }
];
