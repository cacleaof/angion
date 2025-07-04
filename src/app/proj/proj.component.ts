import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonModal, IonInput, IonTextarea, IonBadge } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
// import { AccessibilityService } from '../services/accessibility.service';
import { ProjService } from '../services/proj.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-proj',
  templateUrl: 'proj.component.html',
  styleUrls: ['proj.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonModal, IonInput, IonTextarea, IonBadge, CommonModule, FormsModule],
})
export class ProjComponent implements OnInit, OnDestroy {
  projetos: any[] = [];
  loading: boolean = false;
  showModal: boolean = false;
  editingProjeto: any = null;
  novoProjeto: any = {
    nome: '',
    descricao: '',
    tipo: 'PROJETO',
    uid: 1,
    data: '',
    fim: '',
    status: 'ATIVO',
    prioridade: 2
  };

  // URL da API do environment
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    // private accessibilityService: AccessibilityService,
    private projService: ProjService
  ) {}

  ngOnInit() {
    this.carregarProjetos();
    // this.accessibilityService.setupComponentAccessibility();
  }

  ngOnDestroy() {
    // this.accessibilityService.clearFocusOnDestroy();
  }

  async carregarProjetos() {
    this.loading = true;
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/projs`));
      this.projetos = Array.isArray(response) ? response : [];
      console.log('Projetos carregados:', this.projetos);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      alert('Erro ao carregar projetos');
    } finally {
      this.loading = false;
    }
  }

  navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }

  abrirModal(projeto?: any) {
    if (projeto) {
      this.editingProjeto = projeto;
      // Converter datas para formato YYYY-MM-DD para inputs
      let dataInicio = '';
      let dataFim = '';

      if (projeto.data) {
        const data = new Date(projeto.data);
        if (!isNaN(data.getTime())) {
          dataInicio = data.toISOString().split('T')[0];
        }
      }

      if (projeto.fim) {
        const data = new Date(projeto.fim);
        if (!isNaN(data.getTime())) {
          dataFim = data.toISOString().split('T')[0];
        }
      }

      this.novoProjeto = {
        nome: projeto.nome || '',
        descricao: projeto.descricao || '',
        tipo: projeto.tipo || 'PROJETO',
        uid: projeto.uid || 1,
        data: dataInicio,
        fim: dataFim,
        status: projeto.status || 'ATIVO',
        prioridade: projeto.prioridade || 2
      };
    } else {
      this.editingProjeto = null;
      this.novoProjeto = {
        nome: '',
        descricao: '',
        tipo: 'PROJETO',
        uid: 1,
        data: '',
        fim: '',
        status: 'ATIVO',
        prioridade: 2
      };
    }
    this.showModal = true;
  }

  fecharModal() {
    this.showModal = false;
    this.editingProjeto = null;
  }

  // Função auxiliar para formatar data
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

  async salvarProjeto() {
    if (!this.novoProjeto.nome) {
      alert('Nome do projeto é obrigatório');
      return;
    }

    try {
      // Preparar dados para enviar
      const dadosParaEnviar = {
        nome: this.novoProjeto.nome,
        descricao: this.novoProjeto.descricao || '',
        tipo: this.novoProjeto.tipo || 'PROJETO',
        uid: this.novoProjeto.uid || 1,
        data: this.formatarData(this.novoProjeto.data),
        fim: this.formatarData(this.novoProjeto.fim),
        status: this.novoProjeto.status || 'ATIVO',
        prioridade: this.novoProjeto.prioridade || 2
      };

      if (this.editingProjeto) {
        // Atualizar projeto existente
        console.log('Dados sendo enviados para atualização:', dadosParaEnviar);
        await firstValueFrom(this.http.put(`${this.apiUrl}/proj/${this.editingProjeto.id}`, dadosParaEnviar));
        console.log('Projeto atualizado:', dadosParaEnviar);
      } else {
        // Criar novo projeto
        console.log('Dados sendo enviados para criação:', dadosParaEnviar);
        await firstValueFrom(this.http.post(`${this.apiUrl}/proj/`, dadosParaEnviar));
        console.log('Projeto criado:', dadosParaEnviar);
      }

      this.fecharModal();
      this.carregarProjetos();
      alert(this.editingProjeto ? 'Projeto atualizado com sucesso!' : 'Projeto criado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      alert('Erro ao salvar projeto');
    }
  }

  async deletarProjeto(projeto: any) {
    if (confirm(`Tem certeza que deseja deletar o projeto "${projeto.nome}"?`)) {
      try {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/proj/${projeto.id}`));
        console.log('Projeto deletado:', projeto);
        this.carregarProjetos();
        alert('Projeto deletado com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar projeto:', error);
        alert('Erro ao deletar projeto');
      }
    }
  }

  verDetalhesProjeto(projeto: any) {
    this.router.navigate(['/projeto-detalhe', projeto.id]);
  }

  async marcarComoConcluido(projeto: any) {
    if (confirm(`Tem certeza que deseja marcar o projeto "${projeto.nome}" como concluído?`)) {
      try {
        // Preparar dados para enviar - apenas os campos essenciais
        const dadosParaEnviar = {
          nome: projeto.nome,
          descricao: projeto.descricao || '',
          tipo: projeto.tipo || 'PROJETO',
          uid: projeto.uid || 1,
          data: this.formatarData(projeto.data),
          fim: this.formatarData(projeto.fim),
          status: 'CONCLUÍDO', // Apenas alterar o status
          prioridade: projeto.prioridade || 2
        };

        console.log('Marcando projeto como concluído:', dadosParaEnviar);
        
        await firstValueFrom(this.http.put(`${this.apiUrl}/proj/${projeto.id}`, dadosParaEnviar));
        
        // Atualizar o projeto na lista local
        const index = this.projetos.findIndex(p => p.id === projeto.id);
        if (index !== -1) {
          this.projetos[index] = { ...this.projetos[index], status: 'CONCLUÍDO' };
        }
        
        console.log('Projeto marcado como concluído:', projeto.nome);
        alert('Projeto marcado como concluído com sucesso!');
        
        // Recarregar a lista para garantir sincronização
        this.carregarProjetos();
      } catch (error: any) {
        console.error('Erro ao marcar projeto como concluído:', error);
        console.error('Detalhes do erro:', {
          status: error?.status,
          message: error?.message,
          error: error?.error
        });
        alert('Erro ao marcar projeto como concluído');
      }
    }
  }
}
