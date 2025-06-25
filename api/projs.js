// API route para projetos
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Dados de exemplo
    if (req.method === 'GET') {
      const projetos = [
        {
          id: 1,
          nome: 'App de Despesas',
          descricao: 'Aplicativo para controle de despesas pessoais',
          status: 'Em andamento',
          data_inicio: '2024-01-01',
          data_fim: '2024-02-01'
        },
        {
          id: 2,
          nome: 'Portfolio',
          descricao: 'Site portfolio pessoal',
          status: 'Concluído',
          data_inicio: '2023-12-01',
          data_fim: '2023-12-15'
        }
      ];

      res.status(200).json(projetos);
    } else if (req.method === 'POST') {
      const novoProjeto = req.body;
      novoProjeto.id = Date.now();

      res.status(201).json(novoProjeto);
    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const dadosAtualizados = req.body;

      res.status(200).json({ ...dadosAtualizados, id });
    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      res.status(200).json({ message: 'Projeto deletado com sucesso', id });
    } else {
      res.status(405).json({ message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
