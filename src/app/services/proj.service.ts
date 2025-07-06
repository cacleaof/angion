import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proj } from '../model/proj';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjService {
  //private apiUrl = 'https://adubadica.vercel.app/api/';
  private apiUrl = environment.apiUrl;

    private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  constructor(private http: HttpClient) { }

  addProjeto(projetoData: { nome: string, descricao: string }): Observable<Proj> {
    return this.http.post<Proj>(this.apiUrl + '/proj', projetoData, this.httpOptions);
  }

  getProjetos(): Observable<Proj[]> {
    return this.http.get<Proj[]>(this.apiUrl + '/projs');
  }

  // Novo método: criar projeto com PDF
  criarProjetoComPDF(projetoData: any, arquivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('pdf', arquivo);
    formData.append('projeto', JSON.stringify(projetoData));
    
    return this.http.post(this.apiUrl + '/proj-with-pdf', formData);
  }

  // Novo método: atualizar projeto com PDF
  atualizarProjetoComPDF(id: string, projetoData: any, arquivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('pdf', arquivo);
    formData.append('projeto', JSON.stringify(projetoData));
    
    return this.http.put(this.apiUrl + `/proj/${id}/with-pdf`, formData);
  }

  // Novo método: download PDF
  downloadPDF(id: string): Observable<Blob> {
    return this.http.get(this.apiUrl + `/proj/${id}/download-pdf`, { responseType: 'blob' });
  }

  // Novo método: visualizar PDF
  visualizarPDF(id: string): Observable<Blob> {
    return this.http.get(this.apiUrl + `/proj/${id}/view-pdf`, { responseType: 'blob' });
  }
}
