/**
 * Module for product controller.
 *
 * @author Beata Eriksson
 * @version 1.0.0
 */

import createError from 'http-errors'
import { Product } from '../models/product.js'
import { Fridge } from '../models/fridge.js'

/**
 * Encapsulates a controller.
 */
export class ProductController {
  /**
   * Sends a JSON response containing all existing products details.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async findAll (req, res, next) {
    try {
      const fridge = await Fridge.findById(req.fridgeId)
      if (!fridge) {
        next(createError(404, 'Fridge not existing'))
        return
      }
      const products = await Product.find({ fridgeId: req.fridgeId })

      if (products.length === 0) {
        res.json({
          message: 'No products found',
          links: [
            { rel: 'POST new product to fridge', href: `/api/v1/fridge/${req.fridgeId}/product` },
            { rel: 'GET fridge containing products', href: `/api/v1/fridge/${req.fridgeId}` }
          ]
        })
        return
      }

      // Construct HATEOAS links for each fridge
      const productsWithLinks = products.map(product => {
        const productWithLinks = product.toJSON() // Convert Mongoose document to JSON object

        // Add self link
        productWithLinks.links = [
          { rel: 'GET this product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
          { rel: 'PUT fully edit product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
          { rel: 'PATCH partially edit product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
          { rel: 'DELETE product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` }
        ]

        return productWithLinks
      })

      res.json({
        productsWithLinks,
        links: [
          { rel: 'POST new product to fridge', href: `/api/v1/fridge/${req.fridgeId}/product` },
          { rel: 'GET fridge containing products', href: `/api/v1/fridge/${req.fridgeId}` }
        ]
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends a JSON response containing a certain product details by id.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async findById (req, res, next) {
    try {
      const product = await Product.findById(`${req.params.id}`)

      if (!product) {
        next(createError(404))
        return
      }

      const productWithLinks = product.toJSON() // Convert Mongoose document to JSON object
      productWithLinks.links = [
        { rel: 'GET fridge containing this product', href: `/api/v1/fridge/${req.fridgeId}` },
        { rel: 'POST new product to fridge', href: `/api/v1/fridge/${req.fridgeId}/product` },
        { rel: 'PUT fully edit product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
        { rel: 'PATCH partially edit product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
        { rel: 'DELETE product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` }
      ]

      res.json(productWithLinks)
    } catch (error) {
      // If not valid ID
      if (error.kind === 'ObjectId') {
        next(createError(404))
      } else {
        next(error)
      }
    }
  }

  /**
   * Creates a new product.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async create (req, res, next) {
    try {
      if (!req.body.name) {
        next(createError(400, 'Bad request: Missing name'))
      }
      if (!req.body.expirationDate || isNaN(Date.parse(req.body.expirationDate))) {
        next(createError(400, 'Bad request: Missing expiration date or invalid date format. "YYYY-MM-DD" expected.'))
      }
      const date = new Date(req.body.expirationDate)

      // will save location and/or description if present, not required
      const product = new Product({
        // fridge id from params
        expirationDate: date,
        name: req.body.name,
        fridgeId: req.fridgeId,
        category: req.body.category,
        price: req.body.price
      })

      await product.save()

      // add product to fridge
      const fridge = await Fridge.findById(req.fridgeId)

      if (!fridge) {
        next(createError(404, 'Fridge not existing'))
        return
      }

      fridge.products.push(product)
      await fridge.save()

      const productWithLinks = product.toJSON() // Convert Mongoose document to JSON object
      productWithLinks.links = [
        { rel: 'GET fridge with added product', href: `/api/v1/fridge/${req.fridgeId}` },
        { rel: 'GET this product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
        { rel: 'POST another product to fridge', href: `/api/v1/fridge/${req.fridgeId}/product` },
        { rel: 'PUT fully edit product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
        { rel: 'PATCH partially edit product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
        { rel: 'DELETE product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` }
      ]

      res
        .status(201)
        .json(productWithLinks)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Edits the specified product. Replaces all but will remain under same ID.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async putEdit (req, res, next) {
    try {
      const product = await Product.findById(req.params.id)

      if (!product) {
        next(createError(404))
        return
      }

      // if all props not present in request, not valid PUT request.
      if (!req.body.expirationDate || !req.body.name) {
        next(createError(400, 'Bad request: Missing expiratinDate or name'))
        return
      } else if (product.price && !req.body.price) {
        next(createError(400, 'Bad request: New price must be provided.'))
        return
      } else if (product.category && !req.body.category) {
        next(createError(400, 'Bad request: New category must be provided.'))
        return
      }
      if (req.body.expirationDate) {
        product.expirationDate = req.body.expirationDate
      }
      if (req.body.name) {
        product.name = req.body.name
      }
      if (req.body.price) {
        product.price = req.body.price
      }
      if (req.body.category) {
        product.category = req.body.category
      }

      await product.save()

      const productWithLinks = product.toJSON() // Convert Mongoose document to JSON object
      productWithLinks.links = [
        { rel: 'GET fridge containing this product', href: `/api/v1/fridge/${req.fridgeId}` },
        { rel: 'POST new product to fridge', href: `/api/v1/fridge/${req.fridgeId}/product` },
        { rel: 'PUT fully edit product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
        { rel: 'PATCH partially edit product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
        { rel: 'DELETE product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` }
      ]

      res.json(productWithLinks)
    } catch (error) {
      // If not valid ID
      if (error.kind === 'ObjectId') {
        next(createError(404))
      } else {
        next(error)
      }
    }
  }

  /**
   * Partially edits the specified product.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async patchEdit (req, res, next) {
    try {
      const product = await Product.findById(req.params.id)

      if (!product) {
        next(createError(404))
        return
      }

      // If not valid request - no changes
      if (!req.body.expirationDate && !req.body.fridgeId && !req.body.name && !req.body.price && !req.body.category) {
        next(createError(400, 'Bad request: No changes made'))
        return
      }

      if (req.body.expirationDate) {
        product.expirationDate = req.body.expirationDate
      }
      if (req.body.name) {
        product.name = req.body.name
      }
      if (req.body.price) {
        product.price = req.body.price
      }
      if (req.body.category) {
        product.category = req.body.category
      }
      await product.save()

      const productWithLinks = product.toJSON() // Convert Mongoose document to JSON object
      productWithLinks.links = [
        { rel: 'GET fridge containing this product', href: `/api/v1/fridge/${req.fridgeId}` },
        { rel: 'POST new product to fridge', href: `/api/v1/fridge/${req.fridgeId}/product` },
        { rel: 'PUT fully edit product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
        { rel: 'PATCH partially edit product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` },
        { rel: 'DELETE product', href: `/api/v1/fridge/${req.fridgeId}/product/${product._id}` }
      ]

      res.json(productWithLinks)
    } catch (error) {
      // If not valid ID
      if (error.kind === 'ObjectId') {
        next(createError(404))
      } else {
        next(error)
      }
    }
  }

  /**
   * Deletes the specified product.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async delete (req, res, next) {
    try {
      // delete product from fridge

      const product = await Product.findById({ _id: `${req.params.id}` })
      if (!product) {
        next(createError(404, 'Product not existing'))
        return
      }

      const fridge = await Fridge.findById(req.fridgeId)
      if (!fridge) {
        next(createError(404, 'Fridge not existing'))
        return
      }

      const index = fridge.products.indexOf(product._id)
      if (index > -1) {
        fridge.products.splice(index, 1)
      }
      await fridge.save()

      await Product.deleteOne({ _id: `${req.params.id}` })

      res
        .status(204)
        .end()
    } catch (error) {
      // If not valid ID
      if (error.kind === 'ObjectId') {
        next(createError(404))
      } else {
        next(error)
      }
    }
  }
}
