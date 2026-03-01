export interface Task {
  id: string;
  nome: string;
  descricao?: string;
  tipo?: string;
  uid?: number;
  proj?: string;
  data?: string;
  venc?: string;
  prev?: number;
  status: string; // Campo obrigatório com formato varchar(20)
  prioridade: number; // Campo obrigatório com formato int
  obs?: string;
  grav?: string;
  audio?: string;
  imagem?: string;
  imagem_orig?: string;
}
