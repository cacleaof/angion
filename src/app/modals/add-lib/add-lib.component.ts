import { AfterViewInit, ViewChild, ElementRef, Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonCheckbox, IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonBadge, IonIcon, IonGrid, IonRow, IonCol, ModalController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Input } from '@angular/core';

@Component({
  selector: 'app-add-lib',
  templateUrl: './add-lib.component.html',
  styleUrls: ['./add-lib.component.scss'],
   imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonInput, IonTextarea, IonIcon, CommonModule, FormsModule],
})
export class AddLibComponent  implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  novaLib: any;
  boletoImagePreview: string | null = null;
  boletoFile: File | null = null;
  editingLib: boolean = false; // Flag para indicar se estamos editando ou criando uma nova lib
  uploading: boolean = false;
  uploadProgress: number = 0;
  uploadError: string | null = null;
@Input() editarLib!: boolean;
@Input() biblioteca!: any;

   // URL da API do environment
    private apiUrl = environment.apiUrl;

  constructor(private modalCtrl: ModalController, private http: HttpClient) { }

  ngOnInit() {
 
    if(this.biblioteca) { console.log('Biblioteca recebida:', this.biblioteca); const lib = this.biblioteca;

      this.novaLib = {
        nome: lib?.nome || '',
        descricao: lib?.descricao || '',
        uid: lib?.uid || 1,
        imagem: lib?.imagem || '',
        file: lib?.file || '',
        obs: lib?.obs || ''
      };
     console.log('Ver se entrou dados na novalib:', this.novaLib.nome);}
     else {this.novaLib = { nome: '', descricao: '', uid: 1, imagem: '', file: '', obs: '' }; }
    }

      ngAfterViewInit() {
    // Removido a manipulação manual do DOM que estava causando o erro
    // O ion-textarea já funciona corretamente com ngModel
  }
      fecharModal() {this.modalCtrl.dismiss();}

       triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

   onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processImageFile(file);
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

    removerBoleto(event: Event) {
    event.stopPropagation();
    this.boletoFile = null;
    this.boletoImagePreview = null;
    this.novaLib.imagem = '';
    
    // Se estiver editando, marcar que a imagem foi removida
    if (this.editingLib) {
      //console.log('Imagem removida da despesa em edição');
    }
  }

 async salvarLib() {

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
                  this.novaLib.imagem = event.body.path;
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


      // Formatar a data para o formato esperado pelo input date
      let dataFormatada = '';
      if (this.novaLib.data) {
        const data = new Date(this.novaLib.data);
        if (!isNaN(data.getTime())) {
          dataFormatada = data.toISOString().split('T')[0];
        }
      } else {
        dataFormatada = new Date().toISOString().split('T')[0]; // Data atual como padrão
      }
      
      this.novaLib = {
        nome: this.novaLib.nome || '',
        descricao: this.novaLib.descricao || '',
        tipo: this.novaLib.tipo || 'lib',
        uid: this.novaLib.uid || 1,
        proj: this.novaLib.proj || '',
        task: this.novaLib.task || '',
        data: dataFormatada, // Usar a data formatada
        status: this.novaLib.status || 'PENDENTE',
        prioridade: this.novaLib.prioridade || 2,
        dep: this.novaLib.dep || '',
        file: this.novaLib.file || '',
        obs: this.novaLib.obs || '',
      };
       // Criar nova Atividade
              const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}/lib/`, this.novaLib));
              console.log('Atividade criada:', this.novaLib);
                this.modalCtrl.dismiss();
    }
  }
