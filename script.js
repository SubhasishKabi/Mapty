'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); //converted into a string
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }

  click() {
    this.clicks++;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run = new Running([39, -12], 5.2, 2.4, 178)
// const cycle = new Cycling([39, -12], 27, 95, 523)
// console.log(run, cycle)

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

///---------------------------------------APPLICATION------------------------------------------------------/////
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 15;
  constructor() {
    //console.log(this)
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    //in an event listen, the 'this' keyword refers to the element

    inputType.addEventListener('change', this._addElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    //get data from local storage
    this._getLocalStorage();
  }

  // 1)

  _getPosition() {
    if (navigator.geolocation) {
      //The bind() method creates a new function that, when called, has its this keyword set to the provided value,
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), //thus is treated as a regular functon call. not a method call. In a regular function call 'this' is set to undefined

        function () {
          alert('Could not get position');
        }
      );
    }
  }

  // 2)

  _loadMap(position) {
    //console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    //console.log(latitude, longitude);
    //console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    //console.log(this)
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  // 3)

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // 4)

  _addElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // 5)

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // 1) Get Data from the form
    const type = inputType.value; //this has a feild value
    const distance = +inputDistance.value; //converetd into a number
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // 2) Check if the data is valid

    // 3) If workout running, create running object

    if (type === 'running') {
      const cadence = +inputCadence.value;

      // !Number.isFinite(distance) ||
      // !Number.isFinite(duration) ||
      // Number.isFinite(cadence)
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to positive numbers');
      }

      workout = new Running([lat, lng], distance, duration, cadence); // this will create a new object
    }

    // 4) If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      // !Number.isFinite(distance) ||
      // !Number.isFinite(duration) ||
      // Number.isFinite(cadence)
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to positive numbers');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation); // this will create a new object
    }

    // 5) Add new object to workout array
    this.#workouts.push(workout);
    console.log(this.#workouts);

    // 6) Render workout as marker on the map
    this._renderWorkoutMarker(workout); //here we dont need bind because, it is not a call back function

    // 7) render workout on the list

    this._renderWorkout(workout);
    // 8) Hide form and clear theinput fields

    this._hideForm();

    // set local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚴‍♂️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
     <li class="workout workout--${workout.type}" data-id="${workout.id}">
       <h2 class="workout__title">${workout.description}</h2>
       <div class="workout__details">
         <span class="workout__icon">${
           workout.type === 'running' ? '🏃' : '🚴‍♂️'
         }</span>
         <span class="workout__value">${workout.distance}</span>
         <span class="workout__unit">km</span>
       </div>
       <div class="workout__details">
         <span class="workout__icon">⏱</span>
         <span class="workout__value">24</span>
         <span class="workout__unit">min</span>
       </div>`;

    if (workout.type == 'running') {
      html += `    
         <div class="workout__details">
         <span class="workout__icon">⚡️</span>
         <span class="workout__value">${workout.pace.toFixed(1)}</span>
         <span class="workout__unit">min/km</span>
       </div>
       <div class="workout__details">
         <span class="workout__icon">🦶🏼</span>
         <span class="workout__value">${workout.cadence}</span>
         <span class="workout__unit">spm</span>
       </div>
     </li>`;
    }

    if (workout.type === 'cycling') {
      `
       <div class="workout__details">
         <span class="workout__icon">⚡️</span>
         <span class="workout__value">${workout.speed.toFixed(1)}</span>
         <span class="workout__unit">km/h</span>
       </div>
       <div class="workout__details">
         <span class="workout__icon">⛰</span>
         <span class="workout__value">${workout.elevationGain}</span>
         <span class="workout__unit">m</span>
       </div>
     </li> -->`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    //workout.click();
  }

  _setLocalStorage() {
    //here the 'workouts' is name not the array of objects
    //but inside stringify, it is the workouts objects
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
}

const app = new App();
