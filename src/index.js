import config from './config.json';
import webServer from './webserver';
import sensors from './sensors';
import Database from './database';

const db = new Database({ name: './data/alldata.sqlite' });
const pendingWrites = [];

const saveData = (data) => {
  // console.log('data', data);
  const tableName = data.name;
  const keys = Object.keys(data).filter((n) => n !== 'name');
  db.get(`SELECT id FROM locations WHERE active = 1`)
    .then(
      (location) => {
        if (location) {
          // console.log('Location', location);
          const values = keys.reduce((prev, curr) => {
            if (curr !== 'name') {
              prev.push(data[curr]);
            }
            return prev;
          }, []);
          values.push(location.id);
          keys.push('location');
          // console.log('Values', values);
          const sql = `INSERT INTO ${tableName}
            (
              ${keys.join(', ')}
            )
            VALUES (
              ${keys.map((n) => `?`).join(', ')}
            )`;
          // console.log(sql, values);
          // return db.run(sql, values);
          pendingWrites.push({ sql, values });
          return Promise.resolve();
        }
      },
      (e) => Promise.reject(e)
    )
    .then(
      () => {
        // console.info('Data written!');
      },
      (e) => {
        console.error(e);
      }
    )
}
const commitWrites = () => {
  if (pendingWrites.length > 0) {
    db.run('BEGIN')
      .then(
        () => {
          const queue = [];
          while (pendingWrites.length) {
            queue.push(pendingWrites.shift());
          }
          const allOps = queue.map(({ sql, values }) => {
            return db.run(sql, values);
          });
          return Promise.all(allOps);
        },
        (e) => Promise.reject(e)
      )
      .then(
        () => {
          return db.run('END TRANSACTION');
        },
        (e) => Promise.reject(e)
      )
      .then(
        () => {
          console.info('Queue drained');
        },
        (e) => {
          console.error(e);
        }
      );
  }
}

db.init()
  .then(
    () => {
      const sql = `CREATE TABLE IF NOT EXISTS locations (
        id          INTEGER    PRIMARY KEY AUTOINCREMENT,
        name        CHAR (64),
        altitude    NUMERIC    NOT NULL
                               DEFAULT (100),
        description CHAR (256),
        latitude    DECIMAL    NOT NULL,
        longitude   DECIMAL    NOT NULL,
        active      INTEGER (1)
      )`;
      return db.run(sql);
    },
    (e) => Promise.reject(e)
  )
  .then(
    () => {
      const sql = `CREATE INDEX active ON locations (
          active
      )`;
      return db.run(sql)
        .then(
          () => Promise.resolve(),
          (e) => Promise.resolve()
        );
    },
    (e) => Promise.reject(e)
  )
  .then(
    (dbResult) => {
      const allPp = config.sensors.map((sensor) => {
        const SensorClass = sensors[sensor.module];
        const m = new SensorClass(config);
        return m.init().then(
          (sensorUnits) => {
            const tableNames = Object.keys(sensorUnits);
            const createPromises = tableNames.map((tName) => {
              const units = sensorUnits[tName];
              return db.init().then(
                () => {
                  return db.createSensorTable(tName, units);
                }
              );
            });
            return Promise.all(createPromises)
              .then(
                () => {
                  return Promise.resolve({
                    sensor: m,
                    sensorUnits
                  });
                },
                (e) => {
                  return Promise.reject(e);
                }
              );
          },
          (e) => {
            return Promise.reject(e);
          }
        );
      });
      return Promise.all(allPp);
    },
    (e) => Promise.reject(e)
  )
  .then(
    (activeSensors) => {
	console.log('z');
      activeSensors.forEach((sensor) => {
        sensor.sensor.on('newData', (data) => {
          saveData(data);
        });
      });
      return Promise.resolve(activeSensors);
    },
    (e) => Promise.resolve(e)
  )
  .then(
    (activeSensors) => {
	console.log('y');
      return webServer(db);
    },
    (e) => Promise.reject(e)
  )
  .then(
    () => {
	console.log('x');
      setInterval(() => {
        commitWrites();
      }, 1000);
      return Promise.resolve();
    },
    (e) => Promise.reject(e)
  )
  .then(
    () => {
      console.info('App running!');
    },
    (e) => {
      console.error(e);
    }
  );
