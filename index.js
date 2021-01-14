const state = {
    preferences: {
      searchHistory: [],
      currentCity: "",
      metric: true,
    },
    tempUnit: function () {
      if (this.preferences.metric) {
        return " \xB0C";
      } else {
        return " \xB0F";
      }
    },
    windUnit: function () {
      if (this.preferences.metric) {
        return " m/s";
      } else {
        return " mph";
      }
    },
    unitValue: function () {
      if (this.preferences.metric) {
        return "metric";
      } else {
        return "imperial";
      }
    },
  };
  const apiKey = "26dd15df3bedb44125f5223c454e0614";
  
  // Elements
  const searchInputEl = document.getElementById("search-input");
  const searchButtonEl = document.getElementById("search-button");
  const searchHistoryEl = document.getElementById("search-history");
  const clearHistoryButtonEl = document.getElementById("clear-button");
  const weatherIconEl = document.querySelector(".weather-icon");
  const unitButtonGroupEl = document.querySelector(".unit-button-group");
  const futureForecastRowEl = document.querySelector(".future-forecast-row");
  const weatherDescriptionEl = document.querySelector(".weather-description");
  const findMeEl = document.getElementById("find-me");
  
  // Functions
  const clearError = () => {
    // Used to clear errors before retrying
    if (document.querySelector(".alert-danger")) {
      document.querySelector(".alert-danger").remove();
    }
  };
  
  const clearWeatherIcon = () => {
    // Need to clear existing weather icon prior rendering next city
    weatherIconEl.innerHTML = "";
    weatherDescriptionEl.innerHTML = "";
  };
  
  const clearForecast = () => {
    // Need to clear existing future forecast
    futureForecastRowEl.innerHTML = "";
  };
  
  const renderSearchHistory = () => {
    while (searchHistoryEl.firstChild) {
      searchHistoryEl.removeChild(searchHistoryEl.firstChild);
    }
    state.preferences.searchHistory.forEach((el) => {
      const liEl = document.createElement("li");
      liEl.setAttribute("class", "nav-item search-item");
      liEl.setAttribute("data-value", el.id);
      liEl.textContent = `${el.name}, ${el.country}`;
      const delEl = document.createElement("i");
      delEl.setAttribute("class", "fas fa-trash");
      delEl.setAttribute("data-action", "delete");
      liEl.appendChild(delEl);
      searchHistoryEl.prepend(liEl);
    });
  };
  
  const addToSearchHistory = (id, name, country) => {
    if (!state.preferences.searchHistory.find((element) => element.id === id)) {
      state.preferences.searchHistory.push({
        id: id,
        name: name,
        country: country,
      });
      saveLocalStorageState();
      renderSearchHistory();
    }
  };
  
  const renderCurrentDate = (dateTime) => {
    const currentDate = moment
      .unix(dateTime)
      .format("dddd, MMMM Do YYYY, h:mm a");
    const timeZone = moment.tz(moment.tz.guess()).zoneAbbr();
    document.querySelector(".current-date").textContent =
      currentDate + " " + timeZone;
  };
  
  const saveLocalStorageState = () => {
    localStorage.setItem(
      "weatherAppPreferences",
      JSON.stringify(state.preferences)
    );
  };
  
  const createFutureCard = (dateTime, temp, humidity, icon) => {
    const date = moment.unix(dateTime).format("M/D/YYYY");
    const cardColEl = document.createElement("div");
    cardColEl.setAttribute("class", "col");
    const cardEl = document.createElement("div");
    cardEl.setAttribute("class", "card bg-light mb-3");
    const cardBodyEl = document.createElement("div");
    cardBodyEl.setAttribute("class", "card-body");
    const cardTitleEl = document.createElement("h5");
    cardTitleEl.setAttribute("class", "card-title");
    cardTitleEl.textContent = date;
    cardBodyEl.appendChild(cardTitleEl);
    const cardWeatherIconEl = document.createElement("img");
    cardWeatherIconEl.src = `https://openweathermap.org/img/wn/${icon}.png`;
    cardWeatherIconEl.alt = "weather-icon";
    cardBodyEl.appendChild(cardWeatherIconEl);
    const cardTempEl = document.createElement("p");
    cardTempEl.setAttribute("class", "card-temptext");
    cardTempEl.textContent = "T: " + temp + state.tempUnit();
    cardBodyEl.appendChild(cardTempEl);
    const cardHumEl = document.createElement("p");
    cardHumEl.textContent = "H: " + humidity + " %";
    cardBodyEl.appendChild(cardHumEl);
    cardEl.appendChild(cardBodyEl);
    cardColEl.appendChild(cardEl);
    futureForecastRowEl.appendChild(cardColEl);
  };
  
  const renderCurrent = (
    name,
    country,
    temp,
    humidity,
    windSpeed,
    icon,
    description,
    dateTime
  ) => {
    document.querySelector(".active-city").textContent = `${name}, ${country}`;
    document.querySelector(".temperature-text").textContent =
      temp + state.tempUnit();
    document.querySelector(".humidity-text").textContent = humidity + " %";
    document.querySelector(".wind-text").textContent =
      windSpeed + state.windUnit();
  
    const weatherIconImageEl = document.createElement("img");
    weatherIconImageEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    weatherIconImageEl.alt = "weather-icon";
    weatherIconImageEl.setAttribute("class", "weather-icon-img");
    weatherIconEl.appendChild(weatherIconImageEl);
    weatherDescriptionEl.textContent = description;
    renderCurrentDate(dateTime);
    searchInputEl.value = "";
  };
  
  const renderUV = (value) => {
    const uvEl = document.querySelector(".uv-text");
    uvEl.textContent = value;
    valueInt = parseInt(value);
  
    if (valueInt <= 2) {
      uvEl.setAttribute("data-value", "low");
    } else if (valueInt <= 5 && valueInt >= 3) {
      uvEl.setAttribute("data-value", "moderate");
    } else if (parseInt(valueInt) <= 7 && valueInt >= 6) {
      uvEl.setAttribute("data-value", "high");
    } else if (valueInt <= 10 && valueInt >= 8) {
      uvEl.setAttribute("data-value", "veryhigh");
    } else if (valueInt >= 11) {
      uvEl.setAttribute("data-value", "extreme");
    } else {
      uvEl.setAttribute("data-value", "na");
    }
  };
  
  const getUVIndex = (latitude, longitude) => {
    const queryUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
    fetch(queryUrl)
      .then((res) => res.json())
      .then((data) => {
        renderUV(data.value);
      });
  };
  
  const localizeAndFilter = (tzOffset, fullForecast) => {
    // Store day of first element so to know how much to advance for forecast
    let selectedForecast = [];
    let advanceCounter = 0;
    for (i = 0; i < 5; i++) {
      const selectedDay = {};
      selectedDay.dt = fullForecast[advanceCounter].dt;
      selectedDay.temp = fullForecast[advanceCounter].main.temp;
      selectedDay.humidity = fullForecast[advanceCounter].main.humidity;
      selectedDay.weathericon = fullForecast[advanceCounter].weather[0].icon;
      selectedForecast.push(selectedDay);
      advanceCounter += 8;
    }
    return selectedForecast;
  };
  
  const getFuture = (id) => {
    clearForecast();
    const queryParams = `id=${id}`;
    const queryUrl = `https://api.openweathermap.org/data/2.5/forecast?${queryParams}&units=${state.unitValue()}&appid=${apiKey}`;
    fetch(queryUrl)
      .then((res) => res.json())
      .then((data) => {
        // process all dates and create an array for 5 days
        const forecast = localizeAndFilter(data.city.timezone, data.list);
        // foreach element in array run createfuturecard
        forecast.forEach((element) => {
          createFutureCard(
            element.dt,
            element.temp,
            element.humidity,
            element.weathericon
          );
        });
      });
  };
  
  const searchHandler = (query, queryType, includeInHistory = true) => {
    //addToSearchHistory(searchInputEl.value);
    // fetch api
    // then process request
    // add to search history
    // add to current city in localstorage
    // render display
    // or catch error
    clearError();
    clearWeatherIcon();
    switch (queryType) {
      case "id":
        queryParams = `id=${query}`;
        break;
      case "position":
        queryParams = `lat=${query.latitude}&lon=${query.longitude}`;
        break;
      default:
        queryParams = `q=${query}`;
    }
    const queryUrl = `https://api.openweathermap.org/data/2.5/weather?${queryParams}&units=${state.unitValue()}&appid=${apiKey}`;
    fetch(queryUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.cod === 200) {
          state.preferences.currentCity = data.id;
          searchButtonEl.disabled = true;
          saveLocalStorageState();
          getUVIndex(data.coord.lat, data.coord.lon);
          getFuture(data.id);
          renderCurrent(
            data.name,
            data.sys.country,
            data.main.temp,
            data.main.humidity,
            data.wind.speed,
            data.weather[0].icon,
            data.weather[0].description,
            data.dt
          );
        } else {
          throw data.cod;
        }
        if (includeInHistory) {
          addToSearchHistory(data.id, data.name, data.sys.country);
          saveLocalStorageState();
        }
      })
      .catch((err) => {
        showErrorAlert(err, query);
      });
  };
  
  const showErrorAlert = (err, query) => {
    const mainEl = document.querySelector("main");
    const alertEl = document.createElement("div");
    alertEl.setAttribute("class", "alert alert-danger");
    alertEl.setAttribute("role", "alert");
    err == 404
      ? (alertEl.textContent = `Cannot find city with name: ${query}`)
      : (alertEl.textContent = `An error has occured with status: ${err}`);
    mainEl.prepend(alertEl);
  };
  
  const getItemHandler = (query, queryType) => {
    searchHandler(query, queryType, false);
  };
  
  const deleteItemHandler = (id) => {
    state.preferences.searchHistory.splice(
      state.preferences.searchHistory.findIndex((element) => element.id == id),
      1
    );
    saveLocalStorageState();
    renderSearchHistory();
  };
  
  const initUnitButton = () => {
    state.preferences.metric
      ? document.getElementById("metric-button").setAttribute("checked", "")
      : document.getElementById("imperial-button").setAttribute("checked", "");
  };
  
  const sendGeoLocationCoordinates = (position) => {
    searchHandler(
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      "position",
      true
    );
  };
  
  const geoLocationErrorHandler = (err) => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        showErrorAlert("Geolocation request denied.");
        break;
      case err.POSITION_UNAVAILABLE:
        showErrorAlert("Location information is unavailable.");
        break;
      case err.TIMEOUT:
        showErrorAlert("Geolocation request timed out.");
        break;
      case err.UNKNOWN_ERROR:
        showErrorAlert("An unknown error has occured.");
        break;
    }
  };
  
  const findMeHandler = () => {
    if (navigator.geolocation) {
      clearError();
      navigator.geolocation.getCurrentPosition(
        sendGeoLocationCoordinates,
        geoLocationErrorHandler
      );
    }
  };
  
  // Event listeners
  clearHistoryButtonEl.addEventListener("click", () => {
    state.preferences.searchHistory = [];
    saveLocalStorageState();
    renderSearchHistory();
  });
  
  document.getElementById("search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    searchHandler(searchInputEl.value, "name", true);
  });
  
  searchHistoryEl.addEventListener("click", (event) => {
    event.target.getAttribute("data-action")
      ? deleteItemHandler(event.target.parentElement.getAttribute("data-value"))
      : getItemHandler(event.target.getAttribute("data-value"), "id");
  });
  
  searchInputEl.addEventListener("keyup", () => {
    searchInputEl.value
      ? (searchButtonEl.disabled = false)
      : (searchButtonEl.disabled = true);
  });
  
  unitButtonGroupEl.addEventListener("click", (event) => {
    const unitButtonVal = event.target.getAttribute("data-value");
    if (
      (unitButtonVal === "metric" && state.preferences.metric) ||
      (unitButtonVal === "imperial" && !state.preferences.metric)
    ) {
      return;
    } else {
      switch (event.target.getAttribute("data-value")) {
        case "imperial":
          state.preferences.metric = false;
          searchHandler(state.preferences.currentCity, "id", false);
          break;
        default:
          state.preferences.metric = true;
          searchHandler(state.preferences.currentCity, "id", false);
          break;
      }
    }
  });
  
  findMeEl.addEventListener("click", () => findMeHandler());
  
  // Main program
  // Pull search history array from localStorage
  // Pull last city from localStorage
  if (localStorage.getItem("weatherAppPreferences")) {
    state.preferences = JSON.parse(localStorage.getItem("weatherAppPreferences"));
    searchHandler(state.preferences.currentCity, "id", false);
    initUnitButton();
    renderSearchHistory();
  } else {
    // use FindMe if localStorage is absent;
    state.preferences.metric = true;
    findMeHandler();
    initUnitButton();
  }
  