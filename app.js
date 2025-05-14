const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.static(path.join(__dirname, 'public'))); // Servir arquivos estáticos (CSS, imagens)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Session middleware
app.use(session({
    secret: 'festasjuninas-secret',
    resave: false,
    saveUninitialized: false
}));
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Configurar EJS como motor de visualização
app.set('view engine', 'ejs');

// Inicialização do banco de dados SQLite
const db = new sqlite3.Database('database.db');
db.serialize(() => {
    // Criação das tabelas, se não existirem
    db.run(`CREATE TABLE IF NOT EXISTS escolas (
        id INTEGER PRIMARY KEY,
        name TEXT,
        slug TEXT UNIQUE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY,
        escola_id INTEGER,
        solicitante TEXT,
        email TEXT,
        data TEXT,
        horario TEXT,
        observacoes TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        acao TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Inserção inicial das 28 escolas (caso não existam)
    db.get("SELECT COUNT(*) as count FROM escolas", (err, row) => {
        if (err) {
            console.error("Erro ao verificar escolas:", err);
        } else if (row.count === 0) {
            const escolasInicial = [
                { name: 'Escola Municipal Tancredo Neves', slug: 'escola_municipal_tancredo_neves' },
                { name: 'Escola Municipal Monteiro Lobato', slug: 'escola_municipal_monteiro_lobato' },
                { name: 'Escola Municipal Paulo Freire', slug: 'escola_municipal_paulo_freire' },
                { name: 'Escola Municipal Maria da Glória', slug: 'escola_municipal_maria_da_gloria' },
                { name: 'Escola Municipal Dom Pedro I', slug: 'escola_municipal_dom_pedro_i' },
                { name: 'Escola Municipal São José', slug: 'escola_municipal_sao_jose' },
                { name: 'Escola Municipal Santa Maria', slug: 'escola_municipal_santa_maria' },
                { name: 'Escola Municipal Novo Horizonte', slug: 'escola_municipal_novo_horizonte' },
                { name: 'Escola Municipal Canaã dos Carajás', slug: 'escola_municipal_canaa_dos_carajas' },
                { name: 'Escola Municipal Jardim das Flores', slug: 'escola_municipal_jardim_das_flores' },
                { name: 'Escola Municipal Vale do Sol', slug: 'escola_municipal_vale_do_sol' },
                { name: 'Escola Municipal Arco-Íris', slug: 'escola_municipal_arco_iris' },
                { name: 'Colégio Integração Canaã', slug: 'colegio_integracao_canaa' },
                { name: 'Colégio Objetivo Canaã', slug: 'colegio_objetivo_canaa' },
                { name: 'Escola Estadual Ulisses Guimarães', slug: 'escola_estadual_ulisses_guimaraes' },
                { name: 'Escola Estadual Juscelino Kubitschek', slug: 'escola_estadual_juscelino_kubitschek' },
                { name: 'Escola Municipal Raio de Luz', slug: 'escola_municipal_raio_de_luz' },
                { name: 'Escola Municipal Pequeno Príncipe', slug: 'escola_municipal_pequeno_principe' },
                { name: 'Centro Educacional Caminhos do Saber', slug: 'centro_educacional_caminhos_do_saber' },
                { name: 'Centro Educacional Monte Sinai', slug: 'centro_educacional_monte_sinai' },
                { name: 'Escola Técnica de Canaã', slug: 'escola_tecnica_de_canaa' },
                { name: 'Escola Municipal Vila Planalto', slug: 'escola_municipal_vila_planalto' },
                { name: 'Escola Municipal São João', slug: 'escola_municipal_sao_joao' },
                { name: 'Escola Municipal Santo Antônio', slug: 'escola_municipal_santo_antonio' },
                { name: 'Escola Municipal São Pedro', slug: 'escola_municipal_sao_pedro' },
                { name: 'Escola Municipal Professor Miguel Arraes', slug: 'escola_municipal_professor_miguel_arraes' },
                { name: 'Escola Municipal Frei Henrique', slug: 'escola_municipal_frei_henrique' },
                { name: 'Escola Municipal Chico Mendes', slug: 'escola_municipal_chico_mendes' }
            ];
            const insertEscolaStmt = db.prepare("INSERT INTO escolas (name, slug) VALUES (?, ?)");
            escolasInicial.forEach(escola => {
                insertEscolaStmt.run(escola.name, escola.slug);
            });
            insertEscolaStmt.finalize();
            console.log("Escolas iniciais inseridas.");
        }
    });
    // Inserção do usuário admin padrão (caso não exista)
    db.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
        if (err) {
            console.error("Erro ao verificar usuarios:", err);
        } else if (row.count === 0) {
            db.run("INSERT INTO usuarios (username, password) VALUES (?, ?)", ['admin', 'admin'], err2 => {
                if (err2) {
                    console.error("Erro ao inserir usuario admin:", err2);
                } else {
                    console.log("Usuário admin inserido.");
                }
            });
        }
    });
});

// Middleware de autenticação para rotas administrativas
function checkAuth(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// ** Rotas **

// Página inicial - lista todas as escolas
app.get('/', (req, res) => {
    db.all("SELECT * FROM escolas", (err, rows) => {
        if (err) return res.status(500).send("Erro ao carregar escolas");
        res.render('index', { escolas: rows });
    });
});

// Página de agendamento para uma escola específica
app.get('/agendar/:id', (req, res) => {
    const escolaId = req.params.id;
    db.get("SELECT * FROM escolas WHERE id = ?", [escolaId], (err, escola) => {
        if (err) return res.status(500).send("Erro ao buscar escola");
        if (!escola) return res.status(404).send("Escola não encontrada");
        const success = req.query.success || null;
        res.render('agendar', { escola: escola, success: success });
    });
});

// Processa o formulário de agendamento
app.post('/agendar', (req, res) => {
    const { escola_id, solicitante, email, data, horario, observacoes } = req.body;
    if (!escola_id || !solicitante || !email || !data || !horario) {
        return res.redirect('/agendar/' + escola_id);
    }
    db.run(
        "INSERT INTO agendamentos (escola_id, solicitante, email, data, horario, observacoes) VALUES (?, ?, ?, ?, ?, ?)",
        [escola_id, solicitante, email, data, horario, observacoes || ''],
        function (err) {
            if (err) return res.status(500).send("Erro ao agendar");
            // Redireciona de volta com mensagem de sucesso
            res.redirect('/agendar/' + escola_id + '?success=1');
        }
    );
});

// Página de login do administrador
app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/admin');
    res.render('login', { error: null });
});

// Processa login do administrador
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM usuarios WHERE username = ? AND password = ?", [username, password], (err, user) => {
        if (err) return res.status(500).send("Erro no login");
        if (!user) {
            // Credenciais inválidas
            return res.render('login', { error: 'Credenciais inválidas' });
        }
        req.session.userId = user.id;
        res.redirect('/admin');
    });
});

// Painel administrativo (calendário)
app.get('/admin', checkAuth, (req, res) => {
    res.render('admin');
});

// Endpoint para obter agendamentos em formato JSON (FullCalendar)
app.get('/admin/events', checkAuth, (req, res) => {
    const query = `
        SELECT a.id, a.data, a.horario, a.solicitante, a.email, a.observacoes, e.name as escola_name
        FROM agendamentos a
        JOIN escolas e ON a.escola_id = e.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const events = rows.map(row => ({
            id: row.id,
            title: row.escola_name,
            start: row.data + 'T' + row.horario,
            extendedProps: {
                solicitante: row.solicitante,
                email: row.email,
                observacoes: row.observacoes,
                escola: row.escola_name
            }
        }));
        res.json(events);
    });
});

// Atualizar agendamento (arrastar evento no calendário)
app.post('/admin/events/update', checkAuth, (req, res) => {
    const { id, date, time } = req.body;
    if (!id || !date || !time) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }
    db.run("UPDATE agendamentos SET data = ?, horario = ? WHERE id = ?", [date, time, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        // Log de edição
        const userId = req.session.userId;
        const acao = `Atualizou agendamento ${id} para ${date} ${time}`;
        db.run("INSERT INTO logs (user_id, acao) VALUES (?, ?)", [userId, acao], err2 => {
            if (err2) console.error("Erro ao gravar log:", err2);
        });
        res.json({ success: true });
    });
});

// Excluir agendamento
app.post('/admin/events/delete', checkAuth, (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    db.run("DELETE FROM agendamentos WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        // Log de exclusão
        const userId = req.session.userId;
        const acao = `Excluiu agendamento ${id}`;
        db.run("INSERT INTO logs (user_id, acao) VALUES (?, ?)", [userId, acao], err2 => {
            if (err2) console.error("Erro ao gravar log:", err2);
        });
        res.json({ success: true });
    });
});

// Logout do administrador
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
