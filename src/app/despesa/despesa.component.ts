import { Component, OnInit, AfterViewInit } from '@angular/core';
import { IonButton, IonContent, IonItem, IonLabel, IonList, IonModal, IonInput, IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
// import { AccessibilityService } from '../services/accessibility.service';

@Component({
  selector: 'app-despesa',
  templateUrl: './despesa.component.html',
  styleUrls: ['./despesa.component.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonItem, IonLabel, IonList, IonModal, IonInput, IonHeader, IonToolbar, IonTitle, IonButtons, CommonModule, FormsModule],
})
export class DespesaComponent implements OnInit, AfterViewInit {
  despesas: any[] = [];
  loading: boolean = false;
  showModal: boolean = false;
  editingDespesa: any = null;
  novaDespesa: any = {
    nome: '',
    descricao: '',
    valor: '',
    venc: '',
    imagem: '',
    pago: false
  };

  // URL da API do environment
  private apiUrl = environment.apiUrl;

  // Adicione esta propriedade
  showCustomTextarea = false;

  constructor(
    private http: HttpClient,
    private router: Router
    // private accessibilityService: AccessibilityService
  ) { }

  ngOnInit() {
    this.carregarDespesas();
    // this.accessibilityService.setupComponentAccessibility();
  }

  ngAfterViewInit() {
    // Aguardar o modal ser renderizado
    setTimeout(() => {
      const textarea = document.querySelector('ion-textarea textarea') as HTMLTextAreaElement;
      if (textarea) {
        console.log('Textarea encontrado:', textarea);

        // Adicionar listener para verificar se está funcionando
        textarea.addEventListener('input', (event) => {
          console.log('Input event:', event);
          console.log('Valor atual:', (event.target as HTMLTextAreaElement).value);
        });

        // Testar se consegue digitar
        textarea.focus();
        textarea.value = 'Teste com espaços 123';
        console.log('Valor após teste:', textarea.value);
      }
    }, 500);
  }

  navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }

  async carregarDespesas() {
    this.loading = true;
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/despesas`));
      this.despesas = Array.isArray(response) ? response : [];
      // Ordenar pelo vencimento (do mais próximo para o mais distante)
      this.despesas.sort((a, b) => {
        if (!a.venc) return 1;
        if (!b.venc) return -1;
        return new Date(a.venc).getTime() - new Date(b.venc).getTime();
      });
      console.log('Despesas carregadas:', this.despesas);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      alert('Erro ao carregar despesas');
    } finally {
      this.loading = false;
    }
  }

  abrirModal(despesa?: any) {
    if (despesa) {
      this.editingDespesa = despesa;
      // Converter a data para o formato YYYY-MM-DD para o input type="date"
      let dataVencimento = '';
      if (despesa.venc) {
        const data = new Date(despesa.venc);
        if (!isNaN(data.getTime())) {
          dataVencimento = data.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        }
      }

      this.novaDespesa = {
        nome: despesa.nome || '',
        descricao: despesa.descricao || '',
        valor: despesa.valor || '',
        venc: dataVencimento,
        imagem: despesa.imagem || '',
        pago: despesa.pago || false
      };
    } else {
      this.editingDespesa = null;
      this.novaDespesa = {
        nome: '',
        descricao: '',
        valor: '',
        venc: '',
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

  async salvarDespesa() {
    if (!this.novaDespesa.nome || !this.novaDespesa.valor) {
      alert('Nome e valor da despesa são obrigatórios');
      return;
    }

    try {
      const dadosParaSalvar = { ...this.novaDespesa };
      dadosParaSalvar.venc = this.formatarData(dadosParaSalvar.venc);

      if (this.editingDespesa) {
        await firstValueFrom(this.http.put(`${this.apiUrl}/despesa/${this.editingDespesa.id}`, dadosParaSalvar));
        console.log('Despesa atualizada:', dadosParaSalvar);
      } else {
        await firstValueFrom(this.http.post(`${this.apiUrl}/despesa`, dadosParaSalvar));
        console.log('Despesa criada:', dadosParaSalvar);
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
        await firstValueFrom(this.http.delete(`${this.apiUrl}/despesa/${despesa.id}`));
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
      const dadosParaEnviar = { ...despesa, pago: novoStatus };
      dadosParaEnviar.venc = this.formatarData(dadosParaEnviar.venc);

      await firstValueFrom(this.http.put(`${this.apiUrl}/despesa/${despesa.id}`, dadosParaEnviar));

      despesa.pago = novoStatus;
      console.log('Status de pagamento alterado:', despesa);
      alert(despesa.pago ? 'Despesa marcada como paga!' : 'Despesa marcada como não paga!');
    } catch (error) {
      console.error('Erro ao alterar status de pagamento:', error);
      alert('Erro ao alterar status de pagamento');
    }
  }

  onDescricaoInput(event: any) {
    console.log('Valor da descrição:', event.target.value);
    console.log('Tipo do valor:', typeof event.target.value);
  }

  // Adicione este método
  toggleCustomTextarea() {
    this.showCustomTextarea = !this.showCustomTextarea;
  }

  onTextareaInput(event: any) {
    console.log('Textarea input:', event.target.value);
    this.novaDespesa.descricao = event.target.value;
  }

  onTextareaKeydown(event: any) {
    console.log('Keydown event:', event.key);
    // Permitir todas as teclas, incluindo espaço
    return true;
  }
}
