import mocha from 'mocha'
import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

chai.use(chaiHttp);

import {OpenWeatherDriver} from "../src/OpenWeatherDriver.js";
import {SQLiteDriver} from "../src/SQLiteDriver.js";
import {app, sqLiteDriver, server} from "../src/Server.js";

const {describe, it} = mocha;
const {request, expect} = chai;
const {createSandbox} = sinon;

let sandbox;

mocha.beforeEach(() => {
    sandbox = createSandbox();
});

mocha.afterEach(() => {
    sandbox.restore();
});

mocha.after(async () => {
    await server.close();
    console.log("Closed server.");
    await sqLiteDriver.close();
    console.log("Closed db.");
});

const makeRequest = sinon.stub(OpenWeatherDriver.prototype, "makeRequest").resolves({
    "coord": {
        "lon": 30,
        "lat": 59
    },
    "weather": [
        {
            "id": 804,
            "main": "Clouds",
            "description": "overcast clouds",
            "icon": "04n"
        }
    ],
    "base": "stations",
    "main": {
        "temp": 272.07,
        "feels_like": 267.47,
        "temp_min": 272.07,
        "temp_max": 272.07,
        "pressure": 1007,
        "humidity": 98,
        "sea_level": 1007,
        "grnd_level": 997
    },
    "visibility": 10000,
    "wind": {
        "speed": 3.47,
        "deg": 196
    },
    "clouds": {
        "all": 100
    },
    "dt": 1608749914,
    "sys": {
        "country": "RU",
        "sunrise": 1608706430,
        "sunset": 1608728668
    },
    "timezone": 10800,
    "id": 525988,
    "name": "Moscow",
    "cod": 200
});

describe("Backend tests", () => {

    describe("Server test", () => {

        describe("/weather/city test", () => {
            const q = "Moscow";

            it("return 200 on correct call", done => {
                const getByName = sandbox.spy(OpenWeatherDriver.prototype, "getByName");
                request(app)
                    .get(`/weather/city?q=${q}`)
                    .end((err, res) => {
                        expect(res).to.have.status(200);
                        expect(res.body.cod).to.be.equal(200);
                        expect(getByName.getCall(0).args[0]).to.equal(q);
                        done();
                    });
            });

            it("return 400 on missing q parameter", done => {
                const getByName = sandbox.spy(OpenWeatherDriver.prototype, 'getByName');
                request(app)
                    .get(`/weather/city?query=${q}`)
                    .end((err, res) => {
                        expect(res).to.have.status(400);
                        expect(getByName.getCall(0).args[0]).to.be.undefined;
                        done();
                    });
            });
        });

        describe("/weather/coordinates test", () => {
            const lat = "30";
            const lon = "59";

            it("return 200 on correct call", done => {
                const getByCoordinates = sandbox.spy(OpenWeatherDriver.prototype, 'getByCoordinates');
                request(app)
                    .get(`/weather/coordinates?lat=${lat}&lon=${lon}`)
                    .end((err, res) => {
                        expect(res).to.have.status(200);
                        expect(res.body.cod).to.be.equal(200);
                        expect(getByCoordinates.getCall(0).args[0]).to.equal(lat);
                        expect(getByCoordinates.getCall(0).args[1]).to.equal(lon);
                        done();
                    });
            });

            it("return 400 on missing lon", done => {
                const getByCoordinates = sandbox.spy(OpenWeatherDriver.prototype, 'getByCoordinates');
                request(app)
                    .get(`/weather/coordinates?lat=${lat}`)
                    .end((err, res) => {
                        expect(res).to.have.status(400);
                        expect(getByCoordinates.getCall(0).args[1]).to.be.equal(undefined);
                        expect(getByCoordinates.getCall(0).args[1]).to.be.equal(undefined);
                        done();
                    });
            });

            it("return 400 on missing lat", done => {
                const getByCoordinates = sandbox.spy(OpenWeatherDriver.prototype, 'getByCoordinates');
                request(app)
                    .get(`/weather/coordinates?lon=${lon}`)
                    .end((err, res) => {
                        expect(res).to.have.status(400);
                        expect(getByCoordinates.getCall(0).args[0]).to.be.equal(undefined);
                        done();
                    });
            });

        });

        describe("/favorites test", () => {
            const q = "Moscow";

            it("add city", done => {
                const addCity = sandbox.spy(SQLiteDriver.prototype, "addCity");
                request(app)
                    .post(`/favorites?q=${q}`)
                    .end((err, res) => {
                        expect(res).to.have.status(200);
                        expect(addCity.getCall(0).args[0]).to.equal("Moscow");
                        done();
                    });
            });

            it("get cities", done => {
                const getCities = sandbox.spy(SQLiteDriver.prototype, "getCities");
                request(app)
                    .get(`/favorites`)
                    .end((err, res) => {
                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal(["Moscow"]);
                        done();
                    });
            });

            it("remove city", done => {
                const removeCity = sandbox.spy(SQLiteDriver.prototype, "removeCity");
                request(app)
                    .delete(`/favorites?q=${q}`)
                    .end((err, res) => {
                        expect(res).to.have.status(200);
                        expect(removeCity.getCall(0).args[0]).to.equal("Moscow");
                        done();
                    });
            });

            it("empty cities list after removal", done => {
                const getCities = sandbox.spy(SQLiteDriver.prototype, "getCities");
                request(app)
                    .get(`/favorites`)
                    .end((err, res) => {
                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal([]);
                        done();
                    });
            });

            it("try to remove city when it is not present", done => {
                const removeCity = sandbox.spy(SQLiteDriver.prototype, "removeCity");
                request(app)
                    .delete(`/favorites?q=${q}`)
                    .end((err, res) => {
                        expect(res).to.have.status(400);
                        expect(removeCity.getCall(0).args[0]).to.equal("Moscow");
                        done();
                    });
            });
        });
    });

    describe("OpenWeatherDriver test", () => {
        const openWeatherDriver = new OpenWeatherDriver();

        it('Call makeRequest with correct arguments', async () => {
            expect((await openWeatherDriver.getByName("Moscow")).cod).to.be.equal(200);
            expect((await openWeatherDriver.getByCoordinates(30, 59)).cod).to.be.equal(200);
            expect(makeRequest.getCall(0).args[1].q).to.be.equal("Moscow");
            expect(makeRequest.getCall(1).args[1].lat).to.be.equal("30");
            expect(makeRequest.getCall(1).args[1].lon).to.be.equal("59");
        });
    });

});
