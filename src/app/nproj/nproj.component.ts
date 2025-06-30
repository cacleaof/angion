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
    this.disableGlobalKeyboardHandlers();
  }

  novoProjetoNome: string = '';
  novoProjetoDesc: string = '';
  valorTeste: string = '';

  @Output() projetoAdicionado = new EventEmitter<void>();

  constructor(private projService: ProjService) {}

  disableGlobalKeyboardHandlers() {
    // Remover listeners globais que podem estar interferindo
    setTimeout(() => {
      // Adicionar nosso próprio listener que permite todas as teclas
      document.addEventListener('keydown', (event) => {
        // Permitir todas as teclas sem interferência
        console.log('Global keydown:', event.key, event.keyCode);
        return true;
      }, true); // Usar capture para interceptar antes dos outros listeners
    }, 100);
  }

  setupInputHandlers() {
    // Aguardar o DOM ser renderizado
    setTimeout(() => {
      const nomeInput = document.getElementById('nomeProjeto') as HTMLInputElement;
      const descInput = document.getElementById('descProjeto') as HTMLInputElement;
      const testeInput = document.getElementById('testeInput') as HTMLInputElement;

      if (nomeInput) {
        // Remover todos os listeners existentes
        nomeInput.removeEventListener('keydown', this.onNomeKeydown);
        nomeInput.removeEventListener('keyup', this.onNomeKeyup);

        // Adicionar novos listeners que não interferem
        nomeInput.addEventListener('keydown', this.onNomeKeydown);
        nomeInput.addEventListener('keyup', this.onNomeKeyup);
      }

      if (descInput) {
        // Remover todos os listeners existentes
        descInput.removeEventListener('keydown', this.onDescKeydown);
        descInput.removeEventListener('keyup', this.onDescKeyup);

        // Adicionar novos listeners que não interferem
        descInput.addEventListener('keydown', this.onDescKeydown);
        descInput.addEventListener('keyup', this.onDescKeyup);
      }

      if (testeInput) {
        // Remover todos os listeners existentes
        testeInput.removeEventListener('keydown', this.onTesteKeydownHandler);

        // Adicionar novos listeners que não interferem
        testeInput.addEventListener('keydown', this.onTesteKeydownHandler);
      }
    }, 200);
  }

  // Handlers que não interferem com o comportamento padrão
  onNomeKeydown = (event: KeyboardEvent) => {
    console.log('Nome keydown:', event.key, event.keyCode);
    // Não fazer nada, deixar o comportamento padrão funcionar
  }

  onNomeKeyup = (event: KeyboardEvent) => {
    console.log('Nome keyup:', event.key, event.keyCode);
  }

  onDescKeydown = (event: KeyboardEvent) => {
    console.log('Descrição keydown:', event.key, event.keyCode);
    // Não fazer nada, deixar o comportamento padrão funcionar
  }

  onDescKeyup = (event: KeyboardEvent) => {
    console.log('Descrição keyup:', event.key, event.keyCode);
  }

  onTesteKeydownHandler = (event: KeyboardEvent) => {
    console.log('Teste keydown:', event.key, event.keyCode);
    // Não fazer nada, deixar o comportamento padrão funcionar
  }

  onSubmit(): void {
    console.log('Nome digitado:', `"${this.novoProjetoNome}"`);
    console.log('Comprimento do nome:', this.novoProjetoNome.length);
    console.log('Descrição digitada:', `"${this.novoProjetoDesc}"`);

    // Permitir qualquer conteúdo, incluindo espaços
    if (this.novoProjetoNome !== null && this.novoProjetoNome !== undefined) {
      this.projService.addProjeto({
        nome: this.novoProjetoNome,
        descricao: this.novoProjetoDesc
      })
        .subscribe({
          next: (novoProj) => {
            console.log('Projeto adicionado:', novoProj);
            this.novoProjetoNome = '';
            this.novoProjetoDesc = '';
            this.projetoAdicionado.emit();
          },
          error: (err) => console.error('Erro ao adicionar projeto:', err)
        });
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

}

