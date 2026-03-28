import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { IonHeader, IonToolbar, IonButton, IonButtons, IonTitle, IonInput, IonList, IonItem, IonSearchbar, ModalController } from '@ionic/angular/standalone';
import { AddLibComponent } from '../modals/add-lib/add-lib.component';

@Component({
  selector: 'app-lib',
  templateUrl: './lib.component.html',
  styleUrls: ['./lib.component.scss'],
  imports: [IonSearchbar, CommonModule, IonHeader, IonToolbar, IonButton, IonButtons, IonTitle, IonList, IonItem],
  standalone: true
})
export class LibComponent  implements OnInit {
  constructor(  private http: HttpClient,
     private router: Router,
      public modalController: ModalController
  ) { }

  ngOnInit() {this.carregarLibs();}

    // URL da API do environment
  private apiUrl = environment.apiUrl;

  libs: any[] = [];
  libsFiltradas: any[] = this.libs;
  editarLib: any = null;

async carregarLibs() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/libs`));
      this.libs = Array.isArray(response) ? response : [];
      console.log('Projetos carregados:', this.libs);
      } catch (error) {
      console.error('Erro ao carregar bibliotecas:', error);
    }
     this.libsFiltradas = this.libs;
}

  selecionar(lib?: any){ console.log('Biblioteca selecionada:', lib); this.editarLib = lib; this.addLib(lib);}

    async addLib(lib?: any) {
      if(lib){ this.editarLib = true; console.log('Biblioteca selecionada para edição:', lib); }else{ this.editarLib = false;}
          const modal = await this.modalController.create({
            component: AddLibComponent,
            cssClass: 'addLib-modal-class',
             componentProps: {
    
        editarLib: this.editarLib
      }
          });
          return await modal.present();
        }

  filtrarPorBusca(event: any) {
    const valorBusca = event.target.value?.toLowerCase() || '';

  // Se a busca estiver vazia, exibe a lista completa
  if (valorBusca.trim() === '') {
    this.libsFiltradas = [...this.libs];
    return;
  }

  // Filtra comparando nome e descrição
  this.libsFiltradas = this.libs.filter(lib => {
    const nome = lib.nome ? lib.nome.toLowerCase() : '';
    const descricao = lib.descricao ? lib.descricao.toLowerCase() : '';
    
    return nome.includes(valorBusca) || descricao.includes(valorBusca);
  });
  }
  navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }
}