import sqlite from 'sqlite';

export default class {
  constructor (params) {
    const name = params.name;
    if (!name) {
      throw new Error('No db name given!');
    }
    this.params = params;
  }

  init () {
    if (this.initialized) {
      return Promise.resolve();
    }
    return sqlite.open(this.params.name, { verbose: true })
      .then(
        (db) => {
          this.db = db;
          this.initialized = true;
          return Promise.resolve();
        },
        (e) => {
          return Promise.reject(e);
        }
      );
  }

  run (sql, params) {
    return this.init()
      .then(
        () => {
          return this.db
            .run(sql, params)
            .then(
              (dbRes) => {
                return Promise.resolve(dbRes);
              },
              (e) => {
                return Promise.reject(e);
              }
            );
        },
        (e) => Promise.reject(e)
      );
  }

  get (sql, params) {
    return this.init()
      .then(
        () => {
          return this.db
            .get(sql, params)
            .then(
              (dbRes) => {
                return Promise.resolve(dbRes);
              },
              (e) => {
                return Promise.reject(e);
              }
            );
        },
        (e) => Promise.reject(e)
      );
  }

  all (sql, params) {
    return this.init()
      .then(
        () => {
          return this.db
            .all(sql, params)
            .then(
              (dbRes) => {
                return Promise.resolve(dbRes);
              },
              (e) => {
                return Promise.reject(e);
              }
            );
        },
        (e) => Promise.reject(e)
      );
  }

  createSensorTable (tableName, rows) {
    return new Promise((resolve, reject) => {
      const rowsDefinition = rows.reduce((prev, curr) => {
        const comma = prev.length > 0 ? ', ' : '';
        return `${prev}${comma}${curr.name}${curr.type ? ' ' + curr.type : ''}${curr.key ? ' ' + curr.key : ''}`;
      }, 'time INTEGER NOT NULL');
      const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (
        ${rowsDefinition},
        location INTEGER REFERENCES locations (id) ON DELETE CASCADE
          ON UPDATE CASCADE
          MATCH [FULL]
      )`;
      this.db.run(sql)
        .then(
          (res) => {
            // console.log('res1', res);
            this.db.run(`CREATE INDEX time_location ON ${tableName} (
                time,
                location
              );`)
              .then(
                () => {
                  this.db.run(`CREATE INDEX time ON ${tableName} (
                      time
                    );`)
                    .then(
                      () => {
                        resolve();
                      },
                      () => {
                        resolve();
                      }
                    );
                },
                () => {
                  this.db.run(`CREATE INDEX time ON ${tableName} (
                      time
                    );`)
                    .then(
                      () => {
                        resolve();
                      },
                      () => {
                        resolve();
                      }
                    );
                }
              );

            // resolve();
          },
          (e) => {
            // console.log('e', e);
            reject(e);
          }
        );
    });
  }
}
