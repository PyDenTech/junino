const db = require('./db');

module.exports = {
    getAll: (callback) => {
        db.all("SELECT * FROM escola", [], (err, rows) => {
            callback(err, rows);
        });
    },
    findById: (id, callback) => {
        db.get("SELECT * FROM escola WHERE id = ?", [id], (err, row) => {
            callback(err, row);
        });
    }
};