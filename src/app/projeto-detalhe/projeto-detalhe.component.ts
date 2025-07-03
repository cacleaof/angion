import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonCheckbox, IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonBadge, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-projeto-detalhe',
  templateUrl: './projeto-detalhe.component.html',
  styleUrls: ['./projeto-detalhe.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, 
    IonButton, IonButtons, IonCheckbox, IonModal, IonInput, IonTextarea, 
    IonSelect, IonSelectOption, IonBadge, IonCard, IonCardHeader, IonCardTitle, 
    IonCardContent, CommonModule, FormsModule
  ],
})
export class ProjetoDetalheComponent implements OnInit {
  projeto: any = null;
  tarefas: any[] = [];
  loading: boolean = false;
  showModal: boolean = false;
  editingTarefa: any = null;
  projetoId: string = '';

  novaTarefa: any = {
    nome: '',
    descricao: '',
    tipo: 'TAREFA',
    uid: 1,
    proj: '',
    data: '',
    status: 'PENDENTE',
    prioridade: 2
  };

  prioridades = [
    { valor: 1, nome: 'Baixa' },
    { valor: 2, nome: 'Média' },
    { valor: 3, nome: 'Alta' },
    { valor: 4, nome: 'Urgente' }
  ];

  statusOptions = ['PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDA', 'CANCELADA'];

  // URL da API do environment
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.projetoId = params['id'];
      if (this.projetoId) {
        this.carregarProjeto();
        this.carregarTarefasDoProjeto();
      }
    });
  }

  async carregarProjeto() {
    this.loading = true;
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/proj/${this.projetoId}`));
      this.projeto = response;
      console.log('Projeto carregado:', this.projeto);
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      alert('Erro ao carregar projeto');
    } finally {
      this.loading = false;
    }
  }

  async carregarTarefasDoProjeto() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/tasks`));
      const todasTarefas = Array.isArray(response) ? response : [];
      
      // Filtrar tarefas que pertencem a este projeto
      this.tarefas = todasTarefas.filter(tarefa => tarefa.proj === this.projetoId);
      console.log('Tarefas do projeto carregadas:', this.tarefas);
    } catch (error) {
      console.error('Erro ao carregar tarefas do projeto:', error);
      alert('Erro ao carregar tarefas do projeto');
    }
  }

  navegarParaProjetos() {
    this.router.navigate(['/proj']);
  }

  abrirModal(tarefa?: any) {
    if (tarefa) {
      this.editingTarefa = tarefa;
      this.novaTarefa = {
        nome: tarefa.nome || '',
        descricao: tarefa.descricao || '',
        tipo: tarefa.tipo || 'TAREFA',
        uid: tarefa.uid || 1,
        proj: this.projetoId, // Sempre usar o ID do projeto atual
        data: this.formatarDataParaInput(tarefa.data),
        status: tarefa.status || 'PENDENTE',
        prioridade: tarefa.prioridade || 2
      };
    } else {
      this.editingTarefa = null;
      this.novaTarefa = {
        nome: '',
        descricao: '',
        tipo: 'TAREFA',
        uid: 1,
        proj: this.projetoId, // Sempre usar o ID do projeto atual
        data: '',
        status: 'PENDENTE',
        prioridade: 2
      };
    }
    this.showModal = true;
  }

  fecharModal() {
    this.showModal = false;
    this.editingTarefa = null;
  }

  private formatarDataParaInput(data: any): string {
    if (!data) return '';
    
    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return data;
    }

    const dataObj = new Date(data);
    if (!isNaN(dataObj.getTime())) {
      return dataObj.toISOString().split('T')[0];
    }

    return '';
  }

  private formatarData(data: any): string | null {
    if (!data) return null;

    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return data;
    }

    const dataObj = new Date(data);
    if (!isNaN(dataObj.getTime())) {
      return dataObj.toISOString().split('T')[0];
    }

    return null;
  }

  async salvarTarefa() {
    if (!this.novaTarefa.nome) {
      alert('Nome da tarefa é obrigatório');
      return;
    }

    try {
      const dadosParaEnviar = {
        nome: this.novaTarefa.nome,
        descricao: this.novaTarefa.descricao || '',
        tipo: this.novaTarefa.tipo || 'TAREFA',
        uid: this.novaTarefa.uid || 1,
        proj: this.projetoId,
        data: this.formatarData(this.novaTarefa.data),
        status: this.novaTarefa.status || 'PENDENTE',
        prioridade: this.novaTarefa.prioridade || 2
      };

      if (this.editingTarefa) {
        await firstValueFrom(this.http.put(`${this.apiUrl}/task/${this.editingTarefa.id}`, dadosParaEnviar));
        console.log('Tarefa atualizada:', dadosParaEnviar);
      } else {
        await firstValueFrom(this.http.post(`${this.apiUrl}/task`, dadosParaEnviar));
        console.log('Tarefa criada:', dadosParaEnviar);
      }

      this.fecharModal();
      this.carregarTarefasDoProjeto();
      alert(this.editingTarefa ? 'Tarefa atualizada com sucesso!' : 'Tarefa criada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      alert('Erro ao salvar tarefa');
    }
  }

  async deletarTarefa(tarefa: any) {
    if (confirm(`Tem certeza que deseja deletar a tarefa "${tarefa.nome}"?`)) {
      try {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/task/${tarefa.id}`));
        console.log('Tarefa deletada:', tarefa);
        this.carregarTarefasDoProjeto();
        alert('Tarefa deletada com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        alert('Erro ao deletar tarefa');
      }
    }
  }

  async alterarStatusTarefa(tarefa: any) {
    try {
      const novoStatus = tarefa.status === 'CONCLUÍDA' ? 'PENDENTE' : 'CONCLUÍDA';
      await firstValueFrom(this.http.put(`${this.apiUrl}/task/${tarefa.id}`, {
        ...tarefa,
        status: novoStatus
      }));

      tarefa.status = novoStatus;
      console.log('Status da tarefa alterado:', tarefa);
    } catch (error) {
      console.error('Erro ao alterar status da tarefa:', error);
      alert('Erro ao alterar status da tarefa');
    }
  }

  isConcluida(tarefa: any): boolean {
    return tarefa.status === 'CONCLUÍDA';
  }

  getPrioridadeColor(prioridade: number): string {
    switch (prioridade) {
      case 1: return 'success';
      case 2: return 'primary';
      case 3: return 'warning';
      case 4: return 'danger';
      default: return 'medium';
    }
  }

  getPrioridadeNome(prioridade: number): string {
    const prioridadeObj = this.prioridades.find(p => p.valor === prioridade);
    return prioridadeObj ? prioridadeObj.nome : 'Média';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'CONCLUÍDA': return 'success';
      case 'EM ANDAMENTO': return 'warning';
      case 'CANCELADA': return 'danger';
      default: return 'medium';
    }
  }

  getEstatisticas() {
    const total = this.tarefas.length;
    const concluidas = this.tarefas.filter(t => t.status === 'CONCLUÍDA').length;
    const pendentes = this.tarefas.filter(t => t.status === 'PENDENTE').length;
    const emAndamento = this.tarefas.filter(t => t.status === 'EM ANDAMENTO').length;
    
    return {
      total,
      concluidas,
      pendentes,
      emAndamento,
      percentualConcluido: total > 0 ? Math.round((concluidas / total) * 100) : 0
    };
  }
} 
