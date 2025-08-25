import { Component, OnInit } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonButtons,
  IonList, 
  IonItem, 
  IonLabel, 
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonModal,
  IonProgressBar
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButton, 
    IonButtons,
    IonList, 
    IonItem, 
    IonLabel, 
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonModal,
    IonProgressBar,
    CommonModule, 
    FormsModule
  ],
})
export class AdminComponent implements OnInit {
  users: any[] = [];
  loading: boolean = false;
  showAddUserModal: boolean = false;
  showEditUserModal: boolean = false;
  editingUser: any = null;
  
  newUser: any = {
    email: '',
    password: '',
    nome: '',
    adm: 'N'
  };

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.carregarUsuarios();
  }

  async carregarUsuarios() {
    try {
      this.loading = true;
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/users`)
      );
      
      this.users = Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      this.users = [];
    } finally {
      this.loading = false;
    }
  }

  abrirModalAdicionar() {
    this.newUser = {
      email: '',
      password: '',
      nome: '',
      adm: 'N'
    };
    this.showAddUserModal = true;
  }

  fecharModalAdicionar() {
    this.showAddUserModal = false;
  }

  abrirModalEditar(user: any) {
    this.editingUser = { ...user };
    this.showEditUserModal = true;
  }

  fecharModalEditar() {
    this.showEditUserModal = false;
    this.editingUser = null;
  }

  async adicionarUsuario() {
    if (!this.newUser.email || !this.newUser.password || !this.newUser.nome) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/users`, this.newUser)
      );
      
      this.fecharModalAdicionar();
      this.carregarUsuarios();
      alert('Usuário adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      alert('Erro ao adicionar usuário');
    }
  }

  async editarUsuario() {
    if (!this.editingUser.email || !this.editingUser.nome) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await firstValueFrom(
        this.http.put(`${this.apiUrl}/users/${this.editingUser.id}`, this.editingUser)
      );
      
      this.fecharModalEditar();
      this.carregarUsuarios();
      alert('Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      alert('Erro ao editar usuário');
    }
  }

  async deletarUsuario(user: any) {
    if (confirm(`Tem certeza que deseja deletar o usuário "${user.nome}"?`)) {
      try {
        await firstValueFrom(
          this.http.delete(`${this.apiUrl}/users/${user.id}`)
        );
        
        this.carregarUsuarios();
        alert('Usuário deletado com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        alert('Erro ao deletar usuário');
      }
    }
  }

  navegarParaDashboard() {
    this.router.navigate(['/dashboard']);
  }

  isCurrentUser(user: any): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser !== null && currentUser.id === user.id;
  }
}
