import mocha from 'mocha'
import chai from 'chai';
import sinon from 'sinon';
import fs from "fs";

import {Frontend} from "../js/index.js";

const {describe, it} = mocha;
const {request, expect} = chai;
const {createSandbox} = sinon;

import jsdom from "jsdom";
const jsd = new jsdom.JSDOM(fs.readFileSync("D:\\WebstormProjects\\WebDev\\frontend\\html\\index.html"))
global.document = jsd.window.document;
global.window = jsd.window;


let sandbox;

mocha.beforeEach(() => {
    sandbox = createSandbox();
});

mocha.afterEach(() => {
    sandbox.restore();
});

describe("Frontend tests", () => {

    describe("API calls test", () => {

        const q = "Moscow";
        it("getWeatherDataByCityName", async () => {
            sandbox.stub(Frontend, "makeRequest").resolves({
                json: function () {
                    return {
                        "coord": {
                            "lon": 30,
                            "lat": 59
                        },
                        "name": "Moscow",
                        "cod": 200,

                    }
                }
            });
            const getWeatherDataByCityName = sandbox.spy(Frontend, "getWeatherDataByCityName")
            expect((await Frontend.getWeatherDataByCityName(q)).cod).to.be.equal(200);
            expect(getWeatherDataByCityName.getCall(0).args[0]).to.be.equal(q);
        });

        const lat = "59";
        const lon = "30";
        it("getWeatherDataByCoordinates", async () => {
            sandbox.stub(Frontend, "makeRequest").resolves({
                json: function () {
                    return {
                        "coord": {
                            "lon": 30,
                            "lat": 59
                        },
                        "name": "Moscow",
                        "cod": 200,

                    }
                }
            });
            const getWeatherDataByCoordinates = sandbox.spy(Frontend, "getWeatherDataByCoordinates")
            expect((await Frontend.getWeatherDataByCoordinates(lat, lon)).cod).to.be.equal(200);
            expect(getWeatherDataByCoordinates.getCall(0).args[0]).to.be.equal(lat);
            expect(getWeatherDataByCoordinates.getCall(0).args[1]).to.be.equal(lon);
        });

        it("degreesToDirection", () => {
            expect(Frontend.degreesToDirection(0)).to.be.equal("N");
            expect(Frontend.degreesToDirection(180)).to.be.equal("S");
        });

        it("getCities", async () => {
            sandbox.stub(Frontend, "makeRequest").resolves({
                ok: true,
                json: () => ["Moscow", "Saratov"]
            });
            expect(await Frontend.getCities()).to.deep.equal(["Moscow", "Saratov"]);
        });

        it("addCityToBackend", async () => {
            sandbox.stub(Frontend, "makeRequest").resolves({
                ok: true,
                text: () => q
            });
            expect(await Frontend.addCityToBackend(q)).to.be.equal(q);
        });


        it("removeCityFromBackend", async () => {
            sandbox.stub(Frontend, "makeRequest").resolves({
                ok: true,
                text: () => q
            });
            expect(await Frontend.removeCityFromBackend(q)).to.be.equal(q);
        });

        it("getPosition", async () => {
            global.alert = sandbox.fake();
            global.navigator = {
                geolocation: {
                    getCurrentPosition(successCallback, errorCallback, options) {
                        const result = {
                            coords: {
                                latitude: 59,
                                longitude: 30
                            }
                        };
                        successCallback(result);
                    }
                }
            }
            expect(await Frontend.getPosition()).to.deep.equal([59, 30]);
            global.navigator = {
                geolocation: {
                    getCurrentPosition(successCallback, errorCallback, options) {
                        errorCallback(new Error("test error"));
                    }
                }
            }
            expect(await Frontend.getPosition()).to.deep.equal([55.75, 37.62]);
        });

        it("loadLocalWeather", async () => {
            global.navigator = {
                geolocation: {
                    getCurrentPosition(successCallback, errorCallback, options) {
                        const result = {
                            coords: {
                                latitude: 59,
                                longitude: 30
                            }
                        };
                        successCallback(result);
                    }
                }
            }
            const mock_weather = {
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
            };
            sandbox.stub(Frontend, "makeRequest").resolves({
                json: function () {
                    return mock_weather
                }
            });
            const fillNodeWithWeather = sandbox.spy(Frontend, "fillNodeWithWeather");
            const getPosition = sandbox.spy(Frontend, "getPosition");
            await Frontend.loadLocalWeather(null);
            expect(getPosition.getCall(0).args.length).to.be.equal(0);
            expect(fillNodeWithWeather.getCall(0).args[1]).to.deep.equal(mock_weather);
            const sectionMainCity = document.getElementsByClassName('main-city')[0];
            expect(sectionMainCity.getElementsByClassName('loading').length).to.be.equal(1);
        });

    });

});