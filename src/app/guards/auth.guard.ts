import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn() && this.authService.isTokenValid()) {
      // Renovar o token quando o usuário acessa uma rota protegida
      this.authService.refreshToken();
      return true;
    } else {
      // Usuário não está logado ou token expirado
      this.authService.logout();
      this.router.navigate(['/login']);
      return false;
    }
  }
} 
