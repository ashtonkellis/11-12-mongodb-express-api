'use strict';

import faker from 'faker';
import superagent from 'superagent';
import Dinosaur from '../model/dinosaur';
import { startServer, stopServer } from '../lib/server';

const apiUrl = `http://localhost:${process.env.PORT}/api/dinosaurs`;

const createDinosaurMockPromise = () => {
  return new Dinosaur({
    name: faker.lorem.words(1),
    species: faker.lorem.words(1),
    eatsMeat: faker.random.boolean(),
    eatsPlants: faker.random.boolean(),
  }).save();
};

beforeAll(startServer);
afterAll(stopServer);

afterEach(() => Dinosaur.remove({}));

describe('POST requests to /api/dinosaurs', () => {
  test('POST 200 for successful creation of dinosaur', () => {
    const mockDinosaurToPost = {
      name: faker.lorem.words(1),
      species: faker.lorem.words(1),
      eatsMeat: faker.random.boolean(),
      eatsPlants: faker.random.boolean(),
    };
    return superagent.post(apiUrl)
      .send(mockDinosaurToPost)
      .then((response) => {
        expect(response.status).toEqual(200);
        expect(response.body.name).toEqual(mockDinosaurToPost.name);
        expect(response.body.species).toEqual(mockDinosaurToPost.species);
        expect(response.body.eatsMeat).toEqual(mockDinosaurToPost.eatsMeat);
        expect(response.body.eatsPlants).toEqual(mockDinosaurToPost.eatsPlants);
        expect(response.body._id).toBeTruthy();
        expect(response.body.createdOn).toBeTruthy();
      })
      .catch((err) => {
        throw err;
      });
  });

  test('POST 400 for not sending in a required TITLE property', () => {
    const mockDinosaurToPost = {
      species: faker.lorem.words(50),
    };
    return superagent.post(apiUrl)
      .send(mockDinosaurToPost)
      .then((response) => {
        throw response;
      })
      .catch((err) => {
        expect(err.status).toEqual(400);
      });
  });

  test('POST 409 for duplicate key', () => {
    return createDinosaurMockPromise()
      .then((newDinosaur) => {
        return superagent.post(apiUrl)
          .send({ name: newDinosaur.name })
          .then((response) => {
            throw response;
          })
          .catch((err) => {
            expect(err.status).toEqual(409);
          });
      })
      .catch((err) => {
        throw err;
      });
  });
});

describe('GET requests to /api/dinosaurs', () => {
  test('200 GET for succesful fetching of a dinosaur', () => {
    let mockDinosaurForGet;
    return createDinosaurMockPromise()
      .then((dinosaur) => {
        mockDinosaurForGet = dinosaur;
        return superagent.get(`${apiUrl}/${mockDinosaurForGet._id}`);
      })
      .then((response) => {
        expect(response.status).toEqual(200);
        expect(response.body.name).toEqual(mockDinosaurForGet.name);
        expect(response.body.species).toEqual(mockDinosaurForGet.species);
        expect(response.body.eatsMeat).toEqual(mockDinosaurForGet.eatsMeat);
        expect(response.body.eatsPlants).toEqual(mockDinosaurForGet.eatsPlants);
      })
      .catch((err) => {
        throw err;
      });
  });
  // TODO: figure out why the previous dinosaurs are not being removed, and this is returning 4 instead of 3
  test('200 GET for successful fetching of all dinosaurs', (done) => {
    let dinosaurs;
    Promise.all([
      createDinosaurMockPromise(),
      createDinosaurMockPromise(),
      createDinosaurMockPromise(),
    ])
      .then((results) => {
        dinosaurs = results;
        return superagent.get(`${apiUrl}`)
          .then((response) => {
            expect(response.body).toHaveLength(dinosaurs.length);
            done();
          })
          .catch((err) => {
            throw err;
          });
      })
      .catch((err) => {
        throw err;
      });
  });


  test('404 GET: no dinosaur with this id', () => {
    return superagent.get(`${apiUrl}/THISISABADID`)
      .then((response) => {
        throw response;
      })
      .catch((err) => {
        expect(err.status).toEqual(404);
      });
  });
});

describe('PUT request to /api/dinosaurs', () => {
  test('200 PUT for successful update of a resource', () => {
    return createDinosaurMockPromise()
      .then((newDinosaur) => {
        return superagent.put(`${apiUrl}/${newDinosaur._id}`)
          .send({
            name: 'updated name',
            species: 'updated species',
            eatsMeat: true,
            eatsPlants: true,
          })
          .then((response) => {
            expect(response.status).toEqual(200);
            expect(response.body.name).toEqual('updated name');
            expect(response.body.species).toEqual('updated species');
            expect(response.body.eatsMeat).toEqual(true);
            expect(response.body.eatsPlants).toEqual(true);
            expect(response.body._id.toString()).toEqual(newDinosaur._id.toString());
          })
          .catch((err) => {
            throw err;
          });
      })
      .catch((err) => {
        throw err;
      });
  });
});

describe('DELETE requests to api/dinosaurs', () => {
  test('204 DELETE for successful deleting of dinosaur', () => {
    let mockDinosaurForDelete;
    return createDinosaurMockPromise()
      .then((dinosaur) => {
        mockDinosaurForDelete = dinosaur;
        return superagent.delete(`${apiUrl}/${mockDinosaurForDelete._id}`);
      })
      .then((response) => {
        expect(response.status).toEqual(204);
      })
      .catch();
  });

  test('400 DELETE: no dinosaur with this id', () => {
    return superagent.delete(`${apiUrl}/THISISABADID`)
      .then((response) => {
        throw response;
      })
      .catch((err) => {
        expect(err.status).toEqual(400);
      });
  });
});
