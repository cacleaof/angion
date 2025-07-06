import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonCheckbox, IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonBadge, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccessibilityService } from '../services/accessibility.service';
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
    IonCardContent, IonIcon, CommonModule, FormsModule
  ],
})
export class ProjetoDetalheComponent implements OnInit, OnDestroy {
  projeto: any = null;
  tarefas: any[] = [];
  projetosDependentes: any[] = [];
  tarefasDependentes: any[] = [];
  loading = true;
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
    this.carregarProjeto();
  }

  ngOnDestroy() {
    // Cleanup se necessário
    console.log('ProjetoDetalheComponent destruído');
  }

  async carregarProjeto() {
    try {
      const id = this.route.snapshot.paramMap.get('id');
      console.log('Projeto ID recebido:', id);

      if (!id) {
        console.error('ID do projeto não fornecido');
        this.loading = false;
        return;
      }

      console.log('Carregando projeto com ID:', id);
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/proj/${id}`));
      
      if (Array.isArray(response) && response.length > 0) {
        this.projeto = response[0];
        console.log('Projeto carregado (primeiro item do array):', this.projeto);
        console.log('Nome do projeto carregado:', this.projeto.nome);
        console.log('Estrutura completa do projeto:', JSON.stringify(this.projeto, null, 2));
      } else {
        this.projeto = response;
        console.log('Projeto carregado (objeto único):', this.projeto);
      }

      this.loading = false;
      await this.carregarTarefas();
      await this.carregarProjetosDependentes();
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      this.loading = false;
    }
  }

  // Método para obter o nome do projeto de forma segura
  getProjetoNome(): string {
    if (this.projeto && this.projeto.nome) {
      return this.projeto.nome;
    }
    return 'Projeto';
  }

  // Método para obter a descrição do projeto de forma segura
  getProjetoDescricao(): string {
    if (this.projeto && this.projeto.descricao) {
      return this.projeto.descricao;
    }
    return 'Sem descrição';
  }

  async carregarTarefas() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/tasks`));
      this.tarefas = Array.isArray(response) ? response.filter((tarefa: any) => tarefa.proj == this.projeto.id) : [];
      console.log('Tarefas do projeto carregadas:', this.tarefas);
      console.log('Id do Projeto', this.projeto.id)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  }

  async carregarProjetosDependentes() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/projs`));
      this.projetosDependentes = Array.isArray(response) ? response.filter((proj: any) => proj.dep === this.projeto.id) : [];
      console.log('Projetos dependentes carregados:', this.projetosDependentes);
      await this.carregarTarefasDependentes();
    } catch (error) {
      console.error('Erro ao carregar projetos dependentes:', error);
    }
  }

  async carregarTarefasDependentes() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/tasks`));
      const tarefasDependentes: any[] = [];
      
      this.projetosDependentes.forEach((proj: any) => {
        const tarefasDoProj = Array.isArray(response) ? response.filter((tarefa: any) => tarefa.proj == proj.id) : [];
        tarefasDependentes.push(...tarefasDoProj);
      });
      
      this.tarefasDependentes = tarefasDependentes;
      console.log('Tarefas dos projetos dependentes carregadas:', this.tarefasDependentes);
    } catch (error) {
      console.error('Erro ao carregar tarefas dependentes:', error);
    }
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'concluído':
      case 'concluido':
      case 'finalizado':
        return 'success';
      case 'em andamento':
      case 'andamento':
        return 'warning';
      case 'para fazer':
      case 'pendente':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getEstatisticas() {
    const total = this.tarefas.length;
    const concluidas = this.tarefas.filter(t => this.isConcluida(t)).length;
    const pendentes = this.tarefas.filter(t => !this.isConcluida(t)).length;
    const emAndamento = this.tarefas.filter(t => t.status === 'em andamento').length;
    const percentualConcluido = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return {
      total,
      concluidas,
      pendentes,
      emAndamento,
      percentualConcluido
    };
  }

  getEstatisticasProjeto(projetoId: number) {
    const tarefasDoProj = this.getTarefasDoProjeto(projetoId);
    const total = tarefasDoProj.length;
    const concluidas = tarefasDoProj.filter(t => this.isConcluida(t)).length;
    const percentualConcluido = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return {
      total,
      concluidas,
      percentualConcluido
    };
  }

  getTarefasDoProjeto(projetoId: number) {
    return this.tarefasDependentes.filter(tarefa => tarefa.proj === projetoId);
  }

  isConcluida(tarefa: any): boolean {
    return tarefa.status === 'concluído' || tarefa.status === 'concluido' || tarefa.status === 'finalizado';
  }

  getPrioridadeColor(prioridade: number): string {
    if (prioridade >= 8) return 'danger';
    if (prioridade >= 5) return 'warning';
    return 'success';
  }

  getPrioridadeNome(prioridade: number): string {
    if (prioridade >= 8) return 'Alta';
    if (prioridade >= 5) return 'Média';
    return 'Baixa';
  }

  navegarParaProjetos() {
    this.router.navigate(['/proj']);
  }

  navegarParaProjeto(id: number) {
    this.router.navigate(['/projeto-detalhe', id]);
  }

  navegarParaTarefas() {
    this.router.navigate(['/task']);
  }

  navegarParaHome() {
    this.router.navigate(['/home']);
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
      this.carregarTarefas();
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
        console.log('Tarefa deletada:', tarefa.nome);
        await this.carregarTarefas();
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
      }
    }
  }

  async alterarStatusTarefa(tarefa: any) {
    try {
      const novoStatus = this.isConcluida(tarefa) ? 'para fazer' : 'concluído';
      const response = await firstValueFrom(
        this.http.put(`${this.apiUrl}/task/${tarefa.id}`, {
          ...tarefa,
          status: novoStatus
        })
      );
      console.log('Status da tarefa alterado:', response);
      await this.carregarTarefas();
    } catch (error) {
      console.error('Erro ao alterar status da tarefa:', error);
    }
  }
}