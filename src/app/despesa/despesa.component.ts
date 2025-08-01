import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { 
  IonButton, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonList, 
  IonModal, 
  IonInput, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonSelect, 
  IonSelectOption, 
  IonTextarea, 
  IonIcon, 
  IonProgressBar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular/standalone';
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
    IonButton, 
    IonContent, 
    IonItem, 
    IonLabel, 
    IonList, 
    IonModal, 
    IonInput, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonSelect, 
    IonSelectOption, 
    IonTextarea, 
    IonIcon, 
    IonProgressBar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CommonModule, 
    FormsModule
  ],
})
export class DespesaComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  despesas: any[] = [];
  despesasFiltradas: any[] = [];
  loading: boolean = false;
  showModal: boolean = false;
  showModalParc: boolean = false;
  editingDespesa: any = null;
  mostrarApenasNaoPagas: boolean = true;
  mostrarApenasMesAtual: boolean = false;
  mostrarApenasProximoMes: boolean = false;
  nomeMesAtual: string = '';
  nomeProximoMes: string = '';
  valorTotal: number = 0;
  valorTotalFormatado: string = 'R$ 0,00'; // Nova propriedade para exibição
  termoBusca: string = ''; // Nova propriedade para o termo de busca
  
  // Novas propriedades para filtros de data
  dataInicial: string = '';
  dataFinal: string = '';
  
  // Propriedade para armazenar novas parcelas
  novasParcelas: any[] = [];
  
  novaDespesa: any = {
    nome: '',
    descricao: '',
    valor: '',
    venc: '',
    imagem: '',
    pago: false,
    CD: 'D', // Campo CD com valor padrão 'D' (Débito)
    parc: 1, // Campo parc com valor padrão 1 (parcela atual)
    nparc: 1, // Campo nparc com valor padrão 1 (número total de parcelas)
    codbar: '', // Adicionar campo codbar
    pix: '' // Adicionar campo pix
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

  // Propriedades para modal de pagamento
  showModalPagamento: boolean = false;
  despesaPagamento: any = null;
  valorPago: number = 0;
  codbarPagamento: string = '';
  pixPagamento: string = '';
  dataPagamento: string = ''; // Adicionar campo data de pagamento
  
  // Propriedades para modal de imagem
  showModalImagem: boolean = false;
  imagemAmpliada: string = '';
  
  // Propriedade para cálculos
  Math = Math;

  // Cache para URLs de imagens
  private imageUrlCache = new Map<string, string>();

  constructor(
    private http: HttpClient,
    private router: Router
    // private accessibilityService: AccessibilityService
  ) { }

  ngOnInit() {
    this.carregarDespesas();
    this.definirNomesMeses();
    // Garantir que o valor total seja calculado inicialmente
    setTimeout(() => {
      this.calcularValorTotal();
    }, 100);
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
    try {
      this.loading = true;
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/despesas`)
      );
      
      this.despesas = Array.isArray(response) ? response : (response.data || []);
      //console.log('Despesas carregadas:', this.despesas);
      
      // Limpar cache de imagens ao recarregar
      this.clearImageCache();
      
      await this.verificarECriarProximasParcelas();
      this.aplicarFiltro();
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      // Em caso de erro, inicializar com array vazio
      this.despesas = [];
      this.despesasFiltradas = [];
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
      //console.log('Próximo mês:', proximoMes);
      const mesProximo = proximoMes.getMonth();
      const anoProximo = proximoMes.getFullYear();

      // 1. Selecionar despesas com nparc > 1 (que têm mais de uma parcela)
      const despesasComParcelas = this.despesas.filter(despesa => 
        despesa.nparc && parseInt(despesa.nparc) > 1
      );
     //console.log('Despesas com múltiplas parcelas:', despesasComParcelas);

    //console.log('Despesas com múltiplas parcelas encontradas:', despesasComParcelas.length);

      // 2. Filtrar despesas com vencimento no mês atual
      const despesasMesAtual = despesasComParcelas.filter(despesa => {
        if (!despesa.venc) return false;
        
        const dataVencimento = new Date(despesa.venc);
        return dataVencimento.getMonth() === mesAtual && 
               dataVencimento.getFullYear() === anoAtual;
      });

      //console.log('Despesas do mês atual com múltiplas parcelas:', despesasMesAtual.length);
      //console.log('Despesas do mês atual com múltiplas parcelas:', despesasMesAtual);

      // 3. Para cada despesa do mês atual, verificar se já existe a próxima parcela
      this.novasParcelas = []; // Limpar array de novas parcelas

      for (const despesa of despesasMesAtual) {
        //console.log('nome da despesa: '+despesa.nome+' '+despesa.venc);
        const nomeDespesa = despesa.nome;
        const parcAtual = parseInt(despesa.parc) || 1;
        const nparcTotal = parseInt(despesa.nparc) || 1;
        
        // Verificar se já existe a próxima parcela no próximo mês
        const existeProximaParcela = despesasComParcelas.some(d => {
         // if(d.parc == (parcAtual) && d.nome == nomeDespesa){
         // console.log('nome: '+d.nome+' id'+d.id+' /'+d.parc+' Atual: '+nomeDespesa+' id'+despesa.id+' /'+(parcAtual+1));
         // }
          // Verificar se existe um registro com o mesmo nome, mesmo nparc e mesmo parc
          return d.nome.trim() == nomeDespesa.trim() && 
                 d.nparc == nparcTotal && 
                 d.parc == (parcAtual+1);
        });
        // Só criar próxima parcela se não existir e se ainda não chegou ao total
        if (!existeProximaParcela && nparcTotal >= parcAtual) {
         this.showModalParc = true;
          // Criar próxima parcela
          //console.log(`Incluir:`+existeProximaParcela+'nome:'+nomeDespesa+' id:'+despesa.id+' '+nparcTotal+' '+(parcAtual+1));
          const proximaParcela = {
            nome: despesa.nome,
            descricao: despesa.descricao || '',
            valor: despesa.valor,
            venc: this.calcularProximoVencimento(despesa.venc),
            imagem: despesa.imagem || '',
            pago: false,
            CD: despesa.CD || 'D',
            parc: parcAtual + 1, // Próxima parcela
            nparc: nparcTotal, // Mantém o total de parcelas
            codbar: despesa.codbar || '', // Adicionar campo codbar
            pix: despesa.pix || '' // Adicionar campo pix
          };

          this.novasParcelas.push(proximaParcela);
          //console.log(`Nova parcela criada: ${despesa.nome} - Parcela ${proximaParcela.parc} de ${proximaParcela.nparc}`);
        }
      }
      // 4. Salvar as novas parcelas no backend
      if (this.novasParcelas.length > 0) {
        //console.log(`Criando ${this.novasParcelas.length} novas parcelas...`);
        
        for (const novaParcela of this.novasParcelas) {
          try {
            await firstValueFrom(this.http.post(`${this.apiUrl}/despesa`, novaParcela));
           // console.log('Parcela criada com sucesso:', novaParcela.nome, `(Parcela ${novaParcela.parc}/${novaParcela.nparc})`);
          } catch (error) {
            console.error('Erro ao criar parcela:', novaParcela.nome, error);
          }
        }

        // Recarregar despesas para incluir as novas parcelas
        const responseAtualizado: any = await firstValueFrom(this.http.get(`${this.apiUrl}/despesas`));
        this.despesas = Array.isArray(responseAtualizado) ? responseAtualizado : (responseAtualizado.data || []);
        
        // Reordenar
        this.despesas.sort((a, b) => {
          if (!a.venc) return 1;
          if (!b.venc) return -1;
          return new Date(a.venc).getTime() - new Date(b.venc).getTime();
        });

        //console.log(`Processo concluído. ${this.novasParcelas.length} parcelas criadas.`);
      } else {
        //console.log('Nenhuma nova parcela foi criada.');
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
   confParc(){}

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

  // Método para filtrar por busca
  filtrarPorBusca(event: any) {
    this.termoBusca = event.target.value || '';
    this.aplicarFiltro();
  }

  // Método para verificar se uma despesa corresponde ao termo de busca
  private despesaCorrespondeBusca(despesa: any, termo: string): boolean {
    if (!termo || termo.trim() === '') {
      return true; // Se não há termo de busca, incluir todas
    }

    const termoLower = termo.toLowerCase().trim();
    
    // Buscar no nome
    if (despesa.nome && despesa.nome.toLowerCase().includes(termoLower)) {
      return true;
    }
    
    // Buscar na descrição
    if (despesa.descricao && despesa.descricao.toLowerCase().includes(termoLower)) {
      return true;
    }
    
    // Buscar no valor
    if (despesa.valor && despesa.valor.toString().includes(termoLower)) {
      return true;
    }
    
    // Buscar na data de vencimento
    if (despesa.venc) {
      const dataVencimento = new Date(despesa.venc);
      const dataFormatada = dataVencimento.toLocaleDateString('pt-BR');
      if (dataFormatada.includes(termoLower)) {
        return true;
      }
    }
    
    // Buscar no código de barras
    if (despesa.codbar && despesa.codbar.toLowerCase().includes(termoLower)) {
      return true;
    }
    
    // Buscar no PIX
    if (despesa.pix && despesa.pix.toLowerCase().includes(termoLower)) {
      return true;
    }
    
    return false;
  }

  aplicarFiltro() {
    let despesasFiltradas = this.despesas;

    // Aplicar filtro de busca
    if (this.termoBusca && this.termoBusca.trim() !== '') {
      const termo = this.termoBusca.toLowerCase().trim();
      despesasFiltradas = despesasFiltradas.filter(despesa => {
        return (
          (despesa.nome && despesa.nome.toLowerCase().includes(termo)) ||
          (despesa.descricao && despesa.descricao.toLowerCase().includes(termo)) ||
          (despesa.valor && despesa.valor.toString().includes(termo))
        );
      });
    }

    // Aplicar filtro de data inicial
    if (this.dataInicial) {
      const dataInicial = new Date(this.dataInicial);
      despesasFiltradas = despesasFiltradas.filter(despesa => {
        if (!despesa.venc) return false;
        const dataVencimento = new Date(despesa.venc);
        return dataVencimento >= dataInicial;
      });
    }

    // Aplicar filtro de data final
    if (this.dataFinal) {
      const dataFinal = new Date(this.dataFinal);
      // Ajustar para o final do dia (23:59:59)
      dataFinal.setHours(23, 59, 59, 999);
      despesasFiltradas = despesasFiltradas.filter(despesa => {
        if (!despesa.venc) return false;
        const dataVencimento = new Date(despesa.venc);
        return dataVencimento <= dataFinal;
      });
    }

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

    // Ordenar por data de vencimento (mais antigas primeiro)
    despesasFiltradas = despesasFiltradas.sort((a, b) => {
      // Se uma despesa não tem vencimento, coloca no final
      if (!a.venc && !b.venc) return 0;
      if (!a.venc) return 1;
      if (!b.venc) return -1;
      
      // Comparar datas de vencimento
      const dataA = new Date(a.venc);
      const dataB = new Date(b.venc);
      
      return dataA.getTime() - dataB.getTime(); // Ordem crescente (mais antigas primeiro)
    });

    this.despesasFiltradas = despesasFiltradas;
    this.calcularValorTotal();
  }

  calcularValorTotal() {
    try {
      //console.log('Calculando valor total...');
      //console.log('Despesas filtradas:', this.despesasFiltradas);
      
      this.valorTotal = this.despesasFiltradas.reduce((total, despesa) => {
        // Garantir que o valor seja um número válido
        let valor = 0;
        if (despesa.valor) {
          if (typeof despesa.valor === 'string') {
            // Remover caracteres não numéricos exceto ponto e vírgula
            const valorLimpo = despesa.valor.replace(/[^\d.,]/g, '');
            // Substituir vírgula por ponto para conversão
            const valorNumerico = valorLimpo.replace(',', '.');
            valor = parseFloat(valorNumerico) || 0;
          } else if (typeof despesa.valor === 'number') {
            valor = despesa.valor;
          }
        }
        
        //console.log(`Despesa: ${despesa.nome}, Valor original: ${despesa.valor}, Valor processado: ${valor}`);
        return total + valor;
      }, 0);
      
      // Atualizar o valor formatado
      this.atualizarValorFormatado();
      
      //console.log('Valor total calculado:', this.valorTotal);
      //console.log('Número de despesas filtradas:', this.despesasFiltradas.length);
    } catch (error) {
      console.error('Erro ao calcular valor total:', error);
      this.valorTotal = 0;
      this.valorTotalFormatado = 'R$ 0,00';
    }
  }

  atualizarValorFormatado() {
    try {
      if (this.valorTotal === null || this.valorTotal === undefined || isNaN(this.valorTotal)) {
        this.valorTotalFormatado = 'R$ 0,00';
        return;
      }
      
      this.valorTotalFormatado = this.valorTotal.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      
      //console.log('Valor formatado:', this.valorTotalFormatado);
    } catch (error) {
      console.error('Erro ao formatar valor:', error);
      this.valorTotalFormatado = 'R$ 0,00';
    }
  }

  formatarValor(valor: number): string {
    if (valor === null || valor === undefined || isNaN(valor)) {
      //console.log('Valor inválido para formatação:', valor);
      return 'R$ 0,00';
    }
    
    try {
      const valorFormatado = valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      //console.log('Valor formatado:', valorFormatado);
      return valorFormatado;
    } catch (error) {
      console.error('Erro ao formatar valor:', error);
      return 'R$ 0,00';
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
        pago: despesa.pago || false,
        CD: despesa.CD || 'D',
        parc: despesa.parc || 1,
        nparc: despesa.nparc || 1,
        codbar: despesa.codbar || '', // Adicionar campo codbar
        pix: despesa.pix || '' // Adicionar campo pix
      };

      // Configurar preview da imagem se existir
      if (despesa.imagem && despesa.imagem !== '') {
        //console.log('Imagem encontrada na despesa:', despesa.imagem);
        
        // Construir URL completa da imagem
        let imageUrl = '';
        if (despesa.imagem.startsWith('http')) {
          imageUrl = despesa.imagem;
        } else if (despesa.imagem.startsWith('/')) {
          // Se começa com /, é um caminho relativo ao servidor
          imageUrl = `http://localhost:3000${despesa.imagem}`;
        } else {
          // Se não tem /, adicionar
          imageUrl = `http://localhost:3000/${despesa.imagem}`;
        }
        
        //console.log('URL da imagem construída:', imageUrl);
        this.boletoImagePreview = imageUrl;
        this.boletoFile = null; // Não temos o arquivo original, apenas a URL
      } else {
        //console.log('Nenhuma imagem encontrada na despesa');
        this.boletoImagePreview = null;
        this.boletoFile = null;
      }
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
        nparc: 1,
        codbar: '', // Adicionar campo codbar
        pix: '' // Adicionar campo pix
      };
      
      // Limpar preview da imagem
      this.boletoImagePreview = null;
      this.boletoFile = null;
    }
    
    // Limpar erros de upload
    this.uploadError = null;
    this.uploading = false;
    this.uploadProgress = 0;
    
    this.showModal = true;
  }

  fecharModal() {
    this.showModal = false;
    this.editingDespesa = null;
    
    // Limpar preview da imagem
    this.boletoImagePreview = null;
    this.boletoFile = null;
    this.uploadError = null;
    this.uploading = false;
    this.uploadProgress = 0;
  }

  fecharModalParc() {
    this.showModalParc = false;
  }

  // Função auxiliar para formatar data
  private formatarData(data: any): string | null {
    if (!data) return null;

    // Se já está no formato YYYY-MM-DD
    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return data;
    }

    // Se é uma string ISO (com T e Z)
    if (typeof data === 'string' && data.includes('T')) {
      const dataObj = new Date(data);
      if (!isNaN(dataObj.getTime())) {
        return dataObj.toISOString().split('T')[0];
      }
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
      // Preparar dados para enviar com o nome correto do campo
      const dadosParaSalvar: { [key: string]: any } = {
        nome: this.novaDespesa.nome,
        descricao: this.novaDespesa.descricao || '',
        valor: parseFloat(this.novaDespesa.valor) || 0,
        venc: this.formatarData(this.novaDespesa.venc),
        imagem: this.novaDespesa.imagem || '',
        pago: this.novaDespesa.pago || false,
        tipo: this.novaDespesa.CD || 'D',
        parc: parseInt(this.novaDespesa.parc) || 1,
        nparc: parseInt(this.novaDespesa.nparc) || 1,
        codbar: this.novaDespesa.codbar || '',
        pix: this.novaDespesa.pix || ''
      };

      // Remover campos undefined ou null
      Object.keys(dadosParaSalvar).forEach(key => {
        if (dadosParaSalvar[key] === undefined || dadosParaSalvar[key] === null) {
          delete dadosParaSalvar[key];
        }
      });

      //console.log('Dados sendo enviados:', dadosParaSalvar);

      if (this.editingDespesa) {
        await firstValueFrom(this.http.put(`${this.apiUrl}/despesa/${this.editingDespesa.id}`, dadosParaSalvar));
        //console.log('Despesa atualizada:', dadosParaSalvar);
      } else {
        await firstValueFrom(this.http.post(`${this.apiUrl}/despesa`, dadosParaSalvar));
        //console.log('Despesa criada:', dadosParaSalvar);
      }

      this.fecharModal();
      this.carregarDespesas();
      alert(this.editingDespesa ? 'Despesa atualizada com sucesso!' : 'Despesa criada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar despesa:', error);
      console.error('Detalhes do erro:', {
        status: error?.status,
        message: error?.message,
        error: error?.error
      });
      this.uploadError = 'Erro ao salvar despesa.';
      alert('Erro ao salvar despesa. Verifique os dados e tente novamente.');
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
      //console.log('Status de pagamento alterado:', despesa);
      alert(despesa.pago ? 'Despesa marcada como paga!' : 'Despesa marcada como não paga!');
    } catch (error) {
      console.error('Erro ao alterar status de pagamento:', error);
      alert('Erro ao alterar status de pagamento');
    }
  }

  onDescricaoInput(event: any) {
    //console.log('Valor da descrição:', event.target.value);
    //console.log('Tipo do valor:', typeof event.target.value);
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
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          //console.log('Imagem colada:', file);
          this.processImageFile(file);
          break;
        }
      }
    }
  }

  processImageFile(file: File) {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, cole apenas imagens.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.boletoImagePreview = e.target?.result as string;
      this.boletoFile = file;
      //console.log('Preview da imagem criado');
    };
    reader.readAsDataURL(file);
  }

  removerBoleto(event: Event) {
    event.stopPropagation();
    this.boletoFile = null;
    this.boletoImagePreview = null;
    this.novaDespesa.imagem = '';
    
    // Se estiver editando, marcar que a imagem foi removida
    if (this.editingDespesa) {
      //console.log('Imagem removida da despesa em edição');
    }
  }

  // Método otimizado para obter URL completa da imagem
  getImageUrl(imagemPath: string): string {
    if (!imagemPath || imagemPath === '') {
      return '';
    }
    
    // Verificar se já está no cache
    if (this.imageUrlCache.has(imagemPath)) {
      return this.imageUrlCache.get(imagemPath)!;
    }
    
    // Se já é uma URL completa, retornar como está
    if (imagemPath.startsWith('http')) {
      this.imageUrlCache.set(imagemPath, imagemPath);
      return imagemPath;
    }
    
    // Extrair o nome do arquivo do caminho
    const filename = imagemPath.split('/').pop();
    if (filename) {
      const fullUrl = `${environment.apiUrl}/imagem/${filename}`;
      // Armazenar no cache
      this.imageUrlCache.set(imagemPath, fullUrl);
      return fullUrl;
    }
    
    return '';
  }

  // Método para limpar cache quando necessário
  private clearImageCache() {
    this.imageUrlCache.clear();
  }

  // Métodos para modal de pagamento
  abrirModalPagamento(despesa: any) {
    this.despesaPagamento = despesa;
    this.valorPago = parseFloat(despesa.valor) || 0;
    this.codbarPagamento = despesa.codbar || '';
    this.pixPagamento = despesa.pix || '';
    
    // Definir data de pagamento como hoje
    const hoje = new Date();
    this.dataPagamento = hoje.toISOString().split('T')[0];
    
    this.showModalPagamento = true;
  }

  fecharModalPagamento() {
    this.showModalPagamento = false;
    this.despesaPagamento = null;
    this.valorPago = 0;
    this.codbarPagamento = '';
    this.pixPagamento = '';
    this.dataPagamento = ''; // Limpar campo data de pagamento
  }

  // Getter para calcular diferença de valor
  get diferencaValor(): number {
    if (!this.despesaPagamento || !this.valorPago) return 0;
    const valorOriginal = parseFloat(this.despesaPagamento.valor) || 0;
    return this.valorPago - valorOriginal;
  }

  async confirmarPagamento() {
    if (!this.despesaPagamento) {
      return;
    }

    try {
      // Preparar dados para enviar com todos os campos necessários
      const dadosParaEnviar = {
        id: this.despesaPagamento.id,
        nome: this.despesaPagamento.nome,
        descricao: this.despesaPagamento.descricao || '',
        valor: this.despesaPagamento.valor,
        venc: this.formatarData(this.despesaPagamento.venc),
        imagem: this.despesaPagamento.imagem || '',
        pago: true,
        tipo: this.despesaPagamento.tipo || 'D',
        parc: this.despesaPagamento.parc || 1,
        nparc: this.despesaPagamento.nparc || 1,
        codbar: this.codbarPagamento,
        pix: this.pixPagamento,
        datap: this.dataPagamento, // Data de pagamento
        valorpg: this.valorPago // Valor pago
      };

      //console.log('Dados do pagamento:', dadosParaEnviar);

      await firstValueFrom(
        this.http.put(`${this.apiUrl}/despesa/${this.despesaPagamento.id}`, dadosParaEnviar)
      );

      //console.log('Despesa marcada como paga:', this.despesaPagamento.nome);
      //alert('Despesa marcada como paga com sucesso!');

      this.fecharModalPagamento();
      this.carregarDespesas();
    } catch (error) {
      console.error('Erro ao marcar despesa como paga:', error);
      alert('Erro ao marcar despesa como paga');
    }
  }

  // Métodos para modal de imagem
  ampliarImagem(imagemPath: string) {
    if (imagemPath) {
      this.imagemAmpliada = this.getImageUrl(imagemPath);
      this.showModalImagem = true;
    }
  }

  fecharModalImagem() {
    this.showModalImagem = false;
    this.imagemAmpliada = '';
  }

  // Método trackBy para otimizar o *ngFor
  trackByDespesa(index: number, despesa: any): number {
    return despesa.id || index;
  }

  // Método para copiar código de barras
  async copiarCodigoBarras() {
    if (this.codbarPagamento) {
      try {
        await navigator.clipboard.writeText(this.codbarPagamento);
        this.mostrarMensagemCopiado('Código de barras copiado!');
      } catch (error) {
        console.error('Erro ao copiar código de barras:', error);
        this.mostrarMensagemCopiado('Erro ao copiar código de barras');
      }
    }
  }

  // Método para copiar PIX
  async copiarPix() {
    if (this.pixPagamento) {
      try {
        await navigator.clipboard.writeText(this.pixPagamento);
        this.mostrarMensagemCopiado('Chave PIX copiada!');
      } catch (error) {
        console.error('Erro ao copiar PIX:', error);
        this.mostrarMensagemCopiado('Erro ao copiar PIX');
      }
    }
  }

  // Método para mostrar mensagem de feedback
  mostrarMensagemCopiado(mensagem: string) {
    // Criar um elemento temporário para mostrar a mensagem
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: var(--ion-color-success);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = mensagem;
    
    document.body.appendChild(toast);
    
    // Remover após 2 segundos
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 2000);
  }

  // Método para verificar se uma despesa está vencida
  isDespesaVencida(despesa: any): boolean {
    if (!despesa.venc || despesa.pago) {
      return false; // Se não tem vencimento ou já foi paga, não está vencida
    }
    
    const dataVencimento = new Date(despesa.venc);
    const dataAtual = new Date();
    
    // Resetar as horas para comparar apenas as datas
    dataVencimento.setHours(0, 0, 0, 0);
    dataAtual.setHours(0, 0, 0, 0);
    
    return dataVencimento < dataAtual;
  }

  // Método para copiar uma despesa
  async copiarDespesa(despesa: any) {
    try {
      // Criar uma nova despesa baseada na despesa selecionada
      const despesaCopiada = {
        nome: `${despesa.nome} (Cópia)`,
        descricao: despesa.descricao,
        valor: despesa.valor,
        venc: this.formatarData(despesa.venc), // <-- Aqui faz a formatação correta!
        imagem: '',
        pago: false, // Sempre começar como não paga
        CD: despesa.CD || 'D',
        parc: 1, // Sempre começar na primeira parcela
        nparc: despesa.nparc || 1,
        codbar: despesa.codbar || '',
        pix: despesa.pix || ''
      };
      //console.log('Despesa copiada:', despesaCopiada);

      // Salvar a despesa copiada
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/despesa`, despesaCopiada)
      );

      if (response && response.id) {
        //console.log('Despesa copiada com sucesso:', response);
        this.mostrarMensagemCopiado('Despesa copiada com sucesso!');
        
        // Recarregar a lista de despesas
        await this.carregarDespesas();
      } else {
        console.error('Erro ao copiar despesa: resposta inválida');
        this.mostrarMensagemCopiado('Erro ao copiar despesa');
      }
    } catch (error) {
      console.error('Erro ao copiar despesa:', error);
      this.mostrarMensagemCopiado('Erro ao copiar despesa');
    }
  }

  // Nova função para limpar filtros de data
  limparFiltrosData() {
    this.dataInicial = '';
    this.dataFinal = '';
    this.aplicarFiltro();
  }
}
