import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonModal, IonInput, IonTextarea } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccessibilityService } from '../services/accessibility.service';

@Component({
  selector: 'app-proj',
  templateUrl: 'proj.component.html',
  styleUrls: ['proj.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonModal, IonInput, IonTextarea, CommonModule, FormsModule],
})
export class ProjComponent implements OnInit, OnDestroy {
  projetos: any[] = [];
  loading: boolean = false;
  showModal: boolean = false;
  editingProjeto: any = null;
  novoProjeto: any = {
    nome: '',
    descricao: '',
    status: '',
    data_inicio: '',
    data_fim: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private accessibilityService: AccessibilityService
  ) {}

  ngOnInit() {
    this.carregarProjetos();
    this.accessibilityService.setupComponentAccessibility();
  }

  ngOnDestroy() {
    this.accessibilityService.clearFocusOnDestroy();
  }

  navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }

  async carregarProjetos() {
    this.loading = true;
    try {
      const response: any = await this.http.get('https://adubadica.vercel.app/api/projs').toPromise();
      this.projetos = Array.isArray(response) ? response : [];
      console.log('Projetos carregados:', this.projetos);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      alert('Erro ao carregar projetos');
    } finally {
      this.loading = false;
    }
  }

  abrirModal(projeto?: any) {
    if (projeto) {
      this.editingProjeto = projeto;
      this.novoProjeto = { ...projeto };
    } else {
      this.editingProjeto = null;
      this.novoProjeto = {
        nome: '',
        descricao: '',
        status: 'Em andamento',
        data_inicio: '',
        data_fim: ''
      };
    }
    this.showModal = true;
  }

  fecharModal() {
    this.showModal = false;
    this.editingProjeto = null;
  }

  async salvarProjeto() {
    if (!this.novoProjeto.nome) {
      alert('Nome do projeto é obrigatório');
      return;
    }

    try {
      if (this.editingProjeto) {
        // Atualizar projeto existente
        await this.http.put(`https://adubadica.vercel.app/api/proj/${this.editingProjeto.id}`, this.novoProjeto).toPromise();
        console.log('Projeto atualizado:', this.novoProjeto);
      } else {
        // Criar novo projeto
        await this.http.post('https://adubadica.vercel.app/api/proj', this.novoProjeto).toPromise();
        console.log('Projeto criado:', this.novoProjeto);
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
        await this.http.delete(`https://adubadica.vercel.app/api/proj/${projeto.id}`).toPromise();
        console.log('Projeto deletado:', projeto);
        this.carregarProjetos();
        alert('Projeto deletado com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar projeto:', error);
        alert('Erro ao deletar projeto');
      }
    }
  }
}
