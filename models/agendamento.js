const db = require('./db');

module.exports = {
    create: (escolaId, nome, email, data, callback) => {
        const sql = "INSERT INTO agendamento (escola_id, nome, email, data) VALUES (?, ?, ?, ?)";
        db.run(sql, [escolaId, nome, email, data], function (err) {
            callback(err);
        });
    },
    getAllWithEscola: (callback) => {
        const sql = `SELECT agendamento.id, agendamento.nome AS responsavel, agendamento.email, agendamento.data, escola.nome AS escola 
                     FROM agendamento 
                     JOIN escola ON agendamento.escola_id = escola.id`;
        db.all(sql, [], (err, rows) => {
            callback(err, rows);
        });
    }
};
