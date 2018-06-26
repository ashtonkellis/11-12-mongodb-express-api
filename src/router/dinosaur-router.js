'use strict';

import { Router } from 'express';
import bodyParser from 'body-parser';
import Dinosaur from '../model/dinosaur';
import logger from '../lib/logger';

const jsonParser = bodyParser.json();
const dinosaurRouter = new Router();

dinosaurRouter.post('/api/dinosaurs', jsonParser, (request, response) => {
  logger.log(logger.INFO, 'DINOSAUR-ROUTER POST to /api/dinosaurs - processing a request');
  if (!request.body.name) {
    logger.log(logger.INFO, 'DINOSAUR-ROUTER POST /api/dinosaurs: Responding with 400 error for no name');
    return response.sendStatus(400);
  }

  Dinosaur.init()
    .then(() => {
      return new Dinosaur(request.body).save();
    })
    .then((newDinosaur) => {
      logger.log(logger.INFO, `DINOSAUR-ROUTER POST:  a new dinosaur was saved: ${JSON.stringify(newDinosaur)}`);
      return response.json(newDinosaur);
    })
    .catch((err) => {
      // we will hit here if we have some misc. mongodb error or parsing id error
      if (err.message.toLowerCase().includes('cast to objectid failed')) {
        logger.log(logger.ERROR, `DINOSAUR-ROUTER PUT: responding with 404 status code to mongdb error, objectId ${request.params.id} failed, ${err.message}`);
        return response.sendStatus(404);
      }

      // a required property was not included, i.e. in this case, "name"
      if (err.message.toLowerCase().includes('validation failed')) {
        logger.log(logger.ERROR, `DINOSAUR-ROUTER PUT: responding with 400 status code for bad request ${err.message}`);
        return response.sendStatus(400);
      }
      // we passed in a name that already exists on a resource in the db because in our Dinosaur model, we set name to be "unique"
      if (err.message.toLowerCase().includes('duplicate key')) {
        logger.log(logger.ERROR, `DINOSAUR-ROUTER PUT: responding with 409 status code for dup key ${err.message}`);
        return response.sendStatus(409);
      }

      // if we hit here, something else not accounted for occurred
      logger.log(logger.ERROR, `DINOSAUR-ROUTER GET: 500 status code for unaccounted error ${JSON.stringify(err)}`);
      return response.sendStatus(500); // Internal Server Error
    });
  return undefined;
});

// you need this question mark after ":id" or else Express will skip to the catch-all in lib/server.js 
dinosaurRouter.get('/api/dinosaurs/:id?', (request, response) => {
  logger.log(logger.INFO, 'DINOSAUR-ROUTER GET /api/dinosaurs/:id = processing a request');

  if (!request.params.id) {
    return Dinosaur.find({})
      .then((dinosaurs) => {
        logger.log(logger.INFO, 'DINOSAUR-ROUTER GET /api/dinosaurs responding with 200 code for successful get');
        return response.json(dinosaurs);
      })
      .catch((err) => {
        // we will hit here if we have a mongodb error or parsing id error
        if (err.message.toLowerCase().includes('cast to objectid failed')) {
          logger.log(logger.ERROR, `DINOSAUR-ROUTER PUT: responding with 404 status code to mongdb error, objectId ${request.params.id} failed`);
          return response.sendStatus(404);
        }
  
        // if we hit here, something else not accounted for occurred
        logger.log(logger.ERROR, `DINOSAUR-ROUTER GET: 500 status code for unaccounted error ${JSON.stringify(err)}`);
        return response.sendStatus(500);
      });
  }

  return Dinosaur.findOne({ _id: request.params.id })
    .then((dinosaur) => {
      if (!dinosaur) {
        logger.log(logger.INFO, 'DINOSAUR-ROUTER GET /api/dinosaurs/:id: responding with 404 status code for no dinosaur found');
        return response.sendStatus(404);
      }
      logger.log(logger.INFO, 'DINOSAUR-ROUTER GET /api/dinosaurs/:id: responding with 200 status code for successful get');
      return response.json(dinosaur);
    })
    .catch((err) => {
      // we will hit here if we have a mongodb error or parsing id error
      if (err.message.toLowerCase().includes('cast to objectid failed')) {
        logger.log(logger.ERROR, `DINOSAUR-ROUTER PUT: responding with 404 status code to mongdb error, objectId ${request.params.id} failed`);
        return response.sendStatus(404);
      }

      // if we hit here, something else not accounted for occurred
      logger.log(logger.ERROR, `DINOSAUR-ROUTER GET: 500 status code for unaccounted error ${JSON.stringify(err)}`);
      return response.sendStatus(500);
    });
});

dinosaurRouter.put('/api/dinosaurs/:id?', jsonParser, (request, response) => {
  if (!request.params.id) {
    logger.log(logger.INFO, 'DINOSAUR-ROUTER PUT /api/dinosaurs: Responding with a 400 error code for no id passed in');
    return response.sendStatus(400);
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
    .catch((err) => {
      // we will hit here if we have some misc. mongodb error or parsing id error
      if (err.message.toLowerCase().includes('cast to objectid failed')) {
        logger.log(logger.ERROR, `DINOSAUR-ROUTER PUT: responding with 404 status code to mongdb error, objectId ${request.params.id} failed, ${err.message}`);
        return response.sendStatus(404);
      }

      // a required property was not included, i.e. in this case, "name"
      if (err.message.toLowerCase().includes('validation failed')) {
        logger.log(logger.ERROR, `DINOSAUR-ROUTER PUT: responding with 400 status code for bad request ${err.message}`);
        return response.sendStatus(400);
      }
      // we passed in a name that already exists on a resource in the db because in our Dinosaur model, we set name to be "unique"
      if (err.message.toLowerCase().includes('duplicate key')) {
        logger.log(logger.ERROR, `DINOSAUR-ROUTER PUT: responding with 409 status code for dup key ${err.message}`);
        return response.sendStatus(409);
      }

      // if we hit here, something else not accounted for occurred
      logger.log(logger.ERROR, `DINOSAUR-ROUTER GET: 500 status code for unaccounted error ${JSON.stringify(err)}`);
      return response.sendStatus(500);
    });
  return undefined;
});

dinosaurRouter.delete('/api/dinosaurs/:id?', (request, response) => {
  logger.log(logger.INFO, 'DINOSAUR-ROUTER DELETE /api/dinosaurs/:id = processing a request');

  if (!request.params.id) {
    return response.sendStatus(404);
  }

  return Dinosaur.deleteOne({ _id: request.params.id })
    .then((data) => {
      if (!data.n) {
        logger.log(logger.INFO, 'DINOSAUR-ROUTER DELETE /api/dinosaurs/:id responding with 404 status code for no dinosaur found');
        return response.sendStatus(400);
      }

      logger.log(logger.INFO, 'DINOSAUR-ROUTER DELETE api/dinosaurs responding with 204 code for successful delete');
      return response.sendStatus(204);
    })
    .catch((err) => {
      // we will hit here if we have a mongodb error or parsing id error
      if (err.message.toLowerCase().includes('cast to objectid failed')) {
        logger.log(logger.ERROR, `DINOSAUR-ROUTER DELETE: responding with 404 status code to mongdb error, objectId ${request.params.id} failed`);
        return response.sendStatus(404);
      }

      // if we hit here, something else not accounted for occurred
      logger.log(logger.ERROR, `DINOSAUR-ROUTER DELETE: 500 status code for unaccounted error ${JSON.stringify(err)}`);
      return response.sendStatus(500);
    });
});

export default dinosaurRouter;
