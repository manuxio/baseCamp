import config from '../config.json';
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';

import homePageRoute from './routes/homePage';
import locationsRoute from './routes/locations';

export default (db) => {
  const app = express();
  app.set('view engine', 'pug');
  app.use(express.static(path.join(__dirname, '/static')));
  app.set('views', path.join(__dirname, '/views'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    req.db = db;
    next();
  });
  app.use('/', homePageRoute);
  app.use('/locations', locationsRoute);
  app.listen(config.webPort);
  return Promise.resolve(app);
};
