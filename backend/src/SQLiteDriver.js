const sqlite3 = require('sqlite3').verbose();
const { OpenWeatherDriver } = require('./OpenWeatherDriver');


class SQLiteDriver {

    constructor(dbPath) {
        this.openWeatherDriver = new OpenWeatherDriver();
        this.dbPath = dbPath;
        this.table = 'Cities';
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error(err.message);
            }
            else {
                console.log('Connected to the database.');
            }
        });
        this.db.run(`CREATE TABLE IF NOT EXISTS ${this.table} (\n` +
            '    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,\n' +
            '    city TEXT\n' +
            '\n' +
            ');');
    }

    async getCities() {
        return new Promise((resolve, reject) => {
            const sqlQuery = `SELECT city FROM ${this.table}`;
            this.db.all(sqlQuery, [], (err, rows) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    resolve(rows.map(row => row.city));
                }
            });
        });
    }

    async alreadyExists(city) {
        return new Promise((resolve, reject) => {
            const checkQuery = `SELECT city FROM ${this.table} WHERE city = ?`;
            this.db.all(checkQuery, [city], (err, rows) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    if (rows.length) {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                }
            });
        });
    }

    async addCity(city) {
        return new Promise((resolve, reject) => {
            this.alreadyExists(city)
                .then(alreadyExists => {
                    if (alreadyExists) {
                        resolve(null);
                    }
                    else {
                        this.openWeatherDriver.getByName(city)
                            .then(async (weather) => {
                                if (weather) {
                                    const correctCity = weather['name'];
                                    if (correctCity !== city) {
                                        const checkAgain = await this.alreadyExists(correctCity);
                                        if (checkAgain) {
                                            resolve(null);
                                            return;
                                        }
                                    }
                                    const sqlQuery = `INSERT INTO ${this.table} (city) VALUES (?)`;
                                    this.db.run(sqlQuery, [correctCity], (err) => {
                                        if (err) {
                                            console.error(err);
                                            reject(err);
                                        } else {
                                            resolve(correctCity);
                                        }
                                    })
                                }
                                else {
                                    resolve(null);
                                }
                            })
                            .catch(reason => {
                                reject(reason);
                            });
                    }
                })
                .catch (reason => {
                    console.error(reason);
                    reject(reason);
                });
        })
    }

    async removeCity(city) {
        return new Promise((resolve, reject) => {
            const checkQuery = `SELECT city FROM ${this.table} WHERE city = ?`;
            this.db.all(checkQuery, [city], (err, rows) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    if (rows.length) {
                        const sqlQuery = `DELETE FROM ${this.table} WHERE city = (?)`;
                        this.db.run(sqlQuery, [city], (err) => {
                            if (err) {
                                console.error(err);
                                reject(err);
                            }
                            else {
                                resolve(city);
                            }
                        });
                    }
                    else {
                        resolve(null);
                    }
                }
            });
        });
    }
}

module.exports.SQLiteDriver=SQLiteDriver;