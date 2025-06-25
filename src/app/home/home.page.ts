import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccessibilityService } from '../services/accessibility.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, CommonModule, FormsModule],
})
export class HomePage implements OnInit, OnDestroy {
  despesas: any[] = [];
  loading: boolean = false;
  showModal: boolean = false;
  editingDespesa: any = null;
  novaDespesa: any = {
    nome: '',
    descricao: '',
    valor: '',
    imagem: '',
    pago: false
  };

  // URL da API do environment
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private accessibilityService: AccessibilityService
  ) {}

  ngOnInit() {
    this.carregarDespesas();
    this.accessibilityService.setupComponentAccessibility();
  }

  ngOnDestroy() {
    this.accessibilityService.clearFocusOnDestroy();
  }

  async carregarDespesas() {
    this.loading = true;
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/despesas`));
      this.despesas = Array.isArray(response) ? response : [];
      console.log('Despesas carregadas:', this.despesas);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      alert('Erro ao carregar despesas');
    } finally {
      this.loading = false;
    }
  }

  navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }

  navegarParaDespesas() {
    this.router.navigate(['/home']);
  }

  navegarParaProjetos() {
    this.router.navigate(['/proj']);
  }

  navegarParaTarefas() {
    this.router.navigate(['/task']);
  }

  abrirModal(despesa?: any) {
    if (despesa) {
      this.editingDespesa = despesa;
      this.novaDespesa = {
        nome: despesa.nome || '',
        descricao: despesa.descricao || '',
        valor: despesa.valor || '',
        imagem: despesa.imagem || '',
        pago: despesa.pago || false
      };
    } else {
      this.editingDespesa = null;
      this.novaDespesa = {
        nome: '',
        descricao: '',
        valor: '',
        imagem: '',
        pago: false
      };
    }
    this.showModal = true;
  }

  fecharModal() {
    this.showModal = false;
    this.editingDespesa = null;
  }

  async salvarDespesa() {
    if (!this.novaDespesa.nome || !this.novaDespesa.valor) {
      alert('Nome e valor da despesa são obrigatórios');
      return;
    }

    try {
      if (this.editingDespesa) {
        // Atualizar despesa existente
        await firstValueFrom(this.http.put(`${this.apiUrl}/despesas/${this.editingDespesa.id}`, this.novaDespesa));
        console.log('Despesa atualizada:', this.novaDespesa);
      } else {
        // Criar nova despesa
        await firstValueFrom(this.http.post(`${this.apiUrl}/despesas`, this.novaDespesa));
        console.log('Despesa criada:', this.novaDespesa);
      }

      this.fecharModal();
      this.carregarDespesas();
      alert(this.editingDespesa ? 'Despesa atualizada com sucesso!' : 'Despesa criada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa');
    }
  }

  async deletarDespesa(despesa: any) {
    if (confirm(`Tem certeza que deseja deletar a despesa "${despesa.nome}"?`)) {
      try {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/despesas/${despesa.id}`));
        console.log('Despesa deletada:', despesa);
        this.carregarDespesas();
        alert('Despesa deletada com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar despesa:', error);
        alert('Erro ao deletar despesa');
      }
    }
  }

  async marcarComoPaga(despesa: any) {
    try {
      const novoStatus = !despesa.pago;
      await firstValueFrom(this.http.put(`${this.apiUrl}/despesas/${despesa.id}`, {
        ...despesa,
        pago: novoStatus
      }));

      despesa.pago = novoStatus;
      console.log('Status de pagamento alterado:', despesa);
      alert(despesa.pago ? 'Despesa marcada como paga!' : 'Despesa marcada como não paga!');
    } catch (error) {
      console.error('Erro ao alterar status de pagamento:', error);
      alert('Erro ao alterar status de pagamento');
    }
  }
}
