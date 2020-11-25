const openWeatherMapApiKey = 'b31c7794c25471b7cb20c3a835b69486';
const googleMapsApiKey = 'AIzaSyDihOs2L13Tx3gdE8LlqCmWJpmStn81LRs';
const favoriteCitiesKey = 'favoriteCities';
const temperatureUnits = '°C';
const windSpeedUnits = 'm/s';
const cloudinessUnits = '%';
const pressureUnits = 'hPa';
const humidityUnits = '%';


(async () => {
    if (localStorage.getItem(favoriteCitiesKey) === null) {
        localStorage.setItem(favoriteCitiesKey, JSON.stringify([]));
    }

    window.addEventListener('submit', event => {
        event.preventDefault();
    })

    window.addEventListener('load', function(event) {
        loadLocalWeather();
        addFavoriteCities();
    });

})()

async function loadLocalWeather() {
    const sectionMainCity = document.getElementsByClassName('main-city')[0];
    const elements = sectionMainCity.getElementsByClassName('loaded');
    [...elements].forEach((element, i, arr) => {
        element.classList.replace('loaded', 'loading');
        if (element.tagName === 'IMG') {
            element.src = '../resources/dummy.png';
            element.onload = '';
        }
    });
    getPosition().then(value => {
        const [latitude, longitude] = value;
        getWeatherDataByCoordinates(latitude, longitude)
            .then(value => {
                fillNodeWithWeather(sectionMainCity, value);
            });
    });
}

function addFavoriteCities() {
    const cities = JSON.parse(localStorage.getItem(favoriteCitiesKey));
    for (const city of cities) {
        addFavoriteCity(city);
    }
}

function addFavoriteCity(cityName) {
    let container = document.getElementsByClassName('favorite-cities')[0];
    let temp = document.getElementById('template-favorite-city');
    const node = document.importNode(temp.content, true);
    node.querySelector('.city-name').textContent = cityName;
    node.querySelector('section').id = cityName;
    container.appendChild(node);
    getWeatherDataByCityName(cityName)
        .then(value => {
            fillNodeByIdWithWeather(cityName, value);
        })
}

function addNewFavoriteCity(cityName) {
    cityNameIsValid(cityName)
        .then(valid => {
            if (valid) {
                const favoriteCities = JSON.parse(localStorage.getItem(favoriteCitiesKey));
                favoriteCities.push(cityName);
                localStorage.setItem(favoriteCitiesKey, JSON.stringify(favoriteCities));
                addFavoriteCity(cityName);
            }
            else {
                alert('Cannot add city');
            }
        });
    return false;
}

async function cityNameIsValid(cityName) {
    const favoriteCities = JSON.parse(localStorage.getItem(favoriteCitiesKey));
    if (favoriteCities.includes(cityName)) {
        return false;
    }
    const response = await getWeatherDataByCityName(cityName);
    return response.cod === 200
        && !favoriteCities.includes(response.name);
}

async function getPosition() {
    let latitude = 55.75;
    let longitude = 37.62;
    const errorMessage = 'Error while accessing geolocation, defaulting to Moscow';
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                    resolve([latitude, longitude]);
                }, positionError => {
                    alert(errorMessage + ', ' + positionError.message);
                    resolve([latitude, longitude]);
                });
        } else {
            alert(errorMessage);
            resolve([latitude, longitude]);
        }
    });

}

function getRequest(url) {
    url = 'https://api.openweathermap.org/data/2.5/weather?appid=' + openWeatherMapApiKey + '&units=metric' + url;
    return fetch(url).then(value => value.json());
}

function getWeatherDataByCoordinates(latitude, longitude) {
    let url = '&lat=' + latitude
        + '&lon=' + longitude;
    return getRequest(url);
}

function getWeatherDataByCityName(cityName) {
    let url = '&q=' + cityName
    return getRequest(url);
}

function fillNodeWithWeather(node, weather) {
    node.querySelector('.city-name').textContent = weather['name'];
    node.querySelector('.temperature').textContent = Math.round(weather['main']['temp']) + temperatureUnits;
    const img = node.querySelector('img');
    img.classList.replace('loaded', 'loading');
    img.src = `http://openweathermap.org/img/wn/${weather['weather'][0]['icon']}@4x.png`;
    img.onload = () => {
        img.classList.replace('loading', 'loaded');
    };
    const detailedInformationBlocks = node.querySelectorAll('.detailed-information-block');
    for (const block of detailedInformationBlocks) {
        const key = block.querySelector('.detailed-information-block-key');
        const value = block.querySelector('.detailed-information-block-value');
        switch (key.textContent) {
            case 'Wind':
                value.textContent = weather['wind']['speed'] + ' ' + windSpeedUnits
                    + ', ' + degreesToDirection(weather['wind']['deg']);
                break;
            case 'Clouds':
                value.textContent = weather['clouds']['all'] + ' ' + cloudinessUnits;
                break;
            case 'Pressure':
                value.textContent = weather['main']['pressure'] + ' ' + pressureUnits;
                break;
            case 'Humidity':
                value.textContent = weather['main']['humidity'] + ' ' + humidityUnits;
                break;
            case 'Coordinates':
                value.textContent = 'latitude: ' + weather['coord']['lat'] + ', longitude: ' + weather['coord']['lon'];
                break;
        }
    }
    const elements = node.getElementsByClassName('loading');
    [...elements].forEach( (element, i, arr) => {
        if (element.tagName !== 'IMG') {
            element.classList.replace('loading', 'loaded');
        }
    });
}

function fillNodeByIdWithWeather(id, weather) {
    const node = document.getElementById(id);
    fillNodeWithWeather(node, weather);
}

function deleteCity(cityName) {
    const list = JSON.parse(localStorage.getItem(favoriteCitiesKey));
    document.getElementById(cityName).remove();
    list.splice(list.indexOf(cityName), 1);
    localStorage.setItem(favoriteCitiesKey, JSON.stringify(list));
}

function degreesToDirection(degrees){
    if (degrees>11.25 && degrees<=33.75){
        return "NNE";
    }else if (degrees>33.75 && degrees<=56.25){
        return "ENE";
    }else if (degrees>56.25 && degrees<=78.75){
        return "E";
    }else if (degrees>78.75 && degrees<=101.25){
        return "ESE";
    }else if (degrees>101.25 && degrees<=123.75){
        return "ESE";
    }else if (degrees>123.75 && degrees<=146.25){
        return "SE";
    }else if (degrees>146.25 && degrees<=168.75){
        return "SSE";
    }else if (degrees>168.75 && degrees<=191.25){
        return "S";
    }else if (degrees>191.25 && degrees<=213.75){
        return "SSW";
    }else if (degrees>213.75 && degrees<=236.25){
        return "SW";
    }else if (degrees>236.25 && degrees<=258.75){
        return "WSW";
    }else if (degrees>258.75 && degrees<=281.25){
        return "W";
    }else if (degrees>281.25 && degrees<=303.75){
        return "WNW";
    }else if (degrees>303.75 && degrees<=326.25){
        return "NW";
    }else if (degrees>326.25 && degrees<=348.75){
        return "NNW";
    }else{
        return "N";
    }
}

