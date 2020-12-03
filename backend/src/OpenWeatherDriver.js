const { URL } = require('url');
const fetch = require('node-fetch');

class OpenWeatherDriver {
    url = new URL("https://api.openweathermap.org/data/2.5/weather");
    apiKey = process.env.OPEN_WEATHER_API_KEY;

    getByName(name) {
        let params = {q: name, appid: this.apiKey, units: 'metric'};
        return this.makeRequest(this.url, params);
    }

    getByCoordinates(latitude, longitude) {
        let params = {lat: latitude, lon: longitude, appid: this.apiKey, units: 'metric'};
        return this.makeRequest(this.url, params);
    }

    async makeRequest(url, params) {
        url.search = new URLSearchParams(params).toString();
        try {
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            } else {
                return null;
            }
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}

module.exports.OpenWeatherDriver=OpenWeatherDriver;