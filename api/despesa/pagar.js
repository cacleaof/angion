// API route para pagamento de despesas
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { id, valorpg } = req.body;

    console.log('=== PAGAMENTO RECEBIDO ===');
    console.log('ID da despesa:', id);
    console.log('Valor pago:', valorpg);
    console.log('Body completo:', req.body);
    console.log('==========================');

    if (!id || !valorpg) {
      return res.status(400).json({ 
        error: 'ID da despesa e valor pago são obrigatórios',
        received: req.body
      });
    }

    // Aqui você faria a atualização no banco de dados
    // Por enquanto, vamos simular o sucesso
    
    const despesaAtualizada = {
      id: id,
      pago: true,
      valorpg: parseFloat(valorpg),
      dataPagamento: new Date().toISOString().split('T')[0]
    };

    console.log('Despesa atualizada:', despesaAtualizada);

    res.status(200).json({
      success: true,
      message: 'Pagamento confirmado com sucesso',
      despesa: despesaAtualizada
    });

  } catch (error) {
    console.error('Erro no pagamento:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
} 