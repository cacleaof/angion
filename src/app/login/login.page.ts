import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, FormsModule],
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';
  loading: boolean = false;

  // URL da API do environment
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Verificar se já está logado
    if (this.authService.isLoggedIn() && this.authService.isTokenValid()) {
      console.log('Usuário já logado, redirecionando...');
      this.router.navigate(['/dashboard']);
    }
  }

  async login() {
    if (!this.email || !this.password) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    this.loading = true;

    try {
      // Primeiro, buscar todos os usuários para verificar se existe
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/users`));
      const users: any[] = Array.isArray(response) ? response : [];

      // Procurar o usuário pelo email
      const user = users.find(u => u.email === this.email);

      if (!user) {
        alert('Email não encontrado');
        return;
      }

      // Verificar a senha (assumindo que está armazenada em texto plano ou hash)
      if (user.password !== this.password) {
        alert('Senha incorreta');
        return;
      }

      console.log('Login bem-sucedido:', user);
      
      // Usar o serviço de autenticação para salvar o usuário
      this.authService.login(user);
      
      alert('Login realizado com sucesso!');

      // Redirecionar para o dashboard após login
      this.router.navigate(['/dashboard']);

    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro no login. Verifique suas credenciais.');
    } finally {
      this.loading = false;
    }
  }
}
