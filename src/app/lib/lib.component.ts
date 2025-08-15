import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { IonHeader, IonToolbar, IonButton, IonButtons, IonTitle, IonInput, IonList, IonItem } from '@ionic/angular/standalone';
@Component({
  selector: 'app-lib',
  templateUrl: './lib.component.html',
  styleUrls: ['./lib.component.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonButton, IonButtons, IonTitle, IonInput, IonList, IonItem],
  standalone: true
})
export class LibComponent  implements OnInit {
  constructor(  private http: HttpClient,
     private router: Router,
  ) { }

  ngOnInit() {this.carregarLibs(); }

    // URL da API do environment
  private apiUrl = environment.apiUrl;

  libs: any[] = [];
async carregarLibs() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/libs`));
      this.libs = Array.isArray(response) ? response : [];
      console.log('Projetos carregados:', this.libs);
      } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
}
  filtrarPorBusca(event: any) {
  }
  navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }
}