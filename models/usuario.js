const db = require('./db');

module.exports = {
    findByUsername: (username, callback) => {
        db.get("SELECT * FROM usuario WHERE username = ?", [username], (err, row) => {
            callback(err, row);
        });
    }
};
