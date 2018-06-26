'use strict';

import { Router } from 'express';
import bodyParser from 'body-parser';
import Dinosaur from '../model/dinosaur';
import logger from '../lib/logger';

const jsonParser = bodyParser.json();
const dinosaurRouter = new Router();

dinosaurRouter.post('/api/dinosaurs', jsonParser, (request, response, next) => {
  logger.log(logger.INFO, 'DINOSAUR-ROUTER POST to /api/dinosaurs - processing a request');
  if (!request.body.name) {
    const err = new Error('Name required');
    err.status = 400;
    next(err);
    
    // logger.log(logger.INFO, 'DINOSAUR-ROUTER POST /api/dinosaurs: Responding with 400 error for no name');
    // return response.sendStatus(400);
  }

  Dinosaur.init()
    .then(() => {
      return new Dinosaur(request.body).save();
    })
    .then((newDinosaur) => {
      logger.log(logger.INFO, `DINOSAUR-ROUTER POST:  a new dinosaur was saved: ${JSON.stringify(newDinosaur)}`);
      return response.json(newDinosaur);
    })
    .catch(next);
  return undefined;
});

dinosaurRouter.get('/api/dinosaurs/:id?', (request, response, next) => {
  logger.log(logger.INFO, 'DINOSAUR-ROUTER GET /api/dinosaurs/:id = processing a request');

  if (!request.params.id) {
    return Dinosaur.find({})
      .then((dinosaurs) => {
        logger.log(logger.INFO, 'DINOSAUR-ROUTER GET /api/dinosaurs responding with 200 code for successful get');
        return response.json(dinosaurs);
      })
      .catch(next);
  }

  // TODO: refactor this to use find by id and delete or find by id and remove
  return Dinosaur.findOne({ _id: request.params.id })
    .then((dinosaur) => {
      if (!dinosaur) {
        const err = new Error(`Dinosaur # ${request.params.id} not found`);
        err.status = 404;
        next(err);
        // logger.log(logger.INFO, 'DINOSAUR-ROUTER GET /api/dinosaurs/:id: responding with 404 status code for no dinosaur found');
        // return response.sendStatus(404);
      }
      logger.log(logger.INFO, 'DINOSAUR-ROUTER GET /api/dinosaurs/:id: responding with 200 status code for successful get');
      return response.json(dinosaur);
    })
    .catch(next);
});

dinosaurRouter.put('/api/dinosaurs/:id?', jsonParser, (request, response, next) => {
  if (!request.params.id) {
    const err = new Error('Id required');
    err.status = 400;
    next(err);
    // logger.log(logger.INFO, 'DINOSAUR-ROUTER PUT /api/dinosaurs: Responding with a 400 error code for no id passed in');
    // return response.sendStatus(400);
  }

  const options = {
    new: true,
    runValidators: true,
  };

  Dinosaur.init()
    .then(() => {
      return Dinosaur.findByIdAndUpdate(request.params.id, request.body, options);
    })
    .then((updatedDinosaur) => {
      logger.log(logger.INFO, `DINOSAUR-ROUTER PUT - responding with a 200 status code for successful updated dinosaur: ${JSON.stringify(updatedDinosaur)}`);
      return response.json(updatedDinosaur);
    })
    .catch(next);
  return undefined;
});

dinosaurRouter.delete('/api/dinosaurs/:id?', (request, response, next) => {
  logger.log(logger.INFO, 'DINOSAUR-ROUTER DELETE /api/dinosaurs/:id = processing a request');

  if (!request.params.id) return response.sendStatus(404);

  // TODO: refactor to use find by id and delete, or find by id and remove
  return Dinosaur.deleteOne({ _id: request.params.id })
    .then((data) => {
      if (!data.n) {
        // TODO: figure out why this isn't working!
        // const err = new Error('Id required');
        // err.status = 400;
        // next(err);
        
        logger.log(logger.INFO, 'DINOSAUR-ROUTER DELETE /api/dinosaurs/:id responding with 404 status code for no dinosaur found');
        return response.sendStatus(400);
      }

      logger.log(logger.INFO, 'DINOSAUR-ROUTER DELETE api/dinosaurs responding with 204 code for successful delete');
      return response.sendStatus(204);
    })
    .catch(next);
});

export default dinosaurRouter;
