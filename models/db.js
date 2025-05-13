const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Caminho para o arquivo de banco de dados SQLite
const dbPath = path.join(__dirname, '..', 'database.db');
// Conecta ao banco (o arquivo será criado se não existir)
const db = new sqlite3.Database(dbPath);

// Criação das tabelas se não existirem
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS escola (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        slug TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS agendamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        escola_id INTEGER,
        nome TEXT,
        email TEXT,
        data TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS usuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT
    )`);

    // Insere escolas padrão se a tabela estiver vazia
    db.get("SELECT COUNT(*) as count FROM escola", (err, row) => {
        if (err) {
            console.error("Erro ao verificar escolas:", err);
        } else if (row.count === 0) {
            const escolasIniciais = [
                { nome: "EMEB Gercino Correa de Melo Junior", slug: "EMEB_Gercino_Correa_de_Melo_Junior.png" },
                { nome: "EMEB Luís Carlos Prestes", slug: "EMEB_Luis_Carlos_Prestes.png" },
                { nome: "EMEB Ronilton Aridal da Silva Grilo", slug: "EMEB_Ronilton_Aridal_da_Silva_Grilo.png" },
                { nome: "EMEF Alexsandro Nunes de Souza Gomes", slug: "EMEF_Alexsandro_Nunes_de_Souza_Gomes.png" },
                { nome: "EMEF Benedita Torres", slug: "EMEF_Benedita_Torres.png" },
                { nome: "EMEF Carmelo Mendes da Silva", slug: "EMEF_Carmelo_Mendes_da_Silva.png" },
                { nome: "EMEF Francisca Romana dos Santos", slug: "EMEF_Francisca_Romana_dos_Santos.png" },
                { nome: "EMEF João Nelson dos Prazeres Henriques", slug: "EMEF_Joao_Nelson_dos_Prazeres_Henriques.png" },
                { nome: "EMEF Maria de Lourdes Rocha Rodrigues", slug: "EMEF_Maria_de_Lourdes_Rocha_Rodrigues.png" },
                { nome: "EMEF Sebastião Agripino da Silva", slug: "EMEF_Sebastiao_Agripino_da_Silva.png" },
                { nome: "EMEIF Adelaide Molinari", slug: "EMEIF_Adelaide_Molinari.png" },
                { nome: "EMEIF Carlos Henrique", slug: "EMEIF_Carlos_Henrique.png" },
                { nome: "EMEIF Juscelino Kubitschek", slug: "EMEIF_Juscelino_Kubitschek.png" },
                { nome: "EMEIF Magalhães Barata", slug: "EMEIF_Magalhaes_Barata.png" },
                { nome: "EMEIF Raimundo de Oliveira", slug: "EMEIF_Raimundo_de_Oliveira.png" },
                { nome: "EMEIF Tancredo de Almeida Neves", slug: "EMEIF_Tancredo_de_Almeida_Neves.png" },
                { nome: "EMEIF Teotônio Vilela", slug: "EMEIF_Teotonio_Vilela.png" },
                { nome: "NEI Alegria do Saber", slug: "NEI_Alegria_do_Saber.png" },
                { nome: "NEI Benedito Faustino Malachias", slug: "NEI_Benedito_Faustino_Malachias.png" },
                { nome: "NEI Edson Pedro da Silva", slug: "NEI_Edson_Pedro_da_Silva.png" },
                { nome: "NEI Irani Vieira da Silva", slug: "NEI_Irani_Vieira_da_Silva.png" },
                { nome: "NEI Maria dos Milagres Oliveira Viana", slug: "NEI_Maria_dos_Milagres_Oliveira_Viana.png" },
                { nome: "NEI Raimundo Borges de Sousa", slug: "NEI_Raimundo_Borges_de_Sousa.png" },
                { nome: "NEI Nair Gomes de Souza", slug: "NEI_Nair_Gomes_de_Souza.png" },
                { nome: "NEI Zulmiro Frigoto", slug: "NEI_Zulmiro_Frigoto.png" },
                { nome: "NEI Nilde Maria dos Santos", slug: "NEI_Nilde_Maria_dos_Santos.png" },
                { nome: "NEI Marili Terezinha de Souza", slug: "NEI_Marili_Terezinha_de_Souza.png" },
                { nome: "EMEB Bela Vista", slug: "EMEB_Bela_Vista.png" }
            ];
            escolasIniciais.forEach(escola => {
                db.run("INSERT INTO escola (nome, slug) VALUES (?, ?)", [escola.nome, escola.slug]);
            });
            console.log("Escolas iniciais inseridas.");
        }
    });

    // Insere usuário admin padrão se a tabela estiver vazia
    db.get("SELECT COUNT(*) as count FROM usuario", (err, row) => {
        if (err) {
            console.error("Erro ao verificar usuários:", err);
        } else if (row.count === 0) {
            const senhaPadrao = "admin";
            const hash = bcrypt.hashSync(senhaPadrao, 10);
            db.run("INSERT INTO usuario (username, password) VALUES (?, ?)", ["admin", hash]);
            console.log("Usuário admin padrão inserido.");
        }
    });
});

module.exports = db;
