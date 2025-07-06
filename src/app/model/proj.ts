export interface Proj {
  id: string;
  nome: string;
  descricao: string;
  tipo?: string;
  uid?: number;
  data?: string;
  fim?: string;
  status?: string;
  prioridade?: number;
  dep?: number | null;
  // Campos para arquivo PDF
  pdf_filename?: string;
  pdf_original_name?: string;
  pdf_path?: string;
}
