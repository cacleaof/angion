import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
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
  IonSelect, 
  IonSelectOption, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonChip,
  IonSpinner,
  IonInput
} from '@ionic/angular/standalone';
import { Task } from '../model/task';
import { Proj } from '../model/proj';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gantt',
  templateUrl: './gantt.component.html',
  styleUrls: ['./gantt.component.scss'],
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
    IonSelect, 
    IonSelectOption, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonBadge,
    IonChip,
    IonSpinner,
    IonInput
  ],
})
export class GanttComponent implements OnInit, OnDestroy {
  projetos: Proj[] = [];
  tarefas: Task[] = [];
  tarefasFiltradas: Task[] = [];
  loading: boolean = false;
  projetoSelecionado: string = '';
  viewMode: 'projeto' | 'tarefas' = 'projeto';
  projetosDisponiveis: string[] = [];
  
  // Propriedades para ordenação e visualização
  ordenacaoAscendente: boolean = false; // false = mais recente primeiro (descendente), true = mais antiga primeiro (ascendente)
  visualizacaoDetalhada: boolean = false; // false = simples, true = detalhada
  
  // Configurações do Gantt
  dataInicio: string = '';
  dataFim: string = '';
  escala: 'dia' | 'semana' | 'mes' = 'semana';
  
  // URL da API
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarDados();
    this.definirPeriodoPadrao();
  }

  ngOnDestroy() {
    // Cleanup se necessário
  }

    navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }

  async carregarDados() {
    this.loading = true;
    try {
      // Carregar projetos e tarefas em paralelo
      const [projetosData, tarefasData] = await Promise.all([
        firstValueFrom(this.http.get<Proj[]>(`${this.apiUrl}/projs`)),
        firstValueFrom(this.http.get<Task[]>(`${this.apiUrl}/tasks`))
      ]);

      this.projetos = projetosData || [];
      this.tarefas = tarefasData || [];
      
      console.log('Projetos carregados:', this.projetos);
      console.log('Tarefas carregadas:', this.tarefas);
      
      // Garantir que os projetos foram carregados antes de obter os disponíveis
      if (this.projetos.length > 0) {
        this.obterProjetosDisponiveis();
        this.filtrarTarefas();
      } else {
        console.warn('Nenhum projeto foi carregado da API');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      this.loading = false;
    }
  }

  definirPeriodoPadrao() {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    this.dataInicio = inicioMes.toISOString().split('T')[0];
    this.dataFim = fimMes.toISOString().split('T')[0];
  }

  filtrarTarefas() {
    console.log('Filtrando tarefas...');
    console.log('Projeto selecionado (ID):', this.projetoSelecionado);
    console.log('Total de tarefas:', this.tarefas.length);
    
    if (this.projetoSelecionado) {
      this.tarefasFiltradas = this.tarefas.filter(tarefa => {
        if (!tarefa.proj) return false;
        // Comparar IDs com conversão de tipo para garantir compatibilidade
        const match = tarefa.proj.toString() === this.projetoSelecionado.toString();
        if (match) {
          console.log('Tarefa encontrada:', tarefa.nome, 'Projeto ID:', tarefa.proj);
        }
        return match;
      });
      console.log('Tarefas filtradas:', this.tarefasFiltradas.length);
    } else {
      this.tarefasFiltradas = [...this.tarefas];
      console.log('Mostrando todas as tarefas:', this.tarefasFiltradas.length);
    }

    // Aplicar ordenação
    this.aplicarOrdenacao();
  }

  // Método para aplicar ordenação nas tarefas filtradas
  private aplicarOrdenacao() {
    if (this.tarefasFiltradas.length === 0) return;

    this.tarefasFiltradas.sort((a, b) => {
      let dataA = a.data ? new Date(a.data).getTime() : 0;
      let dataB = b.data ? new Date(b.data).getTime() : 0;

      // Se não tiver data, usar vencimento
      if (!dataA && a.venc) dataA = new Date(a.venc).getTime();
      if (!dataB && b.venc) dataB = new Date(b.venc).getTime();

      // Se ainda não tiver data, usar prioridade
      if (!dataA) dataA = a.prioridade || 0;
      if (!dataB) dataB = b.prioridade || 0;

      if (this.ordenacaoAscendente) {
        // Ascendente: mais antiga primeiro
        return dataA - dataB;
      } else {
        // Descendente: mais recente primeiro
        return dataB - dataA;
      }
    });

    console.log('Ordenação aplicada:', this.ordenacaoAscendente ? 'Ascendente' : 'Descendente');
  }

  onProjetoChange() {
    this.filtrarTarefas();
  }

  alterarEscala(novaEscala: 'dia' | 'semana' | 'mes') {
    this.escala = novaEscala;
  }

  alterarPeriodo() {
    // Lógica para alterar o período visualizado
    this.filtrarTarefas();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'CONCLUÍDA': return 'success';
      case 'EM ANDAMENTO': return 'warning';
      case 'PROGRAMADO': return 'primary';
      case 'CANCELADA': return 'danger';
      default: return 'medium';
    }
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
    switch (prioridade) {
      case 1: return 'Baixa';
      case 2: return 'Média';
      case 3: return 'Alta';
      case 4: return 'Urgente';
      default: return 'Não definida';
    }
  }

  getProjetoNome(projetoId: string): string {
    console.log('Buscando projeto com ID:', projetoId, 'Tipo:', typeof projetoId);
    console.log('Projetos disponíveis:', this.projetos.map(p => ({ id: p.id, nome: p.nome, tipo: typeof p.id })));
    
    // Tentar encontrar o projeto com diferentes tipos de comparação
    let projeto = this.projetos.find(p => p.id === projetoId);
    
    if (!projeto) {
      // Tentar com conversão de tipo
      projeto = this.projetos.find(p => p.id.toString() === projetoId.toString());
    }
    
    console.log('Projeto encontrado:', projeto);
    
    if (projeto) {
      return projeto.nome;
    } else {
      console.warn('Projeto não encontrado para ID:', projetoId);
      console.warn('IDs dos projetos:', this.projetos.map(p => p.id));
      return 'Projeto não encontrado';
    }
  }

  calcularDuracao(dataInicio: string, dataFim?: string): number {
    if (!dataInicio) return 0;
    
    const inicio = new Date(dataInicio);
    const fim = dataFim ? new Date(dataFim) : new Date();
    
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  getProgresso(tarefa: Task): number {
    if (tarefa.status === 'CONCLUÍDA') return 100;
    if (tarefa.status === 'EM ANDAMENTO') return 50;
    if (tarefa.status === 'PROGRAMADO') return 25;
    return 0;
  }

  getProgressoProjeto(projeto: Proj): number {
    const tarefasProjeto = this.getTarefasProjeto(projeto.id);
    if (tarefasProjeto.length === 0) return 0;
    
    const totalTarefas = tarefasProjeto.length;
    const tarefasConcluidas = tarefasProjeto.filter(t => t.status === 'CONCLUÍDA').length;
    
    return Math.round((tarefasConcluidas / totalTarefas) * 100);
  }

  getTarefasProjeto(projetoId: string): Task[] {
    return this.tarefas.filter(tarefa => tarefa.proj === projetoId);
  }

  formatarData(data: string): string {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'projeto' ? 'tarefas' : 'projeto';
  }

  // Método para alternar entre ordenação ascendente e descendente
  alternarOrdenacao() {
    this.ordenacaoAscendente = !this.ordenacaoAscendente;
    console.log('Ordenação alterada para:', this.ordenacaoAscendente ? 'Ascendente (mais antiga primeiro)' : 'Descendente (mais recente primeiro)');
    
    // Reorganizar as tarefas com a nova ordenação
    this.filtrarTarefas();
  }

  // Método para alternar entre visualização detalhada e simples
  alternarVisualizacao() {
    this.visualizacaoDetalhada = !this.visualizacaoDetalhada;
    console.log('Visualização alterada para:', this.visualizacaoDetalhada ? 'Detalhada' : 'Simples');
  }

  // Método para abrir seletor de projetos (ciclo entre opções)
  abrirSeletorProjetos() {
    // Criar lista de opções incluindo "Todos os Projetos"
    const opcoes = ['', ...this.projetosDisponiveis];
    const opcaoAtual = this.projetoSelecionado;
    
    // Encontrar índice da opção atual
    const indiceAtual = opcoes.indexOf(opcaoAtual);
    
    // Próxima opção (ciclo)
    const proximoIndice = (indiceAtual + 1) % opcoes.length;
    const proximaOpcao = opcoes[proximoIndice];
    
    // Aplicar a próxima opção
    this.alterarProjeto(proximaOpcao);
    console.log('Projeto selecionado (ID):', proximaOpcao);
  }

  // Método para alterar projeto selecionado
  alterarProjeto(projeto: string) {
    this.projetoSelecionado = projeto;
    console.log('Projeto selecionado (ID):', projeto);
    if (projeto) {
      console.log('Nome do projeto:', this.getProjetoNome(projeto));
    }
    this.filtrarTarefas();
  }

  // Método para obter projetos disponíveis das tarefas
  private obterProjetosDisponiveis() {
    const projetos = new Set<string>();
    
    console.log('Analisando tarefas para obter projetos disponíveis...');
    
    this.tarefas.forEach(tarefa => {
      if (tarefa.proj && tarefa.proj.trim() !== '') {
        // Armazenar o ID do projeto, não o nome
        const projetoId = tarefa.proj.toString(); // Garantir que é string
        projetos.add(projetoId);
        console.log('Tarefa:', tarefa.nome, 'Projeto ID:', projetoId, 'Tipo:', typeof projetoId);
      }
    });
    
    this.projetosDisponiveis = Array.from(projetos).sort();
    console.log('Projetos disponíveis (IDs):', this.projetosDisponiveis);
    
    // Verificar se os IDs das tarefas correspondem aos IDs dos projetos
    this.projetosDisponiveis.forEach(projId => {
      const projeto = this.projetos.find(p => p.id === projId);
      if (projeto) {
        console.log('✅ Projeto encontrado:', projId, '->', projeto.nome);
      } else {
        console.warn('❌ Projeto NÃO encontrado para ID:', projId);
      }
    });
  }
}
