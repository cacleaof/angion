import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { IonButton, IonContent, IonItem, IonLabel, IonList, IonModal, IonInput, IonHeader, IonToolbar, IonTitle, IonButtons, IonSelect, IonSelectOption, IonTextarea, IonIcon, IonProgressBar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
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
  imports: [
    IonButton, IonContent, IonItem, IonLabel, IonList, IonModal, IonInput, 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonSelect, IonSelectOption, 
    IonTextarea, IonIcon, IonProgressBar, CommonModule, FormsModule
  ],
})
export class DespesaComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  despesas: any[] = [];
  despesasFiltradas: any[] = [];
  loading: boolean = false;
  showModal: boolean = false;
  editingDespesa: any = null;
  mostrarApenasNaoPagas: boolean = false;
  mostrarApenasMesAtual: boolean = false;
  mostrarApenasProximoMes: boolean = false;
  nomeMesAtual: string = '';
  nomeProximoMes: string = '';
  valorTotal: number = 0;
  novaDespesa: any = {
    nome: '',
    descricao: '',
    valor: '',
    venc: '',
    imagem: '',
    pago: false,
    CD: 'D', // Campo CD com valor padrão 'D' (Débito)
    parc: 1, // Campo parc com valor padrão 1 (parcela atual)
    nparc: 1 // Campo nparc com valor padrão 1 (número total de parcelas)
  };

  // URL da API do environment
  private apiUrl = environment.apiUrl;

  // Adicione esta propriedade
  showCustomTextarea = false;

  // Propriedades para upload de boleto
  boletoImagePreview: string | null = null;
  boletoFile: File | null = null;
  uploading: boolean = false;
  uploadProgress: number = 0;
  uploadError: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
    // private accessibilityService: AccessibilityService
  ) { }

  ngOnInit() {
    this.carregarDespesas();
    this.definirNomesMeses();
    // this.accessibilityService.setupComponentAccessibility();
  }

  ngAfterViewInit() {
    // Removido a manipulação manual do DOM que estava causando o erro
    // O ion-textarea já funciona corretamente com ngModel
  }

  navegarParaHome() {
    this.router.navigate(['/dashboard']);
  }

  definirNomesMeses() {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const dataAtual = new Date();

    // Mês atual
    this.nomeMesAtual = meses[dataAtual.getMonth()];

    // Próximo mês
    const proximoMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1);
    this.nomeProximoMes = meses[proximoMes.getMonth()];
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
      
      // Verificar e criar próximas parcelas automaticamente
      await this.verificarECriarProximasParcelas();
      
      this.aplicarFiltro();
      console.log('Despesas carregadas:', this.despesas);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      alert('Erro ao carregar despesas');
    } finally {
      this.loading = false;
    }
  }

  async verificarECriarProximasParcelas() {
    try {
      const dataAtual = new Date();
      const mesAtual = dataAtual.getMonth();
      const anoAtual = dataAtual.getFullYear();
      
      // Calcular próximo mês
      const proximoMes = new Date(anoAtual, mesAtual + 1, 1);
      const mesProximo = proximoMes.getMonth();
      const anoProximo = proximoMes.getFullYear();

      // 1. Selecionar despesas com nparc > 1 (que têm mais de uma parcela)
      const despesasComParcelas = this.despesas.filter(despesa => 
        despesa.nparc && parseInt(despesa.nparc) > 1
      );

      console.log('Despesas com múltiplas parcelas encontradas:', despesasComParcelas.length);

      // 2. Filtrar despesas com vencimento no mês atual
      const despesasMesAtual = despesasComParcelas.filter(despesa => {
        if (!despesa.venc) return false;
        
        const dataVencimento = new Date(despesa.venc);
        return dataVencimento.getMonth() === mesAtual && 
               dataVencimento.getFullYear() === anoAtual;
      });

      console.log('Despesas do mês atual com múltiplas parcelas:', despesasMesAtual.length);

      // 3. Para cada despesa do mês atual, verificar se já existe a próxima parcela
      const novasParcelas: any[] = [];

      for (const despesa of despesasMesAtual) {
        const nomeDespesa = despesa.nome;
        const parcAtual = parseInt(despesa.parc) || 1;
        const nparcTotal = parseInt(despesa.nparc) || 1;
        
        // Verificar se já existe a próxima parcela no próximo mês
        const existeProximaParcela = this.despesas.some(d => {
          if (d.nome !== nomeDespesa) return false;
          if (!d.venc) return false;
          
          const dataVencimento = new Date(d.venc);
          return dataVencimento.getMonth() === mesProximo && 
                 dataVencimento.getFullYear() === anoProximo;
        });

        // Só criar próxima parcela se não existir e se ainda não chegou ao total
        if (!existeProximaParcela && parcAtual < nparcTotal) {
          // Criar próxima parcela
          const proximaParcela = {
            nome: despesa.nome,
            descricao: despesa.descricao || '',
            valor: despesa.valor,
            venc: this.calcularProximoVencimento(despesa.venc),
            imagem: despesa.imagem || '',
            pago: false,
            CD: despesa.CD || 'D',
            parc: parcAtual + 1, // Próxima parcela
            nparc: nparcTotal // Mantém o total de parcelas
          };

          novasParcelas.push(proximaParcela);
          console.log(`Nova parcela criada: ${despesa.nome} - Parcela ${proximaParcela.parc} de ${proximaParcela.nparc}`);
        }
      }

      // 4. Salvar as novas parcelas no backend
      if (novasParcelas.length > 0) {
        console.log(`Criando ${novasParcelas.length} novas parcelas...`);
        
        for (const novaParcela of novasParcelas) {
          try {
            await firstValueFrom(this.http.post(`${this.apiUrl}/despesa`, novaParcela));
            console.log('Parcela criada com sucesso:', novaParcela.nome, `(Parcela ${novaParcela.parc}/${novaParcela.nparc})`);
          } catch (error) {
            console.error('Erro ao criar parcela:', novaParcela.nome, error);
          }
        }

        // Recarregar despesas para incluir as novas parcelas
        const responseAtualizado: any = await firstValueFrom(this.http.get(`${this.apiUrl}/despesas`));
        this.despesas = Array.isArray(responseAtualizado) ? responseAtualizado : [];
        
        // Reordenar
        this.despesas.sort((a, b) => {
          if (!a.venc) return 1;
          if (!b.venc) return -1;
          return new Date(a.venc).getTime() - new Date(b.venc).getTime();
        });

        console.log(`Processo concluído. ${novasParcelas.length} parcelas criadas.`);
      } else {
        console.log('Nenhuma nova parcela foi criada.');
      }

    } catch (error) {
      console.error('Erro ao verificar e criar próximas parcelas:', error);
    }
  }

  private calcularProximoVencimento(dataVencimentoAtual: string): string {
    if (!dataVencimentoAtual) return '';
    
    const data = new Date(dataVencimentoAtual);
    if (isNaN(data.getTime())) return '';
    
    // Adicionar um mês
    const proximoMes = new Date(data.getFullYear(), data.getMonth() + 1, data.getDate());
    
    // Formatar para YYYY-MM-DD
    return proximoMes.toISOString().split('T')[0];
  }

  filtrarDespesasNaoPagas() {
    this.mostrarApenasNaoPagas = !this.mostrarApenasNaoPagas;
    this.aplicarFiltro();
  }

  filtrarDespesasMesAtual() {
    this.mostrarApenasMesAtual = !this.mostrarApenasMesAtual;
    // Se selecionou o mês atual, desmarca o próximo mês
    if (this.mostrarApenasMesAtual) {
      this.mostrarApenasProximoMes = false;
    }
    this.aplicarFiltro();
  }

  filtrarDespesasProximoMes() {
    this.mostrarApenasProximoMes = !this.mostrarApenasProximoMes;
    // Se selecionou o próximo mês, desmarca o mês atual
    if (this.mostrarApenasProximoMes) {
      this.mostrarApenasMesAtual = false;
    }
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    let despesasFiltradas = this.despesas;

    // Aplicar filtro de mês atual
    if (this.mostrarApenasMesAtual) {
      const dataAtual = new Date();
      const mesAtual = dataAtual.getMonth();
      const anoAtual = dataAtual.getFullYear();

      despesasFiltradas = despesasFiltradas.filter(despesa => {
        if (!despesa.venc) return false;

        const dataVencimento = new Date(despesa.venc);
        return dataVencimento.getMonth() === mesAtual &&
               dataVencimento.getFullYear() === anoAtual;
      });
    }

    // Aplicar filtro de próximo mês
    if (this.mostrarApenasProximoMes) {
      const dataAtual = new Date();
      const proximoMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1);
      const mesProximo = proximoMes.getMonth();
      const anoProximo = proximoMes.getFullYear();

      despesasFiltradas = despesasFiltradas.filter(despesa => {
        if (!despesa.venc) return false;

        const dataVencimento = new Date(despesa.venc);
        return dataVencimento.getMonth() === mesProximo &&
               dataVencimento.getFullYear() === anoProximo;
      });
    }

    // Aplicar filtro de não pagas
    if (this.mostrarApenasNaoPagas) {
      despesasFiltradas = despesasFiltradas.filter(despesa => !despesa.pago);
    }

    this.despesasFiltradas = despesasFiltradas;
    this.calcularValorTotal();
  }

  calcularValorTotal() {
    this.valorTotal = this.despesasFiltradas.reduce((total, despesa) => {
      const valor = parseFloat(despesa.valor) || 0;
      return total + valor;
    }, 0);
    
    console.log('Valor total das despesas filtradas:', this.valorTotal);
  }

  formatarValor(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
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
        pago: despesa.pago || false,
        CD: despesa.CD || 'D',
        parc: despesa.parc || 1,
        nparc: despesa.nparc || 1
      };
    } else {
      this.editingDespesa = null;
      this.novaDespesa = {
        nome: '',
        descricao: '',
        valor: '',
        venc: '',
        imagem: '',
        pago: false,
        CD: 'D',
        parc: 1,
        nparc: 1
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
    this.uploadError = null;
    if (this.boletoFile) {
      try {
        this.uploading = true;
        this.uploadProgress = 0;

        const formData = new FormData();
        formData.append('boleto', this.boletoFile);

        const req = this.http.post<any>(
          `${environment.apiUrl}/upload-boleto`,
          formData,
          {
            reportProgress: true,
            observe: 'events'
          }
        );

        await new Promise<void>((resolve, reject) => {
          req.subscribe({
            next: (event) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                this.uploadProgress = event.loaded / event.total;
              } else if (event.type === HttpEventType.Response) {
                if (event.body && event.body.path) {
                  this.novaDespesa.imagem = event.body.path;
                  resolve();
                } else {
                  this.uploadError = 'Erro ao salvar imagem do boleto.';
                  reject();
                }
              }
            },
            error: (err) => {
              this.uploadError = 'Erro ao enviar imagem do boleto.';
              this.uploading = false;
              reject();
            }
          });
        });

        this.uploading = false;
      } catch (err) {
        this.uploading = false;
        this.uploadError = 'Erro ao enviar imagem do boleto.';
        return;
      }
    }

    if (!this.novaDespesa.nome || !this.novaDespesa.valor) {
      alert('Nome e valor da despesa são obrigatórios');
      return;
    }

    try {
      const dadosParaSalvar = { ...this.novaDespesa };
      dadosParaSalvar.venc = this.formatarData(dadosParaSalvar.venc);

      console.log('Dados sendo enviados:', dadosParaSalvar);

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
      this.uploadError = 'Erro ao salvar despesa.';
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

  // Métodos para upload de boleto
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processImageFile(file);
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const items = event.clipboardData?.items;
    
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            this.processImageFile(file);
            break;
          }
        }
      }
    }
  }

  processImageFile(file: File) {
    // Validação do tipo de arquivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      this.uploadError = 'Formato de imagem não suportado. Use PNG ou JPG.';
      return;
    }
    this.uploadError = null;
    this.boletoFile = file;

    // Preview da imagem
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.boletoImagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removerBoleto(event: Event) {
    event.stopPropagation();
    this.boletoFile = null;
    this.boletoImagePreview = null;
    this.novaDespesa.imagem = '';
  }
}
