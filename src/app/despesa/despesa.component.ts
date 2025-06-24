import { Component, OnInit } from '@angular/core';
import { IonButton, IonContent, IonItem, IonLabel, IonList, IonModal, IonInput, IonTextarea, IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-despesa',
  templateUrl: './despesa.component.html',
  styleUrls: ['./despesa.component.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonItem, IonLabel, IonList, IonModal, IonInput, IonTextarea, IonHeader, IonToolbar, IonTitle, IonButtons, CommonModule, FormsModule],
})
export class DespesaComponent implements OnInit {
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

  constructor(private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.carregarDespesas();
  }

  navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }

  async carregarDespesas() {
    this.loading = true;
    try {
      const response: any = await firstValueFrom(this.http.get('http://localhost:3000/api/despesas'));
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

  async salvarDespesa() {
    if (!this.novaDespesa.nome || !this.novaDespesa.valor) {
      alert('Nome e valor da despesa são obrigatórios');
      return;
    }

    try {
      // Preparar dados para salvar
      const dadosParaSalvar = { ...this.novaDespesa };

      // Formatar a data de vencimento se existir
      if (dadosParaSalvar.venc) {
        const data = new Date(dadosParaSalvar.venc);
        if (!isNaN(data.getTime())) {
          dadosParaSalvar.venc = data.toISOString().split('T')[0];
        }
      }

      if (this.editingDespesa) {
        // Atualizar despesa existente
        await firstValueFrom(this.http.put(`http://localhost:3000/api/despesas/${this.editingDespesa.id}`, dadosParaSalvar));
        console.log('Despesa atualizada:', dadosParaSalvar);
      } else {
        // Criar nova despesa
        await firstValueFrom(this.http.post('http://localhost:3000/api/despesas', dadosParaSalvar));
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
        await firstValueFrom(this.http.delete(`http://localhost:3000/api/despesas/${despesa.id}`));
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
      await firstValueFrom(this.http.put(`http://localhost:3000/api/despesas/${despesa.id}`, {
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
