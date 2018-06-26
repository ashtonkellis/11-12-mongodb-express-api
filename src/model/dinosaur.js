'use strict';

import mongoose from 'mongoose';

const dinosaurSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  species: {
    type: String,
    // required: true,
  },
  eatsMeat: {
    type: Boolean,
  },
  eatsPlants: {
    type: Boolean,
  },
  createdOn: {
    type: Date,
    default: () => new Date(),
  },
});

const skipInit = process.env.NODE_ENV === 'development';
export default mongoose.model('dinosaurs', dinosaurSchema, 'dinosaurs', skipInit);
