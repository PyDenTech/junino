const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// lista de escolas
const schools = [
    { id: '1', name: 'NEI Marili Terezinha de Souza' },
    { id: '2', name: 'EMEB Gercino Correa de Melo Junior', subtitle: 'Unidade voltada para a formação básica de qualidade.' },
    { id: '3', name: 'EMEB Luís Carlos Prestes', subtitle: 'Promovendo educação com inovação, cuidado e responsabilidade.' },
    { id: '4', name: 'EMEB Ronilton Aridal da Silva Grilo', subtitle: 'Compromisso com o desenvolvimento educacional.' },
    { id: '5', name: 'EMEF Alexsandro Nunes de Souza Gomes', subtitle: 'Foco no aprendizado e no desenvolvimento de valores.' },
    { id: '6', name: 'EMEF Benedita Torres', subtitle: 'Excelência em educação para o futuro.' },
    { id: '7', name: 'EMEF Carmelo Mendes da Silva', subtitle: 'Educação com dedicação e valores.' },
    { id: '8', name: 'EMEF Francisca Romana dos Santos', subtitle: 'Preparando cidadãos para o mundo.' },
    { id: '9', name: 'EMEF João Nelson dos Prazeres Henriques', subtitle: 'Qualidade no ensino com dedicação.' },
    { id: '10', name: 'EMEF Maria de Lourdes Rocha Rodrigues', subtitle: 'Educação que transforma.' },
    { id: '11', name: 'EMEF Sebastião Agripino da Silva', subtitle: 'Conectando conhecimento e prática.' },
    { id: '12', name: 'EMEIF Adelaide Molinari', subtitle: 'Educação de excelência para formar grandes cidadãos.' },
    { id: '13', name: 'EMEIF Carlos Henrique', subtitle: 'Compromisso com o futuro de nossos jovens.' },
    { id: '14', name: 'EMEIF Juscelino Kubitschek', subtitle: 'Formando jovens com base no conhecimento.' },
    { id: '15', name: 'EMEIF Magalhães Barata', subtitle: 'Inspirando mentes criativas e inovadoras.' },
    { id: '16', name: 'EMEIF Raimundo de Oliveira', subtitle: 'Conectando saberes e transformando vidas.' },
    { id: '17', name: 'EMEIF Tancredo de Almeida Neves', subtitle: 'Educação comprometida.' },
    { id: '18', name: 'EMEIF Teotônio Vilela', subtitle: 'Onde o aprendizado se encontra com a dedicação.' },
    { id: '19', name: 'NEI Alegria do Saber', subtitle: 'Transformando a alegria em aprendizado.' },
    { id: '20', name: 'NEI Benedito Faustino Malachias', subtitle: 'Crescendo juntos com a educação infantil de qualidade.' },
    { id: '21', name: 'NEI Edson Pedro da Silva', subtitle: 'Educação que acolhe e transforma.' },
    { id: '22', name: 'NEI Irani Vieira da Silva', subtitle: 'Contribuindo para um futuro brilhante.' },
    { id: '23', name: 'NEI Maria dos Milagres Oliveira Viana', subtitle: 'Educação infantil com amor e dedicação.' },
    { id: '24', name: 'NEI Raimundo Borges de Sousa', subtitle: 'Ensinar e aprender juntos para transformar.' },
    { id: '25', name: 'NEI Nair Gomes de Souza', subtitle: 'Educando com alegria e dedicação.' },
    { id: '26', name: 'NEI Zulmiro Frigoto' },
    { id: '27', name: 'NEI Nilde Maria dos Santos' },
    { id: '28', name: 'EMEB Professora Fernanda Leite' }
];

// inicializa banco SQLite
const db = new sqlite3.Database(path.join(__dirname, 'agendamentos.db'));
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      escola_id   TEXT,
      nome        TEXT,
      cargo       TEXT,
      data_festa  TEXT
    );
  `);
});

// rota principal: lista de cards
app.get('/', (req, res) => {
    const success = req.query.success === '1';          // captura ?success=1
    res.render('index', { schools, success });
});
// FORMULÁRIO DE AGENDAMENTO / REAGENDAMENTO
app.get('/agendamento/:id', (req, res) => {
    const escolaId = req.params.id;
    const school = schools.find(s => s.id === escolaId);
    if (!school) return res.status(404).send('Escola não encontrada');

    const minDate = new Date().toISOString().split('T')[0];

    // traz o último agendamento (se existir) para exibir no modal
    db.get(
        `SELECT * FROM agendamentos WHERE escola_id = ? ORDER BY id DESC LIMIT 1`,
        [escolaId],
        (err, booking) => {
            if (err) return res.status(500).send('Erro ao consultar agendamentos');

            // datas com >=4 agendamentos
            db.all(
                `SELECT data_festa
         FROM agendamentos
         GROUP BY data_festa
         HAVING COUNT(*) >= 4`,
                [],
                (err2, rows) => {
                    if (err2) return res.status(500).send('Erro ao consultar datas indisponíveis');
                    const unavailableDates = rows.map(r => r.data_festa);

                    res.render('agendamento', {
                        school,
                        minDate,
                        booking,
                        unavailableDates
                    });
                }
            );
        }
    );
});

// INSERE / REAGENDA UM AGENDAMENTO
app.post('/agendamento/:id', (req, res) => {
    const escolaId = req.params.id;
    const { nome, cargo, data } = req.body;

    // 1) valida se a data está cheia
    db.get(
        `SELECT COUNT(*) AS count
     FROM agendamentos
     WHERE data_festa = ?`,
        [data],
        (err, row) => {
            if (err) {
                console.error(err);
                return res.redirect(`/agendamento/${escolaId}?error=1`);
            }
            if (row.count >= 4) {
                // permanece na tela de agendamento com aviso
                return res.redirect(`/agendamento/${escolaId}?warning=Data não disponível`);
            }

            // 2) exclui agendamento existente para essa escola (reagendamento)
            db.run(
                `DELETE FROM agendamentos WHERE escola_id = ?`,
                [escolaId],
                deleteErr => {
                    if (deleteErr) console.error('Erro ao apagar anterior:', deleteErr);

                    // 3) insere o novo agendamento
                    const stmt = db.prepare(`
            INSERT INTO agendamentos (escola_id, nome, cargo, data_festa)
            VALUES (?, ?, ?, ?)
          `);
                    stmt.run(escolaId, nome, cargo, data, function (insErr) {
                        if (insErr) {
                            console.error(insErr);
                            return res.redirect(`/agendamento/${escolaId}?error=1`);
                        }
                        // sucesso: redireciona à index com ?success=1
                        res.redirect('/?success=1');
                    });
                    stmt.finalize();
                }
            );
        }
    );
});

const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Servidor rodando em http://0.0.0.0:${PORT}`);
});


