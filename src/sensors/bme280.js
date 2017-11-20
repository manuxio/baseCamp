import Emitter from 'es6-event-emitter';
import BME280 from 'node-bme280';


const getRandomArbitrary = (min, max) => {
  return Math.random() * (max - min) + min;
}

export default class Virtual extends Emitter {
  // constructor (params) {
  //   console.log('Params', params);
  // }

  init () {
    this.sensor = new BME280({address: 0x76});
	return new Promise((resolve, reject) => {
    this.sensor.begin(() => {

	this.startUp();
    	resolve({
      		baseData : [
        { name: 'pressure', type: 'NUMERIC' },
        { name: 'temperature', type: 'NUMERIC' },
        { name: 'humidity', type: 'NUMERIC' }
      ]
    });

	});

    });
  }

  startUp () {
    setTimeout(() => {
      this.sensor.readPressureAndTemparature((err, pressure, temperature, humidity) => { this.emitData(err, pressure, temperature, humidity); }); 
    }, 250);
  }

  emitData (err, pressure, temperature, humidity) {
    this.trigger('newData', {
      name: 'baseData',
      time: (new Date()).getTime(),
      pressure,
      temperature,
      humidity
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
