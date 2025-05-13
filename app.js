const path = require('path');
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Express
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração da sessão
app.use(session({
    secret: 'segredo-super-seguro',  // em produção usar variável de ambiente
    resave: false,
    saveUninitialized: false
}));

// Torna a sessão acessível nas views (para mostrar links condicionalmente)
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Conexão com banco de dados SQLite3
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));
db.serialize(() => {
    // Criação das tabelas, se não existirem
    db.run(`CREATE TABLE IF NOT EXISTS escolas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    slug TEXT UNIQUE
  )`);
    db.run(`CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    data TEXT NOT NULL,
    hora TEXT NOT NULL,
    observacoes TEXT,
    escola_id INTEGER NOT NULL,
    FOREIGN KEY(escola_id) REFERENCES escolas(id)
  )`);
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
    db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    acao TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES usuarios(id)
  )`);

    // Insere usuário admin padrão, se não existir
    db.run(
        `INSERT OR IGNORE INTO usuarios (username, password) VALUES (?, ?)`,
        ['admin', 'admin']
    );

    // Insere algumas escolas de exemplo, se tabela estiver vazia
    db.get(`SELECT COUNT(*) as count FROM escolas`, (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO escolas (nome, slug) VALUES (?, ?)`,
                ['EMEF Tancredo Neves', 'emef-tancredo-neves']);
            db.run(`INSERT INTO escolas (nome, slug) VALUES (?, ?)`,
                ['EMEI João e Maria', 'emei-joao-e-maria']);
        }
    });
});

// Middleware de autenticação para rotas administrativas
function checkAuth(req, res, next) {
    if (req.session.user) {
        return next();
    }
    return res.redirect('/login');
}

// Rota Página Inicial - lista escolas em cards
app.get('/', (req, res) => {
    db.all(`SELECT * FROM escolas`, (err, escolas) => {
        if (err) return res.status(500).send("Erro ao buscar escolas");
        // Query string ?success=1 indica agendamento criado com sucesso
        const success = req.query.success;
        res.render('index', { escolas, success });
    });
});

// Rota de formulário de agendamento (página de agendar para uma escola específica)
app.get('/agendar/:id', (req, res) => {
    const escolaId = req.params.id;
    db.get(`SELECT * FROM escolas WHERE id = ?`, [escolaId], (err, escola) => {
        if (err || !escola) return res.status(404).send("Escola não encontrada");
        res.render('agendar', { escola });
    });
});

// Processa envio do formulário de agendamento
app.post('/agendar/:id', (req, res) => {
    const escolaId = req.params.id;
    const { nome, email, data, hora, observacoes } = req.body;
    // Insere novo agendamento no banco
    const sql = `INSERT INTO agendamentos (nome, email, data, hora, observacoes, escola_id) 
               VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [nome, email, data, hora, observacoes || '', escolaId], function (err) {
        if (err) return res.status(500).send("Erro ao agendar");
        // Redireciona para página inicial com indicação de sucesso
        return res.redirect('/?success=1');
    });
});

// Rota de Login do Admin
app.get('/login', (req, res) => {
    // Se já logado, vai direto para admin
    if (req.session.user) {
        return res.redirect('/admin');
    }
    const error = req.query.error;
    res.render('login', { error });
});

// Processa Login do Admin
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM usuarios WHERE username = ? AND password = ?`, [username, password], (err, user) => {
        if (user) {
            // Login bem-sucedido: guarda usuário na sessão e redireciona para painel admin
            req.session.user = { id: user.id, username: user.username };
            return res.redirect('/admin');
        } else {
            // Falha no login: retorna à página de login com mensagem de erro
            return res.redirect('/login?error=1');
        }
    });
});

// Rota do Painel Administrativo (calendário de agendamentos)
app.get('/admin', checkAuth, (req, res) => {
    // Busca todos agendamentos com informações da escola
    const sql = `SELECT a.id, a.nome, a.email, a.data, a.hora, a.observacoes, a.escola_id, e.nome AS escolaNome 
               FROM agendamentos a 
               JOIN escolas e ON a.escola_id = e.id`;
    db.all(sql, [], (err, agendamentos) => {
        if (err) return res.status(500).send("Erro ao buscar agendamentos");
        // Busca todas escolas para possibilitar criação/edição de agendamento
        db.all(`SELECT * FROM escolas`, (err2, escolas) => {
            if (err2) return res.status(500).send("Erro ao buscar escolas");
            // Prepara eventos para o calendário (FullCalendar)
            const eventos = agendamentos.map(ag => {
                return {
                    id: ag.id,
                    title: `${ag.escolaNome} - ${ag.nome}`,
                    start: `${ag.data}T${ag.hora}`,
                    extendedProps: {
                        nome: ag.nome,
                        email: ag.email,
                        observacoes: ag.observacoes,
                        escolaId: ag.escola_id,
                        escolaNome: ag.escolaNome,
                        data: ag.data,
                        hora: ag.hora
                    }
                };
            });
            res.render('admin', { eventos: JSON.stringify(eventos), escolas, fullCalendar: true });
        });
    });
});

// Endpoint para criar/editar/excluir agendamentos via painel admin
app.post('/admin/agendamento', checkAuth, (req, res) => {
    const { id, nome, email, data, hora, observacoes, escola, action } = req.body;
    const userId = req.session.user.id;
    const username = req.session.user.username;
    if (action === 'delete') {
        // Excluir agendamento
        db.run(`DELETE FROM agendamentos WHERE id = ?`, [id], function (err) {
            if (!err) {
                // Log de exclusão
                const logText = `Usuário ${username} excluiu agendamento ID ${id}`;
                db.run(`INSERT INTO logs (user_id, acao) VALUES (?, ?)`, [userId, logText]);
            }
            return res.redirect('/admin');
        });
    } else {
        if (id && id !== '') {
            // Editar agendamento existente
            const sqlUpdate = `UPDATE agendamentos 
                         SET nome = ?, email = ?, data = ?, hora = ?, observacoes = ?, escola_id = ? 
                         WHERE id = ?`;
            db.run(sqlUpdate, [nome, email, data, hora, observacoes || '', escola, id], function (err) {
                if (!err) {
                    const logText = `Usuário ${username} editou agendamento ID ${id}`;
                    db.run(`INSERT INTO logs (user_id, acao) VALUES (?, ?)`, [userId, logText]);
                }
                return res.redirect('/admin');
            });
        } else {
            // Criar novo agendamento via painel admin
            const sqlInsert = `INSERT INTO agendamentos (nome, email, data, hora, observacoes, escola_id) 
                         VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(sqlInsert, [nome, email, data, hora, observacoes || '', escola], function (err) {
                if (!err) {
                    const newId = this.lastID;  // ID do agendamento recém-inserido
                    const logText = `Usuário ${username} criou agendamento ID ${newId}`;
                    db.run(`INSERT INTO logs (user_id, acao) VALUES (?, ?)`, [userId, logText]);
                }
                return res.redirect('/admin');
            });
        }
    }
});

// Rota de Logout do Admin
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
