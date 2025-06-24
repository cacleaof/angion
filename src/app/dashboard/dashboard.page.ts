import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AccessibilityService } from '../services/accessibility.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, CommonModule],
})
export class DashboardPage implements OnInit, OnDestroy {
  despesas: any[] = [];
  loading: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private accessibilityService: AccessibilityService
  ) {}

  ngOnInit() {
    this.carregarDespesas();
    this.accessibilityService.setupComponentAccessibility();
  }

  ngOnDestroy() {
    this.accessibilityService.clearFocusOnDestroy();
  }

  async carregarDespesas() {
    this.loading = true;
    try {
      const response: any = await this.http.get('https://adubadica.vercel.app/api/despesas').toPromise();
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
}
