const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario');
const Agendamento = require('../models/agendamento');

// Middleware de autenticação
function requireAuth(req, res, next) {
    if (req.session && req.session.admin) {
        next();
    } else {
        res.redirect('/admin/login');
    }
}

// Painel admin (lista de agendamentos)
router.get('/', requireAuth, (req, res) => {
    Agendamento.getAllWithEscola((err, agendamentos) => {
        if (err) {
            return res.status(500).send("Erro ao obter agendamentos");
        }
        res.render('admin', { agendamentos: agendamentos, username: req.session.username });
    });
});

// Tela de login
router.get('/login', (req, res) => {
    if (req.session && req.session.admin) {
        return res.redirect('/admin');
    }
    res.render('login', { error: null });
});

// Processa login
router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) {
        return res.render('login', { error: "Preencha todos os campos." });
    }
    Usuario.findByUsername(username, (err, user) => {
        if (err) {
            return res.status(500).send("Erro no servidor");
        }
        if (!user) {
            return res.render('login', { error: "Credenciais inválidas." });
        }
        // Verifica a senha
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).send("Erro no servidor");
            }
            if (!result) {
                return res.render('login', { error: "Credenciais inválidas." });
            }
            // Login bem-sucedido
            req.session.admin = true;
            req.session.username = user.username;
            res.redirect('/admin');
        });
    });
});

// Logout
router.get('/logout', requireAuth, (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
});

module.exports = router;
