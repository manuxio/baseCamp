// import config from '../config.json';
import express from 'express';

const router = express.Router();

router.get('/', (req, res, next) => {
  res.send('Hello!');
});

export default router;
