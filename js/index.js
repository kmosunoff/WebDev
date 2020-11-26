const openWeatherMapApiKey = 'b31c7794c25471b7cb20c3a835b69486';
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

    window.addEventListener('load', function(event) {
        document.getElementsByClassName('header-refresh-button')[0]
            .addEventListener('click', loadLocalWeather);

        document.getElementsByClassName('new-city-form')[0]
            .addEventListener('submit', addNewFavoriteCity);

        loadLocalWeather(null);
        addFavoriteCities();
    });

})()

async function loadLocalWeather(event) {
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
        addFavoriteCity(city, false);
    }
}

function addFavoriteCity(cityName, isNew) {
    let container = document.getElementsByClassName('favorite-cities')[0];
    let temp = document.getElementById('template-favorite-city');
    let node = document.importNode(temp.content, true);
    node.querySelector('button').addEventListener('click', removeCity);
    node.querySelector('.city-name').textContent = cityName;
    const currentId = isNew ? cityName : 'loading';
    node.querySelector('section').id = currentId;
    container.appendChild(node);
    cityNameIsValid(cityName, isNew)
        .then(correctCityName => {
            if (correctCityName) {
                if (isNew) {
                    const favoriteCities = JSON.parse(localStorage.getItem(favoriteCitiesKey));
                    favoriteCities.push(correctCityName);
                    localStorage.setItem(favoriteCitiesKey, JSON.stringify(favoriteCities));
                }
                getWeatherDataByCityName(correctCityName)
                    .then(value => {
                        fillNodeByIdWithWeather(currentId, value);
                    })
                    .catch(reason => {
                    container.removeChild(container.querySelector('#' + currentId));
                    alert('Internet disconnected');
                })
            }
            else {
                container.removeChild(container.querySelector('#' + currentId));
                alert('Cannot add city');
            }
        })
        .catch(reason => {
            container.removeChild(container.querySelector('#' + currentId));
            alert('Internet disconnected');
        });
}

function preprocessCityName(cityName) {
    const cityNameNoSpaces = cityName.replace(/\s/g, '');
    return cityNameNoSpaces.charAt(0).toUpperCase() + cityNameNoSpaces.substring(1).toLowerCase();
}

function addNewFavoriteCity(event) {
    event.preventDefault();
    let cityName = event.target.children[0].value;
    if (cityName === '') {
        return false;
    }
    cityName = preprocessCityName(cityName);
    event.target.children[0].value = '';
    addFavoriteCity(cityName, true);
    return false;
}

async function cityNameIsValid(cityName, isNew) {
    return new Promise((resolve, reject) => {
        if (!isNew) {
            resolve(cityName);
        }
        const favoriteCities = JSON.parse(localStorage.getItem(favoriteCitiesKey));
        if (favoriteCities.includes(cityName)) {
            resolve(null);
        }
        getWeatherDataByCityName(cityName)
            .then(response => {
                if (response.cod === 200
                    && !favoriteCities.includes(response['name'])) {
                    resolve(response['name']);
                }
                else {
                    resolve(null);
                }
            })
            .catch(reason => reject(reason));
    });
}

async function getPosition() {
    let latitude = 55.75;
    let longitude = 37.62;
    const errorMessage = ', defaulting to Moscow';
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;
                    resolve([latitude, longitude]);
                }, positionError => {
                    alert(positionError.message + errorMessage);
                    resolve([latitude, longitude]);
                });
        } else {
            alert('No geolocation available' + errorMessage);
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
    node.id = weather['name'];
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
    const node = document.getElementById('loading' + id) || document.getElementById(id);
    fillNodeWithWeather(node, weather);
}

function removeCity(event) {
    const cityName = event.path[2].id;
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

