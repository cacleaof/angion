// API route para usuários
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
      const users = [
        {
          id: 1,
          email: 'admin@example.com',
          password: '123456',
          nome: 'Administrador'
        },
        {
          id: 2,
          email: 'user@example.com',
          password: '123456',
          nome: 'Usuário'
        }
      ];

      res.status(200).json(users);
    } else if (req.method === 'POST') {
      const novoUsuario = req.body;
      novoUsuario.id = Date.now();

      res.status(201).json(novoUsuario);
    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const dadosAtualizados = req.body;

      res.status(200).json({ ...dadosAtualizados, id });
    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      res.status(200).json({ message: 'Usuário deletado com sucesso', id });
    } else {
      res.status(405).json({ message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
