import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'proj',
    loadComponent: () => import('./proj/proj.component').then((m) => m.ProjComponent),
  },
  {
    path: 'nproj',
    loadComponent: () => import('./nproj/nproj.component').then((m) => m.NprojComponent),
  },
  {
    path: 'task',
    loadComponent: () => import('./task/task.component').then((m) => m.TaskComponent),
  },
  {
    path: 'despesa',
    loadComponent: () => import('./despesa/despesa.component').then((m) => m.DespesaComponent),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
