const express = require('express');
const { OpenWeatherDriver } = require('./OpenWeatherDriver');
const { SQLiteDriver } = require('./SQLiteDriver');
const cors = require('cors');

const app = express();
app.use(cors());
const openWeatherDriver = new OpenWeatherDriver();
const sqLiteDriver = new SQLiteDriver('../resources/cities.db');
const port = process.env.port || 3000;


app.route('/weather/city')
    .get((req, res) => {
        const cityName = req.query.q;
        openWeatherDriver.getByName(cityName)
            .then(response => {
                if (response) {
                    res.send(response);
                }
                else {
                    res.sendStatus(400);
                }
            });
    });

app.route('/weather/coordinates')
    .get((req, res) => {
        const lat = req.query.lat;
        const lon = req.query.lon;
        openWeatherDriver.getByCoordinates(lat, lon)
            .then(response => {
                if (response) {
                    res.send(response);
                }
                else {
                    res.sendStatus(400);
                }
            });
    });

app.route('/favorites')

    .get((req, res) => {
        sqLiteDriver.getCities()
            .then(cities => {
                res.send(cities);
            })
            .catch(reason => {
                console.error(reason);
                res.sendStatus(500);
            });
    })

    .post((req, res) => {
        const city = req.query.q;
        sqLiteDriver.addCity(city)
            .then(correctCity => {
                if (correctCity) {
                    res.send(correctCity);
                }
                else {
                    res.sendStatus(400);
                }
            })
            .catch(reason => {
                res.sendStatus(500);
            });
    })

    .delete((req, res) => {
        const city = req.query.q;
        sqLiteDriver.removeCity(city)
            .then(removedCity => {
                if (removedCity) {
                    res.send(removedCity);
                }
                else {
                    res.sendStatus(400);
                }
            })
            .catch(reason => {
                res.sendStatus(500);
            });
    });

app.listen(port, () => {
    console.log(`Weather app listening at http://localhost:${port}`);
});
