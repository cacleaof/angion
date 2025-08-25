import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Primeiro verificar se está logado
    if (!this.authService.isLoggedIn() || !this.authService.isTokenValid()) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return false;
    }
    
    // Depois verificar se é admin
    if (!this.authService.isAdmin()) {
      // Usuário não é admin, redirecionar para dashboard
      this.router.navigate(['/dashboard']);
      return false;
    }
    
    // Usuário é admin, permitir acesso
    this.authService.refreshToken();
    return true;
  }
}
