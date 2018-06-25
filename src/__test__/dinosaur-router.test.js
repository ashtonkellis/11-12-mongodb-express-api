'use strict';

import faker from 'faker';
import superagent from 'superagent';
import Dinosaur from '../model/dinosaur';
import { startServer, stopServer } from '../lib/server';

const apiUrl = `http://localhost:${process.env.PORT}/api/dinosaurs`;

// this will be a helper function mock out resources to create test items that will actually be in the Mongo database

const createDinosaurMockPromise = () => {
  return new Dinosaur({
    title: faker.lorem.words(3),
    content: faker.lorem.words(20),
  }).save();
  // .save is a built-in method from mongoose to save/post 
  // a new resource to our actual Mongo database and it returns a promise
};

beforeAll(startServer);
afterAll(stopServer);

// ".remove" is a built-in mongoose schema method 
// that we use to clean up our test database entirely 
// of all the mocks we created so we can start fresh with every test block
afterEach(() => Dinosaur.remove({}));

describe('POST requests to /api/dinosaurs', () => {
  test('POST 200 for successful creation of dinosaur', () => {
    const mockDinosaurToPost = {
      title: faker.lorem.words(3),
      content: faker.lorem.words(20),
    };
    return superagent.post(apiUrl)
      .send(mockDinosaurToPost)
      .then((response) => {
        expect(response.status).toEqual(200);
        expect(response.body.title).toEqual(mockDinosaurToPost.title);
        expect(response.body.content).toEqual(mockDinosaurToPost.content);
        expect(response.body._id).toBeTruthy();
        expect(response.body.createdOn).toBeTruthy();
      })
      .catch((err) => {
        throw err;
      });
  });

  test('POST 400 for not sending in a required TITLE property', () => {
    const mockDinosaurToPost = {
      content: faker.lorem.words(50),
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
          .send({ title: newDinosaur.title })
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
        // I can return this to the next then block because superagent requests are also promisfied
        return superagent.get(`${apiUrl}/${mockDinosaurForGet._id}`);
      })
      .then((response) => {
        expect(response.status).toEqual(200);
        expect(response.body.title).toEqual(mockDinosaurForGet.title);
        expect(response.body.content).toEqual(mockDinosaurForGet.content);
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
          .send({ title: 'updated title', content: 'updated content' })
          .then((response) => {
            expect(response.status).toEqual(200);
            expect(response.body.title).toEqual('updated title');
            expect(response.body.content).toEqual('updated content');
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
