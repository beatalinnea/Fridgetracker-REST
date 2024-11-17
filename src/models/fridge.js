/**
 * Mongoose model for fridge.
 *
 * @author Beata Eriksson
 * @version 1.0.0
 */

import mongoose from 'mongoose'

// Create a schema.
const schema = new mongoose.Schema({
  location: {
    type: String,
    required: false,
    maxLength: [256, 'Too long location...'],
    trim: true
  },
  name: {
    type: String,
    required: true,
    maxLength: [256, 'Too long description...'],
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  products: {
    type: [mongoose.Schema.Types.ObjectId],
    required: false,
    ref: 'Product'
  },
  temperature: {
    type: Number,
    required: false
  },
  webhookUrl: {
    type: String,
    required: false
  },
  webhookSecret: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  toJSON: {
    /**
     * Performs a transformation of the resulting object to remove sensitive information.
     *
     * @param {object} doc - The mongoose document which is being converted.
     * @param {object} ret - The plain object representation which has been converted.
     */
    transform: function (doc, ret) {
      delete ret._id
      delete ret.__v
    },
    virtuals: true // ensure virtual fields are serialized
  }
})

schema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Create a model using the schema.
export const Fridge = mongoose.model('Fridge', schema)
