import Emitter from 'es6-event-emitter';

const getRandomArbitrary = (min, max) => {
  return Math.random() * (max - min) + min;
}

export default class Virtual extends Emitter {
  // constructor (params) {
  //   console.log('Params', params);
  // }

  init () {
    this.startUp();
    this.lastPressure = getRandomArbitrary(980, 1020.23);
    this.lastTemperature = getRandomArbitrary(28, 32);
    return Promise.resolve({
      altPress: [
        { name: 'pressure', type: 'NUMERIC' },
        { name: 'temperature', type: 'NUMERIC' },
        { name: 'rawpressure', type: 'NUMERIC' },
        { name: 'rawtemperature', type: 'NUMERIC' }
      ]
    });
  }

  startUp () {
    setTimeout(() => {
      this.emitData();
    }, 250);
  }

  emitData () {
    this.lastPressure += getRandomArbitrary(-0.3, 0.3);
    this.lastTemperature += getRandomArbitrary(-0.3, 0.3);
    this.trigger('newData', {
      name: 'altPress',
      time: (new Date()).getTime(),
      pressure: this.lastPressure,
      temperature: this.lastTemperature
    });
    this.startUp();
  }

  getData (index) {
    switch (index) {
      case 'altPress': {
        return Promise.resolve({
          altitude: NaN,
          pressure: NaN,
          temperature: NaN
        });
      }
      default: {
        return Promise.reject(new Error('no valid index!'));
      }
    }
  }
}
