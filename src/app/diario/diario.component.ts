import { Component, OnInit } from '@angular/core';
import { IonList, IonBadge, IonIcon, IonItem, IonContent, IonHeader, IonButton, IonToolbar, IonLabel, IonTitle, IonButtons, IonSelect, ModalController, IonSelectOption, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AddAtvComponent } from '../modals/add-atv/add-atv.component';

@Component({
  selector: 'app-diario',
  templateUrl: './diario.component.html',
  styleUrls: ['./diario.component.scss'],
  standalone: true,
  imports: [IonRow, IonBadge, IonButtons, IonContent, IonList, IonIcon, IonItem, IonSelect, IonSelectOption, CommonModule, IonHeader, IonButton, IonToolbar, IonLabel, IonTitle, IonGrid, IonCol],
})
export class DiarioComponent  implements OnInit {
  tarefas: any[] = [];
  atvs: any[] = [];
  editarAtv: any = null;
  projetos: any[] = [];
  projeto: any = null;
 // URL da API do environment
  private apiUrl = environment.apiUrl;
 mostrarTodas: boolean = true;
 mostrarTA: boolean = true;

 selTask: any = null;

 natv: any = {
  nome: '',
  descricao: '',
  uid:'',
  proj:'',
  task:'',
  data: '',
  status: '',
  prioridade: '',
  dep:'',
};

  constructor(private http: HttpClient, 
               private router: Router,
               public modalController: ModalController
  ){}

  ngOnInit() {  this.loadTasks(); this.loadAtvs(); this.loadProjs()}

    navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }

  mudarMostrarTodas() {
  this.mostrarTodas = !this.mostrarTodas;
  this.selTask = null;}

  listarTA(){this.mostrarTA = !this.mostrarTA;}
  
  seleciona(tarefa?: any) {
    this.selTask = tarefa || null;
    console.log('Tarefa selecionada:', tarefa.proj, tarefa.nome );
    this.loadProj(tarefa.proj);
  }
  
  async addAtv(atv?: any) {
    if(atv){ this.editarAtv = true; console.log('Atividade selecionada para edição:', atv); }else{ this.editarAtv = false;}
        const modal = await this.modalController.create({
          component: AddAtvComponent,
          cssClass: 'addAtv-modal-class',
           componentProps: {
      projid: this.projeto.id,   
      tarefaid: this.selTask.id,
      atividade: atv ? atv : null,
      editarAtv: this.editarAtv
    }
        });
        return await modal.present();
      }

  async loadProj(projid: number) {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/proj/${projid}`));
        this.projeto = Array.isArray(response) ? response[0] : response;
            console.log('Projeto encontrado:', this.projeto);
    } catch (error) {
      console.error('Erro:', error);
    }  }
    
  async loadTasks() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/tasks`));
            this.tarefas = Array.isArray(response) ? response : [];
             console.log('Tarefas carregados:', this.tarefas);
    } catch (error) {
      console.error('Erro:', error);
    }  }
    
  async loadAtvs() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/atvs`));
            this.atvs = Array.isArray(response) ? response : [];
             console.log('Atvs carregados:', this.atvs);
    } catch (error) {
      console.error('Erro:', error);
    }  }
    async loadProjs() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/projs`));
            this.projetos = Array.isArray(response) ? response : [];
             console.log('Projetos carregados:', this.projetos);
    } catch (error) {
      console.error('Erro:', error);
    }  }
}
