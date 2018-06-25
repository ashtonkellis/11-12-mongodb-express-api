'use strict';

import { Router } from 'express';
import bodyParser from 'body-parser';
import Dinosaur from '../model/dinosaur';
import logger from '../lib/logger';

const jsonParser = bodyParser.json();
const dinosaurRouter = new Router();

dinosaurRouter.post('/api/dinosaurs', jsonParser, (request, response) => {
  logger.log(logger.INFO, 'NOTE-ROUTER POST to /api/dinosaurs - processing a request');
  if (!request.body.title) {
    logger.log(logger.INFO, 'NOTE-ROUTER POST /api/dinosaurs: Responding with 400 error for no title');
    return response.sendStatus(400);
  }

  Dinosaur.init()
    .then(() => {
      return new Dinosaur(request.body).save();
    })
    .then((newDinosaur) => {
      logger.log(logger.INFO, `NOTE-ROUTER POST:  a new dinosaur was saved: ${JSON.stringify(newDinosaur)}`);
      return response.json(newDinosaur);
    })
    .catch((err) => {
      // we will hit here if we have some misc. mongodb error or parsing id error
      if (err.message.toLowerCase().includes('cast to objectid failed')) {
        logger.log(logger.ERROR, `NOTE-ROUTER PUT: responding with 404 status code to mongdb error, objectId ${request.params.id} failed, ${err.message}`);
        return response.sendStatus(404);
      }

      // a required property was not included, i.e. in this case, "title"
      if (err.message.toLowerCase().includes('validation failed')) {
        logger.log(logger.ERROR, `NOTE-ROUTER PUT: responding with 400 status code for bad request ${err.message}`);
        return response.sendStatus(400);
      }
      // we passed in a title that already exists on a resource in the db because in our Dinosaur model, we set title to be "unique"
      if (err.message.toLowerCase().includes('duplicate key')) {
        logger.log(logger.ERROR, `NOTE-ROUTER PUT: responding with 409 status code for dup key ${err.message}`);
        return response.sendStatus(409);
      }

      // if we hit here, something else not accounted for occurred
      logger.log(logger.ERROR, `NOTE-ROUTER GET: 500 status code for unaccounted error ${JSON.stringify(err)}`);
      return response.sendStatus(500); // Internal Server Error
    });
  return undefined;
});

// you need this question mark after ":id" or else Express will skip to the catch-all in lib/server.js 
dinosaurRouter.get('/api/dinosaurs/:id?', (request, response) => {
  logger.log(logger.INFO, 'NOTE-ROUTER GET /api/dinosaurs/:id = processing a request');

  // TODO:
  // if (!request.params.id) do logic here to return an array of all resources, else do the logic below

  return Dinosaur.findOne({ _id: request.params.id })
    .then((dinosaur) => {
      if (!dinosaur) {
        logger.log(logger.INFO, 'NOTE-ROUTER GET /api/dinosaurs/:id: responding with 404 status code for no dinosaur found');
        return response.sendStatus(404);
      }
      logger.log(logger.INFO, 'NOTE-ROUTER GET /api/dinosaurs/:id: responding with 200 status code for successful get');
      return response.json(dinosaur);
    })
    .catch((err) => {
      // we will hit here if we have a mongodb error or parsing id error
      if (err.message.toLowerCase().includes('cast to objectid failed')) {
        logger.log(logger.ERROR, `NOTE-ROUTER PUT: responding with 404 status code to mongdb error, objectId ${request.params.id} failed`);
        return response.sendStatus(404);
      }

      // if we hit here, something else not accounted for occurred
      logger.log(logger.ERROR, `NOTE-ROUTER GET: 500 status code for unaccounted error ${JSON.stringify(err)}`);
      return response.sendStatus(500);
    });
});

dinosaurRouter.put('/api/dinosaurs/:id?', jsonParser, (request, response) => {
  if (!request.params.id) {
    logger.log(logger.INFO, 'NOTE-ROUTER PUT /api/dinosaurs: Responding with a 400 error code for no id passed in');
    return response.sendStatus(400);
  }

  // we need to pass these options into "findByIdAndUpdate" so we can actually return the newly modified document in the promise per "new", and "runValidators" ensures that the original validators we set on the model
  const options = {
    new: true,
    runValidators: true,
  };

  Dinosaur.init()
    .then(() => {
      return Dinosaur.findByIdAndUpdate(request.params.id, request.body, options);
    })
    .then((updatedDinosaur) => {
      logger.log(logger.INFO, `NOTE-ROUTER PUT - responding with a 200 status code for successful updated dinosaur: ${JSON.stringify(updatedDinosaur)}`);
      return response.json(updatedDinosaur);
    })
    .catch((err) => {
      // we will hit here if we have some misc. mongodb error or parsing id error
      if (err.message.toLowerCase().includes('cast to objectid failed')) {
        logger.log(logger.ERROR, `NOTE-ROUTER PUT: responding with 404 status code to mongdb error, objectId ${request.params.id} failed, ${err.message}`);
        return response.sendStatus(404);
      }

      // a required property was not included, i.e. in this case, "title"
      if (err.message.toLowerCase().includes('validation failed')) {
        logger.log(logger.ERROR, `NOTE-ROUTER PUT: responding with 400 status code for bad request ${err.message}`);
        return response.sendStatus(400);
      }
      // we passed in a title that already exists on a resource in the db because in our Dinosaur model, we set title to be "unique"
      if (err.message.toLowerCase().includes('duplicate key')) {
        logger.log(logger.ERROR, `NOTE-ROUTER PUT: responding with 409 status code for dup key ${err.message}`);
        return response.sendStatus(409);
      }

      // if we hit here, something else not accounted for occurred
      logger.log(logger.ERROR, `NOTE-ROUTER GET: 500 status code for unaccounted error ${JSON.stringify(err)}`);
      return response.sendStatus(500);
    });
  return undefined;
});

export default dinosaurRouter;
