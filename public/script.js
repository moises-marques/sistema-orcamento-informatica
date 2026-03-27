// Array para armazenar os itens do orçamento
let itensOrcamento = [];

// ============================================
// FUNÇÃO: Adicionar item à lista
// ============================================
function adicionarItem() {
    const descricao = document.getElementById('itemDescricao').value.trim();
    const quantidade = parseInt(document.getElementById('itemQuantidade').value);
    const preco = parseFloat(document.getElementById('itemPreco').value);

    // Validações
    if (!descricao) {
        mostrarMensagem('Digite a descrição do item!', 'erro');
        return;
    }
    if (!quantidade || quantidade <= 0) {
        mostrarMensagem('Quantidade inválida!', 'erro');
        return;
    }
    if (!preco || preco <= 0) {
        mostrarMensagem('Preço inválido!', 'erro');
        return;
    }

    // Adicionar ao array
    const item = {
        id: Date.now(), // ID único baseado no timestamp
        descricao: descricao,
        quantidade: quantidade,
        precoUnitario: preco
    };

    itensOrcamento.push(item);

    // Limpar campos
    document.getElementById('itemDescricao').value = '';
    document.getElementById('itemQuantidade').value = '1';
    document.getElementById('itemPreco').value = '';
    document.getElementById('itemDescricao').focus();

    // Atualizar tabela
    atualizarTabela();
    mostrarMensagem('Item adicionado!', 'sucesso');
}

// ============================================
// FUNÇÃO: Atualizar a tabela na tela
// ============================================
function atualizarTabela() {
    const tbody = document.getElementById('listaItens');
    tbody.innerHTML = '';

    let subtotal = 0;

    itensOrcamento.forEach((item, index) => {
        const totalItem = item.quantidade * item.precoUnitario;
        subtotal += totalItem;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.descricao}</td>
            <td>${item.quantidade}</td>
            <td>R$ ${item.precoUnitario.toFixed(2)}</td>
            <td>R$ ${totalItem.toFixed(2)}</td>
            <td>
                <button onclick="removerItem(${item.id})" class="btn-remover">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Calcular desconto
    const tipoDesconto = parseFloat(document.getElementById('tipoDesconto').value) || 0;
    const valorDesconto = subtotal * (tipoDesconto / 100);
    const totalComDesconto = subtotal - valorDesconto;

    // Atualizar valores na tela
    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('valorDesconto').textContent = `- R$ ${valorDesconto.toFixed(2)} (${tipoDesconto}%)`;
    document.getElementById('totalGeral').textContent = `R$ ${totalComDesconto.toFixed(2)}`;
}

// ============================================
// FUNÇÃO: Remover item
// ============================================
function removerItem(id) {
    itensOrcamento = itensOrcamento.filter(item => item.id !== id);
    atualizarTabela();
    mostrarMensagem('Item removido!', 'sucesso');
}

// ============================================
// FUNÇÃO: Limpar todo o orçamento
// ============================================
function limparOrcamento() {
    if (confirm('Tem certeza que deseja limpar todo o orçamento?')) {
        itensOrcamento = [];
        atualizarTabela();

        // Limpar campos do cliente
        document.getElementById('clienteNome').value = '';
        document.getElementById('clienteDocumento').value = '';
        document.getElementById('clienteTelefone').value = '';
        document.getElementById('clienteEmail').value = '';
        document.getElementById('clienteEndereco').value = '';
        document.getElementById('observacoes').value = '';

        mostrarMensagem('Orçamento limpo!', 'sucesso');
    }
}

// ============================================
// FUNÇÃO: Gerar PDF do orçamento
// ============================================
async function gerarOrcamento() {
    // Validar dados do cliente
    const cliente = {
        nome: document.getElementById('clienteNome').value.trim(),
        documento: document.getElementById('clienteDocumento').value.trim(),
        telefone: document.getElementById('clienteTelefone').value.trim(),
        email: document.getElementById('clienteEmail').value.trim(),
        endereco: document.getElementById('clienteEndereco').value.trim()
    };

    if (!cliente.nome) {
        mostrarMensagem('Digite o nome do cliente!', 'erro');
        return;
    }

    if (itensOrcamento.length === 0) {
        mostrarMensagem('Adicione pelo menos um item!', 'erro');
        return;
    }

    const observacoes = document.getElementById('observacoes').value.trim();

    // Mostrar carregando
    const btnGerar = document.querySelector('.btn-gerar');
    const textoOriginal = btnGerar.textContent;
    btnGerar.textContent = '⏳ Gerando...';
    btnGerar.disabled = true;

    try {
        // Enviar dados para o servidor
        const resposta = await fetch('http://localhost:3000/gerar-orcamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cliente: cliente,
                itens: itensOrcamento,
                observacoes: observacoes,
                descontoPercentual: parseFloat(document.getElementById('tipoDesconto').value) || 0
            })
        });

        const dados = await resposta.json();

        if (dados.sucesso) {
            mostrarMensagem('✅ Orçamento gerado com sucesso! Baixando...', 'sucesso');

            // Baixar o PDF automaticamente
            window.location.href = `http://localhost:3000${dados.downloadUrl}`;
        } else {
            mostrarMensagem('❌ Erro ao gerar orçamento!', 'erro');
        }

    } catch (erro) {
        console.error('Erro:', erro);
        mostrarMensagem('❌ Erro de conexão com o servidor!', 'erro');
    } finally {
        btnGerar.textContent = textoOriginal;
        btnGerar.disabled = false;
    }
}

// ============================================
// FUNÇÃO: Mostrar mensagens na tela
// ============================================
function mostrarMensagem(texto, tipo) {
    const div = document.getElementById('mensagem');
    div.textContent = texto;
    div.className = 'mensagem ' + tipo;

    // Esconder após 3 segundos
    setTimeout(() => {
        div.className = 'mensagem';
        div.textContent = '';
    }, 3000);
}

// ============================================
// EVENTO: Adicionar item ao pressionar Enter
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const inputs = document.querySelectorAll('.adicionar-item input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                adicionarItem();
            }
        });
    });
});

// ➕ ADICIONAR NO FINAL DO ARQUIVO script.js

// ============================================
// FUNÇÃO: Salvar orçamento atual
// ============================================
async function salvarOrcamento() {
    // Validar dados
    const cliente = {
        nome: document.getElementById('clienteNome').value.trim(),
        documento: document.getElementById('clienteDocumento').value.trim(),
        telefone: document.getElementById('clienteTelefone').value.trim(),
        email: document.getElementById('clienteEmail').value.trim(),
        endereco: document.getElementById('clienteEndereco').value.trim()
    };

    if (!cliente.nome) {
        mostrarMensagem('Preencha o nome do cliente para salvar!', 'erro');
        return;
    }

    if (itensOrcamento.length === 0) {
        mostrarMensagem('Adicione pelo menos um item!', 'erro');
        return;
    }

    const observacoes = document.getElementById('observacoes').value.trim();
    const descontoPercentual = parseFloat(document.getElementById('tipoDesconto').value) || 0;

    try {
        const resposta = await fetch('http://localhost:3000/salvar-orcamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cliente: cliente,
                itens: itensOrcamento,
                observacoes: observacoes,
                descontoPercentual: descontoPercentual
            })
        });

        const dados = await resposta.json();

        if (dados.sucesso) {
            mostrarMensagem(`✅ ${dados.mensagem}`, 'sucesso');
            carregarOrcamentos(); // Atualizar lista
        } else {
            mostrarMensagem('❌ Erro ao salvar!', 'erro');
        }

    } catch (erro) {
        console.error('Erro:', erro);
        mostrarMensagem('❌ Erro de conexão!', 'erro');
    }
}

// ============================================
// FUNÇÃO: Carregar lista de orçamentos salvos
// ============================================
async function carregarOrcamentos() {
    const divLista = document.getElementById('listaOrcamentosSalvos');
    
    // Mostrar carregando
    divLista.innerHTML = '<div class="sem-orcamentos">Carregando...</div>';
    
    try {
        console.log('Buscando orçamentos...');
        
        const resposta = await fetch('http://localhost:3000/orcamentos-salvos');
        
        console.log('Resposta recebida:', resposta.status);
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        
        console.log('Dados recebidos:', dados);

        if (!dados || !dados.orcamentos) {
            divLista.innerHTML = '<div class="sem-orcamentos">Erro na resposta do servidor.</div>';
            return;
        }

        if (dados.orcamentos.length === 0) {
            divLista.innerHTML = '<div class="sem-orcamentos">Nenhum orçamento salvo ainda.</div>';
            return;
        }

        let html = '';
        dados.orcamentos.forEach(orc => {
            const total = orc.total || 0;
            const qtdItens = orc.itens || 0;
            const clienteNome = orc.cliente || 'Sem nome';
            const data = orc.data || 'Data desconhecida';
            const id = orc.id || '?';
            
            // ➕ BOTÃO EXCLUIR ADICIONADO AQUI!
            html += `
                <div class="orcamento-card" id="orcamento-${id}">
                    <div class="orcamento-info">
                        <h4>Orçamento #${id} - ${clienteNome}</h4>
                        <p>📅 ${data} | 📦 ${qtdItens} itens</p>
                        <p><strong>Total: R$ ${parseFloat(total).toFixed(2)}</strong></p>
                    </div>
                    <div class="orcamento-acoes">
                        <button onclick="restaurarOrcamento(${id})" class="btn-carregar">
                            🔄 Carregar
                        </button>
                        <button onclick="gerarPDFSalvo(${id})" class="btn-pdf-salvo">
                            📄 PDF
                        </button>
                        <button onclick="excluirOrcamento(${id})" class="btn-excluir">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            `;
        });

        divLista.innerHTML = html;
        console.log('Lista renderizada com sucesso!');

    } catch (erro) {
        console.error('Erro detalhado:', erro);
        divLista.innerHTML = `<div class="sem-orcamentos">Erro ao carregar: ${erro.message}</div>`;
    }
} 

// ============================================
// FUNÇÃO: Restaurar orçamento na tela
// ============================================
async function restaurarOrcamento(id) {
    try {
        const resposta = await fetch(`http://localhost:3000/orcamento/${id}`);
        const dados = await resposta.json();

        if (!dados.sucesso) {
            mostrarMensagem('Orçamento não encontrado!', 'erro');
            return;
        }

        const orc = dados.orcamento;

        // Preencher dados do cliente
        document.getElementById('clienteNome').value = orc.cliente.nome;
        document.getElementById('clienteDocumento').value = orc.cliente.documento;
        document.getElementById('clienteTelefone').value = orc.cliente.telefone;
        document.getElementById('clienteEmail').value = orc.cliente.email;
        document.getElementById('clienteEndereco').value = orc.cliente.endereco;

        // Preencher itens
        itensOrcamento = orc.itens.map(item => ({
            ...item,
            id: Date.now() + Math.random() // Novo ID para evitar conflitos
        }));

        // Preencher observações e desconto
        document.getElementById('observacoes').value = orc.observacoes || '';
        document.getElementById('tipoDesconto').value = orc.descontoPercentual || 0;

        // Atualizar tabela
        atualizarTabela();
        
        mostrarMensagem(`✅ Orçamento #${id} carregado!`, 'sucesso');
        
        // Rolar para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (erro) {
        console.error('Erro:', erro);
        mostrarMensagem('❌ Erro ao carregar orçamento!', 'erro');
    }
}

// ============================================
// FUNÇÃO: Gerar PDF de orçamento salvo
// ============================================
async function gerarPDFSalvo(id) {
    try {
        const resposta = await fetch(`http://localhost:3000/orcamento/${id}`);
        const dados = await resposta.json();

        if (!dados.sucesso) {
            mostrarMensagem('Orçamento não encontrado!', 'erro');
            return;
        }

        const orc = dados.orcamento;

        // Enviar para gerar PDF
        const respostaPDF = await fetch('http://localhost:3000/gerar-orcamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cliente: orc.cliente,
                itens: orc.itens,
                observacoes: orc.observacoes,
                descontoPercentual: orc.descontoPercentual
            })
        });

        const dadosPDF = await respostaPDF.json();

        if (dadosPDF.sucesso) {
            mostrarMensagem('✅ PDF gerado! Baixando...', 'sucesso');
            window.location.href = `http://localhost:3000${dadosPDF.downloadUrl}`;
        }

    } catch (erro) {
        console.error('Erro:', erro);
        mostrarMensagem('❌ Erro ao gerar PDF!', 'erro');
    }
}

// ============================================
// FUNÇÃO: Excluir orçamento salvo
// ============================================
async function excluirOrcamento(id) {
    // Confirmar com o usuário
    const confirmar = confirm(`Tem certeza que deseja excluir o Orçamento #${id}?\n\nEsta ação não pode ser desfeita!`);
    
    if (!confirmar) {
        return; // Usuário cancelou
    }
    
    try {
        console.log(`Excluindo orçamento #${id}...`);
        
        const resposta = await fetch(`http://localhost:3000/orcamento/${id}/excluir`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const dados = await resposta.json();
        
        console.log('Resposta da exclusão:', dados);

        if (dados.sucesso) {
            // Remove o card da tela imediatamente (efeito visual)
            const card = document.getElementById(`orcamento-${id}`);
            if (card) {
                card.style.transition = 'all 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'translateX(-100%)';
                
                setTimeout(() => {
                    card.remove();
                    
                    // Verificar se ainda há orçamentos
                    const lista = document.getElementById('listaOrcamentosSalvos');
                    if (lista.children.length === 0) {
                        lista.innerHTML = '<div class="sem-orcamentos">Nenhum orçamento salvo.</div>';
                    }
                }, 300);
            }
            
            mostrarMensagem(`✅ ${dados.mensagem}`, 'sucesso');
            
        } else {
            mostrarMensagem(`❌ ${dados.mensagem}`, 'erro');
        }

    } catch (erro) {
        console.error('Erro ao excluir:', erro);
        mostrarMensagem('❌ Erro de conexão ao excluir!', 'erro');
    }
}