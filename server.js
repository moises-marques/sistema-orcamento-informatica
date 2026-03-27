const express = require('express');
const PDFDocument = require('pdfkit');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Segurança: Não mostrar stack trace em produção
if (process.env.NODE_ENV === 'production') {
    process.on('unhandledRejection', (err) => {
        console.error('Erro não tratado:', err.message);
    });
}

// Segurança: Headers básicos
app.use((req, res, next) => {
    res.removeHeader('X-Powered-By'); // Não revela que usa Express
    next();
});

let orcamentosSalvos = [];
let contadorOrcamentos = 1; 

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// DADOS FICTÍCIOS DA LOJA
const LOJA = {
    nome: "Gerador de Nota Fiscal",
    cnpj: "12.345.678/0001-90",
    endereco: "Av. da Tecnologia, 1500 - Centro",
    cidade: "São Paulo - SP",
    cep: "01000-000",
    telefone: "(11) 3333-4444",
    email: "contato@techmaster.com.br",
    website: "www.techmaster.com.br"
};

// ============================================
// ROTA PARA GERAR PDF DO ORÇAMENTO
// ============================================
app.post('/gerar-orcamento', (req, res) => {
    const { cliente, itens, observacoes, descontoPercentual } = req.body;
    
    // Criar nome do arquivo
    const dataAtual = new Date().toISOString().split('T')[0];
    const nomeArquivo = `orcamento_${cliente.nome.replace(/\s+/g, '_')}_${dataAtual}.pdf`;
    const caminhoArquivo = path.join(__dirname, 'orcamentos', nomeArquivo);

    // Criar pasta se não existir
    if (!fs.existsSync('orcamentos')) {
        fs.mkdirSync('orcamentos');
    }

    // Criar documento PDF
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(caminhoArquivo);
    doc.pipe(stream);

    // ========== CABEÇALHO COM DADOS DA LOJA ==========
    doc.fontSize(20).font('Helvetica-Bold').text(LOJA.nome, 50, 50);
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`CNPJ: ${LOJA.cnpj}`, 50, 75);
    doc.text(`${LOJA.endereco}`, 50, 90);
    doc.text(`${LOJA.cidade} - CEP: ${LOJA.cep}`, 50, 105);
    doc.text(`Tel: ${LOJA.telefone} | ${LOJA.email}`, 50, 120);
    doc.text(`${LOJA.website}`, 50, 135);

    // Linha divisória
    doc.moveTo(50, 155).lineTo(550, 155).stroke();

    // ========== TÍTULO DO ORÇAMENTO ==========
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('ORÇAMENTO', 250, 175);

    // ========== DADOS DO CLIENTE ==========
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('DADOS DO CLIENTE:', 50, 210);
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nome: ${cliente.nome}`, 50, 230);
    doc.text(`CPF/CNPJ: ${cliente.documento}`, 50, 245);
    doc.text(`Telefone: ${cliente.telefone}`, 50, 260);
    doc.text(`E-mail: ${cliente.email}`, 50, 275);
    doc.text(`Endereço: ${cliente.endereco}`, 50, 290);

    // Data do orçamento
    const hoje = new Date().toLocaleDateString('pt-BR');
    doc.text(`Data: ${hoje}`, 450, 210);

    // ========== TABELA DE ITENS ==========
    let y = 330;
    
    // Cabeçalho da tabela
    doc.rect(50, y, 500, 20).fill('#333333');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold');
    doc.text('Item', 60, y + 5);
    doc.text('Descrição', 120, y + 5);
    doc.text('Qtd', 350, y + 5);
    doc.text('Unitário', 400, y + 5);
    doc.text('Total', 480, y + 5);

    // Linhas dos itens
    y += 25;
    doc.fillColor('#000000').font('Helvetica');
    
    let subtotal = 0;

    itens.forEach((item, index) => {
        const totalItem = item.quantidade * item.precoUnitario;
        subtotal += totalItem;

        // Alternar cor de fundo
        if (index % 2 === 0) {
            doc.rect(50, y - 5, 500, 20).fill('#F5F5F5');
        }

        doc.fillColor('#000000');
        doc.text(`${index + 1}`, 60, y);
        doc.text(item.descricao, 120, y);
        doc.text(item.quantidade.toString(), 355, y);
        doc.text(`R$ ${item.precoUnitario.toFixed(2)}`, 400, y);
        doc.text(`R$ ${totalItem.toFixed(2)}`, 480, y);

        y += 20;
    });

    // ========== TOTAIS COM DESCONTO ==========
    const percentualDesconto = descontoPercentual || 0;
    const valorDesconto = subtotal * (percentualDesconto / 100);
    const totalFinal = subtotal - valorDesconto;

    y += 20;
    doc.moveTo(350, y).lineTo(550, y).stroke();
    
    y += 10;
    doc.font('Helvetica');
    doc.text('Subtotal:', 380, y);
    doc.text(`R$ ${subtotal.toFixed(2)}`, 480, y);

    y += 20;
    doc.fillColor('#856404'); // Cor amarela/destaque para desconto
    doc.text(`Desconto (${percentualDesconto}%):`, 380, y);
    doc.text(`- R$ ${valorDesconto.toFixed(2)}`, 480, y);
    doc.fillColor('#000000');

    y += 20;
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('TOTAL FINAL:', 380, y);
    doc.text(`R$ ${totalFinal.toFixed(2)}`, 480, y);

    // ========== OBSERVAÇÕES ==========
    if (observacoes) {
        y += 40;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('OBSERVAÇÕES:', 50, y);
        doc.font('Helvetica');
        doc.text(observacoes, 50, y + 15, { width: 500 });
    }

    // ========== RODAPÉ ==========
    y = 700;
    doc.fontSize(9).font('Helvetica-Oblique');
    doc.text('Orçamento válido por 7 dias. Preços sujeitos a alteração sem aviso prévio.', 50, y, { align: 'center' });
    doc.text('TechMaster Informática - CNPJ: 12.345.678/0001-90', 50, y + 15, { align: 'center' });

    // Finalizar PDF
    doc.end();

    // Aguardar criação do arquivo e enviar resposta
    stream.on('finish', () => {
        res.json({
            sucesso: true,
            mensagem: 'Orçamento gerado com sucesso!',
            arquivo: nomeArquivo,
            downloadUrl: `/download/${nomeArquivo}`,
            valores: {
                subtotal: subtotal,
                desconto: valorDesconto,
                total: totalFinal
            }
        });
    });
}); 

// ============================================
// ROTA PARA BAIXAR O PDF
// ============================================
app.get('/download/:arquivo', (req, res) => {
    const arquivo = req.params.arquivo;
    const caminho = path.join(__dirname, 'orcamentos', arquivo);
    
    res.download(caminho, arquivo, (err) => {
        if (err) {
            res.status(404).send('Arquivo não encontrado');
        }
    });
});

// ➕ ADICIONAR ANTES DO app.listen (no final do arquivo)

// ============================================
// ROTA: Salvar orçamento na memória
// ============================================
app.post('/salvar-orcamento', (req, res) => {
    console.log('Recebendo requisição para salvar orçamento...'); // Debug
    
    const { cliente, itens, observacoes, descontoPercentual } = req.body;
    
    // Validações
    if (!cliente || !cliente.nome) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Dados do cliente incompletos'
        });
    }
    
    if (!itens || itens.length === 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Nenhum item no orçamento'
        });
    }
    
    const orcamento = {
        id: contadorOrcamentos++,
        data: new Date().toLocaleString('pt-BR'),
        cliente: cliente,
        itens: itens,
        observacoes: observacoes || '',
        descontoPercentual: descontoPercentual || 0,
        total: calcularTotal(itens, descontoPercentual)
    };
    
    orcamentosSalvos.push(orcamento);
    
    console.log(`Orçamento #${orcamento.id} salvo. Total na memória: ${orcamentosSalvos.length}`); // Debug
    
    res.json({
        sucesso: true,
        mensagem: `Orçamento #${orcamento.id} salvo com sucesso!`,
        orcamento: orcamento
    });
});

// ============================================
// ROTA: Listar todos os orçamentos salvos
// ============================================
app.get('/orcamentos-salvos', (req, res) => {
    console.log(`Listando ${orcamentosSalvos.length} orçamentos salvos`); // Debug
    
    res.json({
        sucesso: true,
        quantidade: orcamentosSalvos.length,
        orcamentos: orcamentosSalvos.map(o => ({
            id: o.id,
            data: o.data,
            cliente: o.cliente.nome,
            total: o.total,
            itens: o.itens.length
        }))
    });
});

// ============================================
// ROTA: Buscar orçamento específico
// ============================================
app.get('/orcamento/:id', (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`Buscando orçamento #${id}`); // Debug
    
    const orcamento = orcamentosSalvos.find(o => o.id === id);
    
    if (!orcamento) {
        console.log(`Orçamento #${id} não encontrado`); // Debug
        return res.status(404).json({
            sucesso: false,
            mensagem: 'Orçamento não encontrado'
        });
    }
    
    console.log(`Orçamento #${id} encontrado`); // Debug
    res.json({
        sucesso: true,
        orcamento: orcamento
    });
});

// ============================================
// FUNÇÃO AUXILIAR: Calcular total
// ============================================
function calcularTotal(itens, descontoPercentual) {
    const subtotal = itens.reduce((acc, item) => {
        const preco = parseFloat(item.precoUnitario) || 0;
        const qtd = parseInt(item.quantidade) || 0;
        return acc + (qtd * preco);
    }, 0);
    
    const desconto = subtotal * ((parseFloat(descontoPercentual) || 0) / 100);
    return subtotal - desconto;
}

// ============================================
// ROTA: Excluir orçamento específico
// ============================================
app.delete('/orcamento/:id/excluir', (req, res) => {
    const id = parseInt(req.params.id);
    
    console.log(`Requisição para excluir orçamento #${id}`);
    
    // Encontrar o índice do orçamento
    const index = orcamentosSalvos.findIndex(o => o.id === id);
    
    if (index === -1) {
        console.log(`Orçamento #${id} não encontrado para exclusão`);
        return res.status(404).json({
            sucesso: false,
            mensagem: 'Orçamento não encontrado'
        });
    }
    
    // Remover do array
    const orcamentoExcluido = orcamentosSalvos.splice(index, 1)[0];
    
    console.log(`Orçamento #${id} (${orcamentoExcluido.cliente.nome}) excluído com sucesso`);
    console.log(`Restam ${orcamentosSalvos.length} orçamentos na memória`);
    
    res.json({
        sucesso: true,
        mensagem: `Orçamento #${id} excluído com sucesso!`,
        orcamentoRemovido: {
            id: orcamentoExcluido.id,
            cliente: orcamentoExcluido.cliente.nome
        },
        restantes: orcamentosSalvos.length
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log('🚀 Servidor rodando!');
    console.log(`📍 Acesse: http://localhost:${PORT}`);
    console.log('');
    console.log('Para parar o servidor: Ctrl+C');
});