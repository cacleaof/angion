// API route para despesas
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
    // Aqui você pode conectar com seu banco de dados
    // Por enquanto, vamos retornar dados de exemplo

    if (req.method === 'GET') {
      // Retornar lista de despesas
      const despesas = [
        {
          id: 1,
          nome: 'Conta de Luz',
          descricao: 'Conta de energia elétrica',
          valor: 150.00,
          venc: '2024-01-15',
          pago: false
        },
        {
          id: 2,
          nome: 'Internet',
          descricao: 'Plano de internet',
          valor: 89.90,
          venc: '2024-01-20',
          pago: true
        }
      ];

      res.status(200).json(despesas);
    } else if (req.method === 'POST') {
      // Criar nova despesa
      const novaDespesa = req.body;
      novaDespesa.id = Date.now(); // ID temporário

      res.status(201).json(novaDespesa);
    } else if (req.method === 'PUT') {
      // Atualizar despesa
      const { id } = req.query;
      const dadosAtualizados = req.body;

      res.status(200).json({ ...dadosAtualizados, id });
    } else if (req.method === 'DELETE') {
      // Deletar despesa
      const { id } = req.query;

      res.status(200).json({ message: 'Despesa deletada com sucesso', id });
    } else {
      res.status(405).json({ message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
