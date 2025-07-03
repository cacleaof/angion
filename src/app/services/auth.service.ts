import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  name?: string;
  // Adicione outros campos conforme necessário
}

export interface AuthToken {
  token: string;
  expiresAt: number;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  constructor(private router: Router) {
    // Verificar se há usuário salvo no localStorage
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    try {
      const savedUser = localStorage.getItem(this.USER_KEY);
      const tokenExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      
      if (savedUser && tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        const currentTime = Date.now();
        
        // Verificar se o token não expirou (30 dias)
        if (currentTime < expiryTime) {
          const user = JSON.parse(savedUser);
          this.currentUserSubject.next(user);
          console.log('Usuário carregado automaticamente:', user.email);
        } else {
          // Token expirado, limpar dados
          this.clearStoredData();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário do storage:', error);
      this.clearStoredData();
    }
  }

  private clearStoredData() {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  login(user: User) {
    // Gerar token simples (em produção, use JWT)
    const token = this.generateToken();
    const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 dias
    
    // Salvar dados no localStorage
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    this.currentUserSubject.next(user);
    
    console.log('Usuário logado com sucesso:', user.email);
  }

  logout() {
    this.clearStoredData();
    this.currentUserSubject.next(null);
    console.log('Usuário deslogado');
  }

  private generateToken(): string {
    // Gerar token simples (em produção, use JWT)
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUserEmail(): string {
    const user = this.currentUserSubject.value;
    return user ? user.email : '';
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Verificar se o token ainda é válido
  isTokenValid(): boolean {
    const tokenExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!tokenExpiry) return false;
    
    const expiryTime = parseInt(tokenExpiry);
    const currentTime = Date.now();
    
    return currentTime < expiryTime;
  }

  // Renovar o token (chamado quando o usuário faz alguma ação)
  refreshToken() {
    if (this.isLoggedIn()) {
      const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 dias
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      console.log('Token renovado');
    }
  }
} 
