const express = require('express');
const path = require('path');
const session = require('express-session');

// Inicializa o banco de dados e tabelas
require('./models/db');

const app = express();

// Configura EJS como view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para arquivos estáticos e body parser
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Configura sessão
app.use(session({
    secret: 'segredo-festa-junina',
    resave: false,
    saveUninitialized: false
}));

// Rotas da aplicação
const escolasRoutes = require('./routes/escolas');
const agendamentosRoutes = require('./routes/agendamentos');
const adminRoutes = require('./routes/admin');

app.use('/', escolasRoutes);
app.use('/agendar', agendamentosRoutes);
app.use('/admin', adminRoutes);

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
