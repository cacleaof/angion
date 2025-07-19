import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonButton, 
  IonButtons, 
  IonCheckbox, 
  IonModal, 
  IonInput, 
  IonTextarea, 
  IonSelect, 
  IonSelectOption, 
  IonBadge 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-proj-task-tab',
  templateUrl: './proj-task-tab.component.html',
  styleUrls: ['./proj-task-tab.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonButton, 
    IonButtons, 
    IonCheckbox, 
    IonModal, 
    IonInput, 
    IonTextarea, 
    IonSelect, 
    IonSelectOption, 
    IonBadge
  ]
})
export class ProjTaskTabComponent implements OnInit {
  tarefas: any[] = [];
  projeto: any = null;
  loading: boolean = false;
  showModal: boolean = false;
  editingTarefa: any = null;
  modoEdicao: boolean = false;
  tarefasSelecionadas: Set<string> = new Set();
  projetoId: string = '';

  novaTarefa: any = {
    nome: '',
    descricao: '',
    tipo: 'TAREFA',
    uid: 1,
    proj: '',
    data: '',
    status: 'PENDENTE',
    prioridade: 2,
    obs: ''
  };

  // Adicionar propriedades para o modal de observações
  showObsModal: boolean = false;
  tarefaParaConcluir: any = null;
  observacao: string = '';

  // URL da API do environment
  private apiUrl = environment.apiUrl;

  prioridades = [
    { valor: 1, nome: 'Baixa' },
    { valor: 2, nome: 'Média' },
    { valor: 3, nome: 'Alta' },
    { valor: 4, nome: 'Urgente' }
  ];

  statusOptions = ['PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDA', 'CANCELADA'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.projetoId = params['projetoId'];
      if (this.projetoId) {
        this.carregarProjeto();
        this.carregarTarefasDoProjeto();
      }
    });
  }

  async carregarProjeto() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/proj/${this.projetoId}`));
      this.projeto = response;
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
    }
  }

  async carregarTarefasDoProjeto() {
    this.loading = true;
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/tasks`));
      // Filtrar tarefas que pertencem ao projeto atual
      this.tarefas = Array.isArray(response) ? response.filter((tarefa: any) => tarefa.proj === this.projetoId) : [];
      console.log('Tarefas do projeto carregadas:', this.tarefas);
    } catch (error) {
      console.error('Erro ao carregar tarefas do projeto:', error);
      alert('Erro ao carregar tarefas do projeto');
    } finally {
      this.loading = false;
    }
  }

  navegarParaProjTab() {
    this.router.navigate(['/projtab']);
  }

  toggleModoEdicao() {
    this.modoEdicao = !this.modoEdicao;
    if (!this.modoEdicao) {
      this.tarefasSelecionadas.clear();
    }
  }

  alternarModoEdicao() {
    this.toggleModoEdicao();
  }

  selecionarTarefa(id: string) {
    if (this.tarefasSelecionadas.has(id)) {
      this.tarefasSelecionadas.delete(id);
    } else {
      this.tarefasSelecionadas.add(id);
    }
  }

  selecionarTodas() {
    if (this.tarefasSelecionadas.size === this.tarefas.length) {
      this.tarefasSelecionadas.clear();
    } else {
      this.tarefas.forEach(tarefa => this.tarefasSelecionadas.add(tarefa.id));
    }
  }

  async deletarSelecionadas() {
    if (this.tarefasSelecionadas.size === 0) {
      alert('Selecione pelo menos uma tarefa para deletar');
      return;
    }

    if (confirm(`Tem certeza que deseja deletar ${this.tarefasSelecionadas.size} tarefa(s)?`)) {
      const promises = Array.from(this.tarefasSelecionadas).map(id =>
        firstValueFrom(this.http.delete(`${this.apiUrl}/task/${id}`))
      );

      try {
        await Promise.all(promises);
        console.log('Tarefas deletadas com sucesso');
        this.tarefasSelecionadas.clear();
        this.modoEdicao = false;
        this.carregarTarefasDoProjeto();
        alert('Tarefas deletadas com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar tarefas:', error);
        alert('Erro ao deletar tarefas');
      }
    }
  }

  async marcarComoConcluidas() {
    if (this.tarefasSelecionadas.size === 0) {
      alert('Selecione pelo menos uma tarefa');
      return;
    }

    try {
      const promises = Array.from(this.tarefasSelecionadas).map(id => {
        const tarefa = this.tarefas.find(t => t.id === id);
        if (tarefa) {
          return firstValueFrom(this.http.put(`${this.apiUrl}/task/${id}`, {
            ...tarefa,
            status: 'CONCLUÍDA'
          }));
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      console.log('Tarefas marcadas como concluídas:', this.tarefasSelecionadas);
      this.tarefasSelecionadas.clear();
      this.modoEdicao = false;
      this.carregarTarefasDoProjeto();
      alert('Tarefas marcadas como concluídas!');
    } catch (error) {
      console.error('Erro ao marcar tarefas:', error);
      alert('Erro ao marcar tarefas');
    }
  }

  async alterarStatus(tarefa: any) {
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

  abrirModal(tarefa?: any) {
    if (tarefa) {
      this.editingTarefa = tarefa;
      this.novaTarefa = { ...tarefa };
    } else {
      this.editingTarefa = null;
      this.novaTarefa = {
        nome: '',
        descricao: '',
        tipo: 'TAREFA',
        uid: 1,
        proj: this.projetoId,
        data: '',
        status: 'PENDENTE',
        prioridade: 2,
        obs: ''
      };
    }
    this.showModal = true;
  }

  fecharModal() {
    this.showModal = false;
    this.editingTarefa = null;
  }

  async salvarTarefa() {
    if (!this.novaTarefa.nome.trim()) {
      alert('Nome da tarefa é obrigatório');
      return;
    }

    try {
      if (this.editingTarefa) {
        // Atualizar tarefa existente
        await firstValueFrom(this.http.put(`${this.apiUrl}/task/${this.editingTarefa.id}`, this.novaTarefa));
        console.log('Tarefa atualizada com sucesso');
      } else {
        // Criar nova tarefa
        await firstValueFrom(this.http.post(`${this.apiUrl}/tasks`, this.novaTarefa));
        console.log('Tarefa criada com sucesso');
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
        console.log('Tarefa deletada com sucesso');
        this.carregarTarefasDoProjeto();
        alert('Tarefa deletada com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        alert('Erro ao deletar tarefa');
      }
    }
  }

  isConcluida(tarefa: any): boolean {
    return tarefa.status === 'CONCLUÍDA' || tarefa.status === 'CONCLUIDA';
  }

  getPrioridadeColor(prioridade: number): string {
    switch (prioridade) {
      case 1: return 'var(--ion-color-success)';
      case 2: return 'var(--ion-color-warning)';
      case 3: return 'var(--ion-color-danger)';
      case 4: return '#8B0000';
      default: return 'var(--ion-color-medium)';
    }
  }

  getPrioridadeNome(prioridade: number): string {
    const prioridadeObj = this.prioridades.find(p => p.valor === prioridade);
    return prioridadeObj ? prioridadeObj.nome : 'Não definida';
  }

  async marcarComoConcluida(tarefa: any) {
    this.tarefaParaConcluir = tarefa;
    this.showObsModal = true;
  }

  async confirmarConclusaoComObs() {
    if (!this.tarefaParaConcluir) return;

    try {
      const observacaoCompleta = this.tarefaParaConcluir.obs 
        ? `${this.tarefaParaConcluir.obs}\n\nConcluída em: ${new Date().toLocaleString('pt-BR')}${this.observacao ? '\nObservação: ' + this.observacao : ''}`
        : `Concluída em: ${new Date().toLocaleString('pt-BR')}${this.observacao ? '\nObservação: ' + this.observacao : ''}`;

      await firstValueFrom(this.http.put(`${this.apiUrl}/task/${this.tarefaParaConcluir.id}`, {
        ...this.tarefaParaConcluir,
        status: 'CONCLUÍDA',
        obs: observacaoCompleta
      }));

      console.log('Tarefa marcada como concluída com observação');
      this.fecharObsModal();
      this.carregarTarefasDoProjeto();
      alert('Tarefa marcada como concluída!');
    } catch (error) {
      console.error('Erro ao marcar tarefa como concluída:', error);
      alert('Erro ao marcar tarefa como concluída');
    }
  }

  fecharObsModal() {
    this.showObsModal = false;
    this.tarefaParaConcluir = null;
    this.observacao = '';
  }
}
