import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonBadge, IonInput } from '@ionic/angular/standalone';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonBadge, CommonModule, IonInput, FormsModule],
})
export class AgendaComponent implements OnInit {
  tarefas: any[] = [];
  tarefasPorData: Map<string, any[]> = new Map();
  tarefasPorDataArray: Array<{data: string, tarefas: any[]}> = [];
  tarefasFiltradas: any[] = []; // Nova propriedade para tarefas filtradas
  loading: boolean = false;
  ordenacaoAscendente: boolean = false; // false = mais recente primeiro (descendente), true = mais antiga primeiro (ascendente)
  termoBusca: string = ''; // Nova propriedade para o termo de busca
  visualizacaoDetalhada: boolean = false; // false = simples, true = detalhada
  projetoSelecionado: string = 'todos'; // 'todos' ou nome do projeto específico
  projetosDisponiveis: string[] = []; // Lista de projetos disponíveis
  projetos: any[] = []; // Lista completa de projetos para buscar nomes
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.carregarTarefas();
    this.carregarProjetos();
  }

  async carregarProjetos() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/projs`));
      this.projetos = Array.isArray(response) ? response : [];
      console.log('Projetos carregados:', this.projetos.length);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      // Não mostrar alerta para projetos, apenas log
    }
  }

  async carregarTarefas() {
    this.loading = true;
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/tasks`));
      
      this.tarefas = Array.isArray(response) ? response : [];
      this.tarefasFiltradas = [...this.tarefas]; // Inicializar tarefas filtradas
      console.log('Tarefas carregadas:', this.tarefas.length);
      
      // Extrair projetos disponíveis
      this.extrairProjetosDisponiveis();
      
      // Organizar tarefas por data
      this.organizarTarefasPorData();
      
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      alert('Erro ao carregar tarefas');
    } finally {
      this.loading = false;
    }
  }

  organizarTarefasPorData() {
    this.tarefasPorData.clear();
    
    // Primeiro, vamos organizar as tarefas filtradas por data
    this.tarefasFiltradas.forEach((tarefa, index) => {
      if (tarefa.data) {
        const data = new Date(tarefa.data);
        
        if (isNaN(data.getTime())) {
          console.log(`Tarefa ${index} data inválida:`, tarefa.data);
          return;
        }
        
        const dataFormatada = this.formatarData(data);
        
        if (!this.tarefasPorData.has(dataFormatada)) {
          this.tarefasPorData.set(dataFormatada, []);
        }
        
        this.tarefasPorData.get(dataFormatada)!.push(tarefa);
      }
    });

    // Agora vamos ordenar por data real, não por string
    const sortedEntries = Array.from(this.tarefasPorData.entries()).sort(([dataA, tarefasA], [dataB, tarefasB]) => {
      // Encontrar a data real mais antiga de cada grupo
      const dataRealA = this.getDataRealMaisAntiga(tarefasA);
      const dataRealB = this.getDataRealMaisAntiga(tarefasB);
      
      // Ordenar cronologicamente baseado na direção escolhida
      if (this.ordenacaoAscendente) {
        // Ascendente: mais antiga primeiro
        return dataRealA.getTime() - dataRealB.getTime();
      } else {
        // Descendente: mais recente primeiro
        return dataRealB.getTime() - dataRealA.getTime();
      }
    });
    
    this.tarefasPorData = new Map(sortedEntries);
    
    // Ordenar tarefas dentro de cada grupo por prioridade (maior para menor)
    this.tarefasPorData.forEach((tarefas, data) => {
      tarefas.sort((a, b) => {
        const prioridadeA = a.prioridade || 2; // Prioridade padrão 2 (Média) se não definida
        const prioridadeB = b.prioridade || 2;
        
        // Ordenar por prioridade: maior número = maior prioridade = aparece primeiro
        return prioridadeB - prioridadeA;
      });
    });
    
    // Atualizar a propriedade para o template
    this.tarefasPorDataArray = Array.from(this.tarefasPorData.entries()).map(([data, tarefas]) => ({
      data,
      tarefas
    }));
    
    console.log('Agenda organizada:', this.tarefasPorDataArray.length, 'seções com', this.tarefasFiltradas.length, 'tarefas');
  }

  formatarData(data: Date): string {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    if (data.toDateString() === hoje.toDateString()) {
      return 'Hoje';
    } else if (data.toDateString() === amanha.toDateString()) {
      return 'Amanhã';
    } else {
      return data.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'concluída':
      case 'concluido':
        return 'var(--ion-color-success)';
      case 'em andamento':
      case 'emandamento':
        return 'var(--ion-color-primary)';
      case 'pendente':
        return 'var(--ion-color-warning)';
      case 'cancelada':
        return 'var(--ion-color-danger)';
      default:
        return 'var(--ion-color-medium)';
    }
  }

  getPrioridadeColor(prioridade: number): string {
    switch (prioridade) {
      case 1: return 'var(--ion-color-success)'; // Baixa
      case 2: return 'var(--ion-color-warning)'; // Média
      case 3: return 'var(--ion-color-danger)'; // Alta
      case 4: return '#8B0000'; // Urgente (vermelho escuro)
      default: return 'var(--ion-color-medium)';
    }
  }

  getPrioridadeNome(prioridade: number): string {
    switch (prioridade) {
      case 1: return 'Baixa';
      case 2: return 'Média';
      case 3: return 'Alta';
      case 4: return 'Urgente';
      default: return 'N/A';
    }
  }

  getProjetoNome(projId: string): string {
    if (!projId) return '';
    const projeto = this.projetos.find(p => p.id == projId);
    return projeto ? projeto.nome : projId;
  }

  // Método para verificar se uma tarefa está concluída
  isTarefaConcluida(status: string): boolean {
    if (!status) return false;
    const statusLower = status.toLowerCase();
    return statusLower === 'concluída' || statusLower === 'concluido' || statusLower === 'concluida';
  }

  navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }

  navegarParaTarefas() {
    this.router.navigate(['/task']);
  }

  // Método para alternar entre ordenação ascendente e descendente
  alternarOrdenacao() {
    this.ordenacaoAscendente = !this.ordenacaoAscendente;
    console.log('Ordenação alterada para:', this.ordenacaoAscendente ? 'Ascendente (mais antiga primeiro)' : 'Descendente (mais recente primeiro)');
    
    // Reorganizar as tarefas com a nova ordenação
    this.organizarTarefasPorData();
  }

  // Método para alternar entre visualização detalhada e simples
  alternarVisualizacao() {
    this.visualizacaoDetalhada = !this.visualizacaoDetalhada;
    console.log('Visualização alterada para:', this.visualizacaoDetalhada ? 'Detalhada' : 'Simples');
  }

  // Método para filtrar tarefas por busca
  filtrarPorBusca(event: any) {
    this.termoBusca = event.target.value;
    this.aplicarFiltro();
  }

  // Método para extrair projetos disponíveis das tarefas
  private extrairProjetosDisponiveis() {
    const projetos = new Set<string>();
    
    this.tarefas.forEach(tarefa => {
      if (tarefa.proj && tarefa.proj.trim() !== '') {
        // Usar o nome do projeto ao invés do ID
        const nomeProjeto = this.getProjetoNome(tarefa.proj);
        if (nomeProjeto) {
          projetos.add(nomeProjeto);
        }
      }
    });
    
    this.projetosDisponiveis = Array.from(projetos).sort();
    console.log('Projetos disponíveis:', this.projetosDisponiveis);
  }

  // Método para aplicar filtro
  aplicarFiltro() {
    let tarefasFiltradas = this.tarefas;

    // Aplicar filtro de projeto
    if (this.projetoSelecionado && this.projetoSelecionado !== 'todos') {
      tarefasFiltradas = tarefasFiltradas.filter(tarefa => {
        return tarefa.proj && this.getProjetoNome(tarefa.proj) === this.projetoSelecionado;
      });
    }

    // Aplicar filtro de busca
    if (this.termoBusca && this.termoBusca.trim() !== '') {
      const termo = this.termoBusca.toLowerCase().trim();
      tarefasFiltradas = tarefasFiltradas.filter(tarefa => {
        return this.tarefaCorrespondeBusca(tarefa, termo);
      });
    }

    this.tarefasFiltradas = tarefasFiltradas;
    
    // Reorganizar as tarefas filtradas por data
    this.organizarTarefasPorData();
  }

  // Método para verificar se uma tarefa corresponde ao termo de busca
  private tarefaCorrespondeBusca(tarefa: any, termo: string): boolean {
    if (!termo) return true;
    
    return (
      // Buscar no nome
      (tarefa.nome && tarefa.nome.toLowerCase().includes(termo)) ||
      // Buscar na descrição
      (tarefa.descricao && tarefa.descricao.toLowerCase().includes(termo)) ||
      // Buscar no status
      (tarefa.status && tarefa.status.toLowerCase().includes(termo)) ||
      // Buscar nas observações
      (tarefa.obs && tarefa.obs.toLowerCase().includes(termo)) ||
      // Buscar no projeto
      (tarefa.proj && this.getProjetoNome(tarefa.proj).toLowerCase().includes(termo)) ||
      // Buscar na prioridade
      (tarefa.prioridade && this.getPrioridadeNome(tarefa.prioridade).toLowerCase().includes(termo)) ||
      // Buscar na data formatada
      (tarefa.data && this.formatarData(new Date(tarefa.data)).toLowerCase().includes(termo))
    );
  }

  // Método para abrir seletor de projetos
  abrirSeletorProjetos() {
    // Criar lista de opções incluindo "Todos os Projetos"
    const opcoes = ['todos', ...this.projetosDisponiveis];
    const opcaoAtual = this.projetoSelecionado;
    
    // Encontrar índice da opção atual
    const indiceAtual = opcoes.indexOf(opcaoAtual);
    
    // Próxima opção (ciclo)
    const proximoIndice = (indiceAtual + 1) % opcoes.length;
    const proximaOpcao = opcoes[proximoIndice];
    
    // Aplicar a próxima opção
    this.alterarProjeto(proximaOpcao);
  }

  // Método para alterar projeto selecionado
  alterarProjeto(projeto: string) {
    this.projetoSelecionado = projeto;
    console.log('Projeto selecionado:', projeto);
    this.aplicarFiltro();
  }

  // Método para limpar busca
  limparBusca() {
    this.termoBusca = '';
    this.aplicarFiltro();
  }

  // Método auxiliar para obter a data real mais antiga de um grupo de tarefas
  private getDataRealMaisAntiga(tarefas: any[]): Date {
    return tarefas.reduce((dataMaisAntiga, tarefa) => {
      const dataTarefa = new Date(tarefa.data);
      return dataTarefa < dataMaisAntiga ? dataTarefa : dataMaisAntiga;
    }, new Date('9999-12-31')); // Data inicial muito futura
  }
}
