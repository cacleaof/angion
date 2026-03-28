import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonInput, IonTextarea, IonSelect, IonSelectOption, ModalController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Input } from '@angular/core';
@Component({
  selector: 'app-add-atv',
  standalone: true,
  templateUrl: './add-atv.component.html',
  styleUrls: ['./add-atv.component.scss'],
   imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonInput, IonTextarea, IonSelect, IonSelectOption, CommonModule, FormsModule],
})
export class AddAtvComponent  implements OnInit {
  showModal: boolean = true;
  novaAtv: any;
   tarefas: any[] = [];
@Input() projid!: number;
@Input() tarefaid!: number;
@Input() atividade!: any;
@Input() editarAtv!: boolean;


    // URL da API do environment
    private apiUrl = environment.apiUrl;
 


  projetos: any[] = [];
    prioridades = [
    { valor: 1, nome: 'Baixa' },
    { valor: 2, nome: 'Média' },
    { valor: 3, nome: 'Alta' },
    { valor: 4, nome: 'Urgente' }
  ];
    statusOptions = ['PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDA', 'CANCELADA'];

  constructor(private modalCtrl: ModalController, private http: HttpClient,) { }

  ngOnInit() { const dataFormatada = new Date().toISOString().split('T')[0]; this.loadProjs(); this.loadTasks(); 

     if(this.atividade){console.log('Atividade recebida:', this.atividade); const atv = this.atividade;

      this.novaAtv = {
        nome: atv?.nome || '',
        descricao: atv?.descricao || '',
        tipo: atv?.tipo || 'ATV',
        uid: atv?.uid || 1,
        proj: this.projid || '',
        task: this.tarefaid || '',
        data: dataFormatada, // Usar a data formatada
        status: atv?.status || 'PENDENTE',
        prioridade: atv?.prioridade || 2,
        dep: atv?.dep || '',
        file: atv?.file || '',
        obs: atv?.obs || ''
      };
     console.log('Ver se entrou dados na novaAtv:', this.novaAtv.nome);}
     else{this.novaAtv = { proj: this.projid || '', task: this.tarefaid || '', data: dataFormatada, status: 'PENDENTE', prioridade: 2, dep: '', file: '', obs: '' }; }
      }

  fecharModal() {
  this.modalCtrl.dismiss();
}

      async loadProjs() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/projs`));
            this.projetos = Array.isArray(response) ? response : [];
             console.log('Projetos carregados:', this.projetos);
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

    async salvarAtv() {
      // Formatar a data para o formato esperado pelo input date
      let dataFormatada = '';
      if (this.novaAtv.data) {
        const data = new Date(this.novaAtv.data);
        if (!isNaN(data.getTime())) {
          dataFormatada = data.toISOString().split('T')[0];
        }
      } else {
        dataFormatada = new Date().toISOString().split('T')[0]; // Data atual como padrão
      }
      
      this.novaAtv = {
        nome: this.novaAtv.nome || '',
        descricao: this.novaAtv.descricao || '',
        tipo: this.novaAtv.tipo || 'ATV',
        uid: this.novaAtv.uid || 1,
        proj: this.novaAtv.proj || '',
        task: this.novaAtv.task || '',
        data: dataFormatada, // Usar a data formatada
        status: this.novaAtv.status || 'PENDENTE',
        prioridade: this.novaAtv.prioridade || 2,
        dep: this.novaAtv.dep || '',
        file: this.novaAtv.file || '',
        obs: this.novaAtv.obs || '',
      };
       // Criar nova Atividade
              const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}/atv/`, this.novaAtv));
              console.log('Atividade criada:', this.novaAtv);
                this.modalCtrl.dismiss();
    }

}
