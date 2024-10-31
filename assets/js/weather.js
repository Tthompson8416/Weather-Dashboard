function initPage() {
    // DOM Elements
    const cityEl = document.getElementById("enter-city");
    const searchEl = document.getElementById("search-button");
    const clearEl = document.getElementById("clear-history");
    const nameEl = document.getElementById("city-name");
    const currentPicEl = document.getElementById("current-pic");
    const currentTempEl = document.getElementById("temperature");
    const currentHumidityEl = document.getElementById("humidity");
    const currentWindEl = document.getElementById("wind-speed");
    const currentUVEl = document.getElementById("UV-index");
    const historyEl = document.getElementById("history");
    const fivedayEl = document.getElementById("fiveday-header");
    const todayweatherEl = document.getElementById("today-weather");
    let searchHistory = JSON.parse(localStorage.getItem("search")) || [];

    const APIKey = CONFIG.OPENWEATHER_API_KEY;

    function debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Updated loading state handler to match new styles
    function setLoadingState(isLoading) {
        const searchButton = document.getElementById("search-button");
        if (isLoading) {
            searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            searchButton.disabled = true;
            searchButton.classList.add('opacity-50');
        } else {
            searchButton.innerHTML = '<i class="fas fa-search"></i>';
            searchButton.disabled = false;
            searchButton.classList.remove('opacity-50');
        }
    }

    // Updated error handling to match new styles
    function handleError(error, message = "An error occurred. Please try again.") {
        console.error("Error:", error);
        const errorDiv = document.createElement("div");
        errorDiv.className = "alert alert-danger alert-dismissible fade show mt-3 shadow-sm";
        errorDiv.role = "alert";
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle mr-2"></i>${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;
        document.querySelector("aside").appendChild(errorDiv);
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }

    async function getWeather(cityName) {
        if (!cityName.trim()) {
            handleError(null, "Please enter a city name");
            return;
        }

        setLoadingState(true);

        try {
            const queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${APIKey}`;
            const response = await axios.get(queryURL);
            
            todayweatherEl.classList.remove("d-none");
            
            // Updated to match new HTML structure
            const formattedDate = formatDate(response.data.dt);
            nameEl.innerHTML = `${response.data.name} (${formattedDate})`;
            
            const weatherPic = response.data.weather[0].icon;
            currentPicEl.setAttribute("src", `https://openweathermap.org/img/wn/${weatherPic}@2x.png`);
            currentPicEl.setAttribute("alt", response.data.weather[0].description);
            
            // Updated weather info display to match new structure
            currentTempEl.innerHTML = `
                <i class="fas fa-thermometer-half mr-2"></i>
                <span class="weather-text">Temperature: ${k2f(response.data.main.temp)}°F</span>
            `;
            currentHumidityEl.innerHTML = `
                <i class="fas fa-tint mr-2"></i>
                <span class="weather-text">Humidity: ${response.data.main.humidity}%</span>
            `;
            currentWindEl.innerHTML = `
                <i class="fas fa-wind mr-2"></i>
                <span class="weather-text">Wind Speed: ${response.data.wind.speed} MPH</span>
            `;

            const { lat, lon } = response.data.coord;
            const UVQueryURL = `https://api.openweathermap.org/data/2.5/uvi/forecast?lat=${lat}&lon=${lon}&appid=${APIKey}&cnt=1`;
            const uvResponse = await axios.get(UVQueryURL);
            
            const uvValue = uvResponse.data[0].value;
            const uvClass = uvValue < 4 ? 'success' : uvValue < 8 ? 'warning' : 'danger';
            currentUVEl.innerHTML = `
                <i class="fas fa-sun mr-2"></i>
                <span class="weather-text">UV Index: 
                    <span class="badge badge-${uvClass} p-2">${uvValue}</span>
                </span>
            `;

            // Updated forecast display
            const forecastQueryURL = `https://api.openweathermap.org/data/2.5/forecast?id=${response.data.id}&appid=${APIKey}`;
            const forecastResponse = await axios.get(forecastQueryURL);
            
            fivedayEl.classList.remove("d-none");
            
            const forecastEls = document.querySelectorAll(".forecast");
            forecastEls.forEach((el, i) => {
                const forecastIndex = i * 8 + 4;
                const forecastData = forecastResponse.data.list[forecastIndex];
                
                el.innerHTML = `
                    <div class="forecast-content">
                        <h5 class="forecast-date mb-3">${formatDate(forecastData.dt)}</h5>
                        <img src="https://openweathermap.org/img/wn/${forecastData.weather[0].icon}@2x.png" 
                             alt="${forecastData.weather[0].description}" 
                             class="weather-icon mb-2">
                        <p class="mb-2"><i class="fas fa-thermometer-half mr-1"></i> ${k2f(forecastData.main.temp)}°F</p>
                        <p class="mb-2"><i class="fas fa-wind mr-1"></i> ${forecastData.wind.speed} MPH</p>
                        <p class="mb-0"><i class="fas fa-tint mr-1"></i> ${forecastData.main.humidity}%</p>
                    </div>
                `;
            });

        } catch (error) {
            handleError(error, "City not found. Please check the spelling and try again.");
            todayweatherEl.classList.add("d-none");
            fivedayEl.classList.add("d-none");
        } finally {
            setLoadingState(false);
        }
    }

    // Updated search history rendering to match new styles
    function renderSearchHistory() {
        historyEl.innerHTML = "";
        searchHistory.forEach(city => {
            const historyButton = document.createElement("button");
            historyButton.className = "btn w-100 mb-2 text-left history-item";
            historyButton.innerHTML = `<i class="fas fa-history mr-2"></i>${city}`;
            historyButton.addEventListener("click", () => getWeather(city));
            historyEl.appendChild(historyButton);
        });
    }

    function k2f(K) {
        return Math.round((K - 273.15) * 1.8 + 32);
    }

    // Event Listeners
    searchEl.addEventListener("click", debounce(() => {
        const searchTerm = cityEl.value.trim();
        if (searchTerm) {
            getWeather(searchTerm);
            searchHistory = [searchTerm, ...searchHistory.filter(item => 
                item.toLowerCase() !== searchTerm.toLowerCase()
            )].slice(0, 8); // Reduced to 8 for better UI
            localStorage.setItem("search", JSON.stringify(searchHistory));
            renderSearchHistory();
            cityEl.value = "";
        }
    }, 300));

    cityEl.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            searchEl.click();
        }
    });

    clearEl.addEventListener("click", () => {
        localStorage.clear();
        searchHistory = [];
        renderSearchHistory();
        todayweatherEl.classList.add("d-none");
        fivedayEl.classList.add("d-none");
    });

    // Initialize
    renderSearchHistory();
    if (searchHistory.length > 0) {
        getWeather(searchHistory[0]);
    }
}

initPage();