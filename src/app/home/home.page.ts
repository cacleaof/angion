import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonModal, IonInput, IonTextarea } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccessibilityService } from '../services/accessibility.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonModal, IonInput, IonTextarea, CommonModule, FormsModule],
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
      const response: any = await this.http.get('https://adubadica.vercel.app/api/despesas').toPromise();
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
        await this.http.put(`https://adubadica.vercel.app/api/despesa/${this.editingDespesa.id}`, this.novaDespesa).toPromise();
        console.log('Despesa atualizada:', this.novaDespesa);
      } else {
        // Criar nova despesa
        await this.http.post('https://adubadica.vercel.app/api/despesas', this.novaDespesa).toPromise();
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
        await this.http.delete(`https://adubadica.vercel.app/api/despesa/${despesa.id}`).toPromise();
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
      await this.http.put(`https://adubadica.vercel.app/api/despesa/${despesa.id}`, {
        ...despesa,
        pago: novoStatus
      }).toPromise();

      despesa.pago = novoStatus;
      console.log('Status de pagamento alterado:', despesa);
      alert(despesa.pago ? 'Despesa marcada como paga!' : 'Despesa marcada como não paga!');
    } catch (error) {
      console.error('Erro ao alterar status de pagamento:', error);
      alert('Erro ao alterar status de pagamento');
    }
  }
}
