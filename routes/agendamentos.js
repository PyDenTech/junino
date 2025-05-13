const express = require('express');
const router = express.Router();
const Escola = require('../models/escola');
const Agendamento = require('../models/agendamento');

// Formulário de agendamento (selecionar escola)
router.get('/', (req, res) => {
    Escola.getAll((err, escolas) => {
        if (err) {
            return res.status(500).send("Erro ao obter escolas");
        }
        res.render('agendar', { escolas: escolas, escolaSelecionada: null });
    });
});

// Formulário de agendamento para uma escola específica
router.get('/:id', (req, res) => {
    const escolaId = req.params.id;
    Escola.findById(escolaId, (err, escola) => {
        if (err) {
            return res.status(500).send("Erro ao obter escola");
        }
        if (!escola) {
            return res.status(404).send("Escola não encontrada");
        }
        res.render('agendar', { escolas: [escola], escolaSelecionada: escola });
    });
});

// Processa envio do agendamento
router.post('/:id?', (req, res) => {
    const escolaId = req.params.id || req.body.escola;
    const nome = req.body.nome;
    const email = req.body.email;
    const data = req.body.data;
    if (!escolaId || !nome || !email || !data) {
        return res.status(400).send("Dados inválidos");
    }
    Agendamento.create(escolaId, nome, email, data, (err) => {
        if (err) {
            return res.status(500).send("Erro ao agendar");
        }
        // Define mensagem de sucesso e redireciona para a página inicial
        req.session.success = "Agendamento realizado com sucesso!";
        return res.redirect('/');
    });
});

module.exports = router;
