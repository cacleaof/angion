import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AccessibilityService } from '../services/accessibility.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, CommonModule],
})
export class DashboardPage implements OnInit, OnDestroy {
  despesas: any[] = [];
  loading: boolean = false;
  userEmail: string = '';

  // URL da API do environment
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private accessibilityService: AccessibilityService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Verificar se está logado
    if (!this.authService.isLoggedIn()) {
      console.log('Usuário não logado, redirecionando para login...');
      this.router.navigate(['/login']);
      return;
    }

    // Renovar token ao acessar o dashboard
    this.authService.refreshToken();
    
    this.carregarDespesas();
    this.accessibilityService.setupComponentAccessibility();
    
    // Obter email do usuário logado
    this.userEmail = this.authService.getCurrentUserEmail();
    
    console.log('Dashboard carregado para usuário:', this.userEmail);
  }

  ngOnDestroy() {
    this.accessibilityService.clearFocusOnDestroy();
  }

  async carregarDespesas() {
    this.loading = true;
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/despesas`));
      this.despesas = Array.isArray(response) ? response : [];
      console.log('Despesas carregadas:', this.despesas);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      alert('Erro ao carregar despesas');
    } finally {
      this.loading = false;
    }
  }

  navegarParaDespesas() {
    this.router.navigate(['/despesa']);
  }

  navegarParaProjetos() {
    this.router.navigate(['/proj']);
  }

  navegarParaTarefas() {
    this.router.navigate(['/task']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
