// import config from '../config.json';
import express from 'express';
import moment from 'moment';

const router = express.Router();

router.get('/', (req, res, next) => {
  const sql = `SELECT * FROM locations ORDER BY id DESC`;
  req.db.all(sql)
    .then(
      (items) => {
        res.render('locations/index', {
          title: 'Locations',
          items
        });
      },
      (e) => {
        next(e);
      }
    );
});

router.get('/activate/:id', (req, res, next) => {
  const sql = `UPDATE locations SET active = 0 where active = 1`;
  req.db.run(sql)
    .then(
      () => {
        const sql2 = `UPDATE locations SET active = 1 WHERE id = ?`;
        return req.db.run(sql2, req.params.id);
      },
      (e) => Promise.reject(e)
    )
    .then(
      () => {
        res.redirect('/locations');
      },
      (e) => {
        next(e);
      }
    );
});

router.get('/deactivate/:id', (req, res, next) => {
  const sql = `UPDATE locations SET active = 0 where active = 1`;
  req.db.run(sql)
    .then(
      () => {
        res.redirect('/locations');
      },
      (e) => {
        next(e);
      }
    );
});

router.get('/edit/:id', (req, res, next) => {
  const sql = `SELECT * FROM locations WHERE id = ?`;
  req.db.get(sql, req.params.id)
    .then(
      (item) => {
        res.render('locations/edit', {
          title: 'Edit location',
          item
        });
      },
      (e) => {
        next(e);
      }
    );
});

router.post('/edit/:id', (req, res, next) => {
  req.db.run(`UPDATE locations SET
      name = $name,
      description = $description,
      altitude = $altitude,
      latitude = $latitude,
      longitude = $longitude
      WHERE id = $id
    `, {
      $name: req.body.name,
      $description: req.body.description,
      $altitude: req.body.altitude,
      $latitude: req.body.latitude,
      $longitude: req.body.longitude,
      $id: req.params.id
    })
    .then(
      (item) => {
        res.redirect('/locations');
      },
      (e) => {
        next(e);
      }
    );
});

router.get('/show/:id', (req, res, next) => {
  req.db.get(`SELECT * FROM locations WHERE id = $id`, { $id: req.params.id })
    .then(
      (item) => {
        const sql = `SELECT * FROM baseData WHERE location = ? ORDER BY time DESC LIMIT 10`;
        return req.db.all(sql, [item.id])
          .then(
            (relevations) => {
              return Promise.resolve({
                item,
                relevations
              });
            }
          );
      },
      (e) => Promise.reject(e)
    )
    .then(
      ({ item, relevations }) => {
        const lastTime = relevations.length > 0 ? relevations[0].time : null;
        const lastPressure = relevations.length > 0 ? relevations[0].pressure : null;
        const lastTemp = relevations.length > 0 ? relevations[0].temperature : null;
        const {
          avgPressure,
          avgTemperature
        } = relevations.reduce((prev, curr, pos) => {
          const sumOfPressure = (prev.avgPressure * pos) + curr.pressure;
          const sumOfTemperature = (prev.avgTemperature * pos) + curr.temperature;
          return {
            avgPressure: sumOfPressure / (pos + 1),
            avgTemperature: sumOfTemperature / (pos + 1)
          };
        }, {
          avgPressure: 0,
          avgTemperature: 0
        });
        const pressureHighMark = (avgPressure / 100 * 101);
        const pressureLowMark = (avgPressure / 100 * 99);
        const temperatureHighMark = (avgTemperature / 100 * 101);
        const temperatureLowMark = (avgTemperature / 100 * 99);
        const goodPressures = [];
        const goodTemperatures = [];
        relevations.forEach((r) => {
          const temp = r.temperature;
          const press = r.pressure;
          if (pressureLowMark < press && pressureHighMark > press) {
            goodPressures.push(press);
          }
          if (temperatureLowMark < temp && temperatureHighMark > temp) {
            goodTemperatures.push(temp);
          }
        });
        const averagePressure = goodPressures.reduce((prev, curr) => {
          return prev + curr;
        }, 0) / goodPressures.length;
        const averageTemperature = goodTemperatures.reduce((prev, curr) => {
          return prev + curr;
        }, 0) / goodTemperatures.length;
        return Promise.resolve({
          item,
          relevations,
          lastTime,
          lastPressure,
          lastTemp,
          averagePressure,
          averageTemperature
        });
      },
      (e) => {
        next(e);
      }
    )
    .then(
      ({
        item,
        ...rest
      }) => {
        res.render('locations/show', {
          moment,
          title: `Show: ${item.name}`,
          item,
          ...rest
        });
      },
      (e) => {
        next(e);
      }
    );
});

export default router;
