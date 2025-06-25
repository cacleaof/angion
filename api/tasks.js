// API route para tarefas
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
      const tasks = [
        {
          id: 1,
          nome: 'Estudar Angular',
          descricao: 'Revisar conceitos do Angular',
          tipo: 'TAREFA',
          uid: 1,
          proj: '',
          data: '2024-01-25',
          status: 'PENDENTE',
          prioridade: 2
        },
        {
          id: 2,
          nome: 'Fazer exercícios',
          descricao: 'Treino de musculação',
          tipo: 'TAREFA',
          uid: 1,
          proj: '',
          data: '2024-01-24',
          status: 'CONCLUÍDA',
          prioridade: 1
        }
      ];

      res.status(200).json(tasks);
    } else if (req.method === 'POST') {
      const novaTarefa = req.body;
      novaTarefa.id = Date.now();

      res.status(201).json(novaTarefa);
    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const dadosAtualizados = req.body;

      res.status(200).json({ ...dadosAtualizados, id });
    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      res.status(200).json({ message: 'Tarefa deletada com sucesso', id });
    } else {
      res.status(405).json({ message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
