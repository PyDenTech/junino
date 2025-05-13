const express = require('express');
const router = express.Router();
const Escola = require('../models/escola');

router.get('/', (req, res) => {
    Escola.getAll((err, escolas) => {
        if (err) {
            return res.status(500).send("Erro ao obter escolas");
        }
        // Mensagem de sucesso de agendamento (se houver)
        const sucesso = req.session.success;
        // Limpa a mensagem após obter
        req.session.success = null;
        res.render('index', { escolas: escolas, success: sucesso });
    });
});

module.exports = router;
