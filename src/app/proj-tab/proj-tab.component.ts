import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjService } from '../services/proj.service';
import { Proj } from '../model/proj';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-proj-tab',
  templateUrl: './proj-tab.component.html',
  styleUrls: ['./proj-tab.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProjTabComponent implements OnInit {
  projetos: Proj[] = [];
  projetosOrdenados: Proj[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(private projService: ProjService) { }

  ngOnInit() {
    this.carregarProjetos();
  }

  async carregarProjetos() {
    try {
      this.loading = true;
      this.error = '';
      
      const response = await firstValueFrom(this.projService.getProjetos());
      this.projetos = response || [];
      
      // Ordenar projetos por dependência
      this.ordenarProjetosPorDependencia();
      
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      this.error = 'Erro ao carregar projetos';
    } finally {
      this.loading = false;
    }
  }

  ordenarProjetosPorDependencia() {
    // Criar um mapa de dependências
    const dependencias = new Map<number, number[]>();
    const projetosMap = new Map<number, Proj>();
    
    // Mapear todos os projetos
    this.projetos.forEach(proj => {
      if (proj.id) {
        const id = parseInt(proj.id);
        projetosMap.set(id, proj);
        
        if (proj.dep) {
          if (!dependencias.has(proj.dep)) {
            dependencias.set(proj.dep, []);
          }
          dependencias.get(proj.dep)!.push(id);
        }
      }
    });

    // Ordenar projetos: primeiro os que não têm dependências, depois os dependentes
    const projetosOrdenados: Proj[] = [];
    const visitados = new Set<number>();

    // Função recursiva para adicionar projetos
    const adicionarProjeto = (proj: Proj) => {
      const id = parseInt(proj.id);
      if (visitados.has(id)) return;
      
      visitados.add(id);
      projetosOrdenados.push(proj);
      
      // Adicionar projetos que dependem deste
      const dependentes = dependencias.get(id) || [];
      dependentes.forEach(depId => {
        const depProj = projetosMap.get(depId);
        if (depProj) {
          adicionarProjeto(depProj);
        }
      });
    };

    // Adicionar projetos que não têm dependências primeiro
    this.projetos.forEach(proj => {
      if (proj.id && !proj.dep) {
        adicionarProjeto(proj);
      }
    });

    // Adicionar projetos restantes
    this.projetos.forEach(proj => {
      if (proj.id && !visitados.has(parseInt(proj.id))) {
        adicionarProjeto(proj);
      }
    });

    this.projetosOrdenados = projetosOrdenados;
  }

  // Verificar se um projeto tem dependentes
  temDependentes(proj: Proj): boolean {
    if (!proj.id) return false;
    return this.projetos.some(p => p.dep === parseInt(proj.id));
  }

  // Obter o projeto dependente
  getProjetoDependente(proj: Proj): Proj | null {
    if (!proj.id) return null;
    return this.projetos.find(p => p.dep === parseInt(proj.id)) || null;
  }

  // Obter o projeto do qual este depende
  getProjetoDependencia(proj: Proj): Proj | null {
    if (!proj.dep) return null;
    return this.projetos.find(p => p.id && parseInt(p.id) === proj.dep) || null;
  }

  // Formatar status do projeto
  formatarStatus(status: string | undefined): string {
    if (!status) return 'Pendente';
    
    switch (status.toLowerCase()) {
      case 'em_andamento':
      case 'em andamento':
        return 'Em Andamento';
      case 'concluido':
      case 'concluído':
        return 'Concluído';
      case 'pausado':
        return 'Pausado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  // Obter cor do status
  getStatusColor(status: string | undefined): string {
    if (!status) return 'var(--ion-color-warning)';
    
    switch (status.toLowerCase()) {
      case 'em_andamento':
      case 'em andamento':
        return 'var(--ion-color-primary)';
      case 'concluido':
      case 'concluído':
        return 'var(--ion-color-success)';
      case 'pausado':
        return 'var(--ion-color-warning)';
      case 'cancelado':
        return 'var(--ion-color-danger)';
      default:
        return 'var(--ion-color-medium)';
    }
  }
}
