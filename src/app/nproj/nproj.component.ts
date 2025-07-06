import { OnInit } from '@angular/core';
import { Component, EventEmitter, Output } from '@angular/core';
import { ProjService } from '../services/proj.service';
import { Proj } from '../model/proj';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NewProj {
  id: number;
  nome: string;
  descricao: string;
  seq: number;
  adm: number;
  pai: number;
}

@Component({
  selector: 'app-nproj',
  templateUrl: './nproj.component.html',
  styleUrl: './nproj.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class NprojComponent implements OnInit {

  ngOnInit() {
    this.setupInputHandlers();
  }

  novoProjetoNome: string = '';
  novoProjetoDesc: string = '';
  arquivoSelecionado: File | null = null;
  valorTeste: string = '';
  backspaceTestValue: string = '';

  @Output() projetoAdicionado = new EventEmitter<void>();

  constructor(private projService: ProjService) {}

  setupInputHandlers() {
    // Aguardar o DOM ser renderizado
    setTimeout(() => {
      const nomeInput = document.getElementById('nomeProjeto') as HTMLInputElement;
      const descInput = document.getElementById('descProjeto') as HTMLInputElement;
      const testeInput = document.getElementById('testeInput') as HTMLInputElement;

      // Remover todos os listeners manuais - deixar o ngModel funcionar naturalmente
      // Não adicionar listeners manuais que podem interferir
    }, 200);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Verificar se é um PDF
      if (file.type === 'application/pdf') {
        this.arquivoSelecionado = file;
        console.log('Arquivo selecionado:', file.name);
      } else {
        alert('Por favor, selecione apenas arquivos PDF.');
        event.target.value = '';
        this.arquivoSelecionado = null;
      }
    }
  }

  onSubmit(): void {
    console.log('Nome digitado:', `"${this.novoProjetoNome}"`);
    console.log('Comprimento do nome:', this.novoProjetoNome.length);
    console.log('Descrição digitada:', `"${this.novoProjetoDesc}"`);

    // Permitir qualquer conteúdo, incluindo espaços
    if (this.novoProjetoNome !== null && this.novoProjetoNome !== undefined) {
      const projetoData = {
        nome: this.novoProjetoNome,
        descricao: this.novoProjetoDesc
      };

      if (this.arquivoSelecionado) {
        // Criar projeto com PDF
        this.projService.criarProjetoComPDF(projetoData, this.arquivoSelecionado)
          .subscribe({
            next: (novoProj) => {
              console.log('Projeto com PDF adicionado:', novoProj);
              this.novoProjetoNome = '';
              this.novoProjetoDesc = '';
              this.arquivoSelecionado = null;
              this.projetoAdicionado.emit();
            },
            error: (err) => console.error('Erro ao adicionar projeto com PDF:', err)
          });
      } else {
        // Criar projeto sem PDF
        this.projService.addProjeto(projetoData)
          .subscribe({
            next: (novoProj) => {
              console.log('Projeto adicionado:', novoProj);
              this.novoProjetoNome = '';
              this.novoProjetoDesc = '';
              this.projetoAdicionado.emit();
            },
            error: (err) => console.error('Erro ao adicionar projeto:', err)
          });
      }
    } else {
      console.warn('O nome do projeto não pode estar vazio.');
    }
  }

  onKeydown(event: KeyboardEvent) {
    console.log('Template keydown:', event.key, event.keyCode);
    // Não fazer nada, deixar o comportamento padrão funcionar
    return true;
  }

  onTesteKeydown(event: KeyboardEvent) {
    console.log('Template teste keydown:', event.key, event.keyCode);
    // Não fazer nada, deixar o comportamento padrão funcionar
    return true;
  }

  onTesteInput(event: any) {
    this.valorTeste = event.target.value;
    console.log('Teste input:', this.valorTeste);
  }

  onNomeInput(event: any) {
    console.log('Input nome:', event.target.value);
    console.log('Comprimento:', event.target.value.length);
  }

  onDescInput(event: any) {
    console.log('Input descrição:', event.target.value);
    console.log('Comprimento:', event.target.value.length);
  }

  onBackspaceTest(event: KeyboardEvent) {
    console.log('Backspace test:', event.key, event.keyCode, event.type);
    
    if (event.key === 'Backspace') {
      console.log('Backspace detectado!');
      // Não fazer preventDefault
    }
  }
}

