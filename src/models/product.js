/**
 * Mongoose model for products.
 *
 * @author Beata Eriksson
 * @version 1.0.0
 */

import mongoose from 'mongoose'

// Create a schema.
const schema = new mongoose.Schema({
  expirationDate: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  fridgeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Fridge'
  },
  category: {
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
export const Product = mongoose.model('Product', schema)
