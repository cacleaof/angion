import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonCheckbox, IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonBadge, IonIcon } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
//import { AccessibilityService } from '../services/accessibility.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-task',
  templateUrl: 'task.component.html',
  styleUrls: ['task.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonCheckbox, IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonBadge, IonIcon, CommonModule, FormsModule],
})
export class TaskComponent implements OnInit, OnDestroy {
  tarefas: any[] = [];
  tarefasFiltradas: any[] = []; // Nova propriedade para tarefas filtradas
  projetos: any[] = [];
  loading: boolean = false;
  showModal: boolean = false;
  editingTarefa: any = null;
  modoEdicao: boolean = false;
  tarefasSelecionadas: Set<string> = new Set();
  termoBusca: string = ''; // Nova propriedade para o termo de busca

  novaTarefa: any = {
    nome: '',
    descricao: '',
    tipo: 'TAREFA',
    uid: 1,
    proj: '',
    data: '',
    status: 'PENDENTE',
    prioridade: 2,
    obs: '',
    audio: '' // Novo campo para armazenar o áudio
  };

  // Propriedades para gravação de voz
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  isRecording: boolean = false;
  audioUrl: string | null = null;
  audioFile: File | null = null;

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
    //private accessibilityService: AccessibilityService
  ) {}

  ngOnInit() {
    this.carregarTarefas();
    this.carregarProjetos();
    //this.accessibilityService.setupComponentAccessibility();
  }

  ngOnDestroy() {
    //this.accessibilityService.clearFocusOnDestroy();
  }

  navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }

  async carregarTarefas() {
    this.loading = true;
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/tasks`));
      this.tarefas = Array.isArray(response) ? response : [];
      console.log('Tarefas carregadas:', this.tarefas);
      this.aplicarFiltro(); // Aplicar filtro após carregar tarefas
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      alert('Erro ao carregar tarefas');
    } finally {
      this.loading = false;
    }
  }

  async carregarProjetos() {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/projs`));
      this.projetos = Array.isArray(response) ? response : [];
      console.log('Projetos carregados:', this.projetos);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  }

  // Método para filtrar por busca
  filtrarPorBusca(event: any) {
    this.termoBusca = event.target.value || '';
    this.aplicarFiltro();
  }

  limparBusca() {
    this.termoBusca = '';
    this.aplicarFiltro();
  }

  // Método para aplicar filtro
  aplicarFiltro() {
    let tarefasFiltradas = this.tarefas;

    // Aplicar filtro de busca
    if (this.termoBusca && this.termoBusca.trim() !== '') {
      const termo = this.termoBusca.toLowerCase().trim();
      tarefasFiltradas = tarefasFiltradas.filter(tarefa => {
        return this.tarefaCorrespondeBusca(tarefa, termo);
      });
    }

    // Ordenar por data (mais recentes primeiro) e depois por prioridade
    tarefasFiltradas = tarefasFiltradas.sort((a, b) => {
      // Se uma tarefa não tem data, coloca no final
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      
      // Comparar datas de vencimento
      const dataA = new Date(a.data);
      const dataB = new Date(b.data);
      
      // Ordem decrescente (mais recentes primeiro)
      const comparacaoData = dataB.getTime() - dataA.getTime();
      
      // Se as datas são iguais, ordenar por prioridade (mais alta primeiro)
      if (comparacaoData === 0) {
        const prioridadeA = a.prioridade || 2;
        const prioridadeB = b.prioridade || 2;
        return prioridadeB - prioridadeA;
      }
      
      return comparacaoData;
    });

    this.tarefasFiltradas = tarefasFiltradas;
  }

  // Método para verificar se uma tarefa corresponde ao termo de busca
  private tarefaCorrespondeBusca(tarefa: any, termo: string): boolean {
    if (!termo || termo.trim() === '') {
      return true; // Se não há termo de busca, incluir todas
    }

    const termoLower = termo.toLowerCase().trim();
    
    // Buscar no nome
    if (tarefa.nome && tarefa.nome.toLowerCase().includes(termoLower)) {
      return true;
    }
    
    // Buscar na descrição
    if (tarefa.descricao && tarefa.descricao.toLowerCase().includes(termoLower)) {
      return true;
    }
    
    // Buscar na observação
    if (tarefa.obs && tarefa.obs.toLowerCase().includes(termoLower)) {
      return true;
    }
    
    // Buscar no status
    if (tarefa.status && tarefa.status.toLowerCase().includes(termoLower)) {
      return true;
    }
    
    // Buscar no tipo
    if (tarefa.tipo && tarefa.tipo.toLowerCase().includes(termoLower)) {
      return true;
    }
    
    // Buscar na prioridade (por nome)
    if (tarefa.prioridade) {
      const prioridadeNome = this.getPrioridadeNome(tarefa.prioridade).toLowerCase();
      if (prioridadeNome.includes(termoLower)) {
        return true;
      }
    }
    
    // Buscar na data
    if (tarefa.data) {
      const dataTarefa = new Date(tarefa.data);
      const dataFormatada = dataTarefa.toLocaleDateString('pt-BR');
      if (dataFormatada.includes(termoLower)) {
        return true;
      }
    }
    
    // Buscar no projeto
    if (tarefa.proj) {
      const projetoNome = this.getProjetoNome(tarefa.proj).toLowerCase();
      if (projetoNome.includes(termoLower)) {
        return true;
      }
    }
    
    return false;
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
    if (this.tarefasSelecionadas.size === this.tarefasFiltradas.length) {
      this.tarefasSelecionadas.clear();
    } else {
      this.tarefasFiltradas.forEach(tarefa => this.tarefasSelecionadas.add(tarefa.id));
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
      
      // Remover tarefas da lista original
      Array.from(this.tarefasSelecionadas).forEach(id => {
        const index = this.tarefas.findIndex(t => t.id === id);
        if (index !== -1) {
          this.tarefas.splice(index, 1);
        }
      });
      
      this.tarefasSelecionadas.clear();
      this.modoEdicao = false;
      this.aplicarFiltro(); // Aplicar filtro para atualizar a lista filtrada
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
      
      // Atualizar status na lista original
      Array.from(this.tarefasSelecionadas).forEach(id => {
        const index = this.tarefas.findIndex(t => t.id === id);
        if (index !== -1) {
          this.tarefas[index].status = 'CONCLUÍDA';
        }
      });
      
      this.tarefasSelecionadas.clear();
      this.modoEdicao = false;
      this.aplicarFiltro(); // Aplicar filtro para atualizar a lista filtrada
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
      
      // Atualizar também na lista original
      const index = this.tarefas.findIndex(t => t.id === tarefa.id);
      if (index !== -1) {
        this.tarefas[index].status = novoStatus;
      }
      
      this.aplicarFiltro(); // Reaplicar filtro após alteração
    } catch (error) {
      console.error('Erro ao alterar status da tarefa:', error);
      alert('Erro ao alterar status da tarefa');
    }
  }

  abrirModal(tarefa?: any) {
    if (tarefa) {
      this.editingTarefa = tarefa;
      
      // Formatar a data para o formato esperado pelo input date
      let dataFormatada = '';
      if (tarefa.data) {
        const data = new Date(tarefa.data);
        if (!isNaN(data.getTime())) {
          dataFormatada = data.toISOString().split('T')[0];
        }
      }
      
      this.novaTarefa = {
        nome: tarefa.nome || '',
        descricao: tarefa.descricao || '',
        tipo: tarefa.tipo || 'TAREFA',
        uid: tarefa.uid || 1,
        proj: tarefa.proj || '',
        data: dataFormatada, // Usar a data formatada
        status: tarefa.status || 'PENDENTE',
        prioridade: tarefa.prioridade || 2,
        obs: tarefa.obs || '',
        audio: tarefa.audio || ''
      };

      // Configurar áudio se existir
      if (tarefa.audio && tarefa.audio !== '') {
        this.audioUrl = `${this.apiUrl}/audio/${tarefa.audio}`;
      }
    } else {
      this.editingTarefa = null;
      this.novaTarefa = {
        nome: '',
        descricao: '',
        tipo: 'TAREFA',
        uid: 1,
        proj: '',
        data: '',
        status: 'PENDENTE',
        prioridade: 2,
        obs: '',
        audio: ''
      };
      
      // Limpar dados de áudio
      this.removerAudio();
    }
    this.showModal = true;
  }

  fecharModal() {
    this.showModal = false;
    this.editingTarefa = null;
    
    // Limpar dados de áudio
    this.removerAudio();
  }

  async salvarTarefa() {
    if (!this.novaTarefa.nome) {
      alert('Nome da tarefa é obrigatório');
      return;
    }

    try {
      // Fazer upload do áudio se existir
      let audioPath = null;
      if (this.audioFile) {
        audioPath = await this.uploadAudio();
        if (audioPath) {
          this.novaTarefa.audio = audioPath;
        }
      }

      if (this.editingTarefa) {
        // Atualizar tarefa existente
        const response = await firstValueFrom(this.http.put(`${this.apiUrl}/task/${this.editingTarefa.id}`, this.novaTarefa));
        console.log('Tarefa atualizada:', this.novaTarefa);
        
        // Atualizar na lista original
        const index = this.tarefas.findIndex(t => t.id === this.editingTarefa.id);
        if (index !== -1) {
          this.tarefas[index] = { ...this.tarefas[index], ...this.novaTarefa };
        }
      } else {
        // Criar nova tarefa
        const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}/task/`, this.novaTarefa));
        console.log('Tarefa criada:', this.novaTarefa);
        
        // Adicionar à lista original se a resposta contém o ID
        if (response && response.id) {
          this.tarefas.push({ ...this.novaTarefa, id: response.id });
        }
      }

      this.fecharModal();
      this.aplicarFiltro(); // Aplicar filtro para atualizar a lista filtrada
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
        
        // Remover da lista original
        const index = this.tarefas.findIndex(t => t.id === tarefa.id);
        if (index !== -1) {
          this.tarefas.splice(index, 1);
        }
        
        this.aplicarFiltro(); // Aplicar filtro para atualizar a lista filtrada
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
      
      // Atualizar também na lista original
      const index = this.tarefas.findIndex(t => t.id === tarefa.id);
      if (index !== -1) {
        this.tarefas[index].status = novoStatus;
      }
      
      alert(tarefa.status === 'CONCLUÍDA' ? 'Tarefa marcada como concluída!' : 'Tarefa marcada como pendente!');
      this.aplicarFiltro(); // Reaplicar filtro após alteração
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
      case 4: return '#e74c3c'; // Urgente
      case 3: return '#e67e22'; // Alta
      case 2: return '#f39c12'; // Média
      case 1: return '#27ae60'; // Baixa
      default: return '#95a5a6';
    }
  }

  getPrioridadeNome(prioridade: number): string {
    const prioridadeObj = this.prioridades.find(p => p.valor === prioridade);
    return prioridadeObj ? prioridadeObj.nome : 'Média';
  }

  getProjetoNome(projId: string): string {
    if (!projId) return '';
    const projeto = this.projetos.find(p => p.id == projId);
    return projeto ? projeto.nome : projId;
  }

  async marcarComoConcluida(tarefa: any) {
    // Abrir modal para edição da observação
    this.tarefaParaConcluir = tarefa;
    this.observacao = tarefa.obs || '';
    this.showObsModal = true;
  }

  async confirmarConclusaoComObs() {
    if (!this.tarefaParaConcluir) {
      return;
    }

    try {
      // Preparar dados para enviar
      const dadosParaEnviar = {
        nome: this.tarefaParaConcluir.nome,
        descricao: this.tarefaParaConcluir.descricao || '',
        tipo: this.tarefaParaConcluir.tipo || 'TAREFA',
        uid: this.tarefaParaConcluir.uid || 1,
        proj: this.tarefaParaConcluir.proj || '',
        data: this.formatarData(this.tarefaParaConcluir.data),
        status: 'CONCLUÍDA', // Alterar status para concluída
        prioridade: this.tarefaParaConcluir.prioridade || 2,
        obs: this.observacao // Incluir a observação
      };

      console.log('Marcando tarefa como concluída com observação:', dadosParaEnviar);
      
      await firstValueFrom(this.http.put(`${this.apiUrl}/task/${this.tarefaParaConcluir.id}`, dadosParaEnviar));
      
      // Atualizar a tarefa na lista local
      const index = this.tarefas.findIndex(t => t.id === this.tarefaParaConcluir.id);
      if (index !== -1) {
        this.tarefas[index] = { 
          ...this.tarefas[index], 
          status: 'CONCLUÍDA',
          obs: this.observacao
        };
      }
      
      // Atualizar também na lista filtrada se existir
      const indexFiltrado = this.tarefasFiltradas.findIndex(t => t.id === this.tarefaParaConcluir.id);
      if (indexFiltrado !== -1) {
        this.tarefasFiltradas[indexFiltrado] = { 
          ...this.tarefasFiltradas[indexFiltrado], 
          status: 'CONCLUÍDA',
          obs: this.observacao
        };
      }
      
      console.log('Tarefa marcada como concluída:', this.tarefaParaConcluir.nome);
      alert('Tarefa marcada como concluída com sucesso!');
      
      // Fechar modal e limpar dados
      this.fecharObsModal();
      
      // Aplicar filtro para atualizar a lista filtrada
      this.aplicarFiltro();
    } catch (error: any) {
      console.error('Erro ao marcar tarefa como concluída:', error);
      console.error('Detalhes do erro:', {
        status: error?.status,
        message: error?.message,
        error: error?.error
      });
      alert('Erro ao marcar tarefa como concluída');
    }
  }

  fecharObsModal() {
    this.showObsModal = false;
    this.tarefaParaConcluir = null;
    this.observacao = '';
  }

  // Função auxiliar para formatar data (se não existir)
  private formatarData(data: any): string | null {
    if (!data) return null;

    // Se já está no formato YYYY-MM-DD
    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return data;
    }

    // Converter para formato YYYY-MM-DD
    const dataObj = new Date(data);
    if (!isNaN(dataObj.getTime())) {
      return dataObj.toISOString().split('T')[0];
    }

    return null;
  }

  // Métodos para gravação de voz
  async iniciarGravacao() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.isRecording = true;
      this.novaTarefa.nome = 'Gravado';

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.audioUrl = URL.createObjectURL(audioBlob);
        this.audioFile = new File([audioBlob], `audio_${Date.now()}.wav`, { type: 'audio/wav' });
        this.novaTarefa.audio = this.audioFile.name;
        
        // Parar todas as faixas do stream
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      console.log('Gravação iniciada');
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao acessar microfone. Verifique as permissões.');
    }
  }

  pararGravacao() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      console.log('Gravação parada');
    }
  }

  reproduzirAudio() {
    if (this.audioUrl) {
      const audio = new Audio(this.audioUrl);
      audio.play();
    }
  }

  removerAudio() {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
    this.audioUrl = null;
    this.audioFile = null;
    this.novaTarefa.audio = '';
    this.audioChunks = [];
  }

  // Método para fazer upload do áudio
  async uploadAudio(): Promise<string | null> {
    if (!this.audioFile) {
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('audio', this.audioFile);

      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/upload-audio`, formData)
      );

      if (response && response.path) {
        return response.path;
      }
      return null;
    } catch (error) {
      console.error('Erro ao fazer upload do áudio:', error);
      return null;
    }
  }
}
