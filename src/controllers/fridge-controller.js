/**
 * Module for fridge controller.
 *
 * @author Beata Eriksson
 * @version 1.0.0
 */

import createError from 'http-errors'
import { Fridge } from '../models/fridge.js'
import { Product } from '../models/product.js'
import { WebhookService } from '../services/webhook.js'

/**
 * Encapsulates a controller.
 */
export class FridgeController {
  /**
   * Sends a JSON response containing all existing fridges details.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async findAll (req, res, next) {
    try {
      const fridges = await Fridge.find({ ownerId: req.user.id })
        .populate('products', 'name expirationDate')
        .select('-webhookUrl -webhookSecret -ownerId')

      if (!fridges) {
        next(createError(404, 'No fridges found'))
        return
      }

      // Construct HATEOAS links for each fridge
      const fridgesWithLinks = fridges.map(fridge => {
        const fridgeWithLinks = fridge.toJSON() // Convert Mongoose document to JSON object

        // Add self link
        fridgeWithLinks.links = [
          { rel: 'POST add new fridge', href: '/api/v1/fridge' }
        ]

        return fridgeWithLinks
      })

      res.json(fridgesWithLinks)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends a JSON response containing a certain fridge details by id.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async findById (req, res, next) {
    try {
      const fridge = await Fridge.findById(`${req.params.id}`)
        .populate('products', 'name expirationDate')
        .select('-webhookUrl -webhookSecret -ownerId')

      if (!fridge) {
        next(createError(404))
        return
      }

      const fridgeWithLinks = fridge.toJSON() // Convert Mongoose document to JSON object
      fridgeWithLinks.links = [
        { rel: 'POST add product to fridge', href: `/api/v1/fridge/${fridge._id}/product` },
        { rel: 'PUT fully edit fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'PATCH partially edit fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'DELETE fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'POST register webhook for this fridge', href: `/api/v1/fridge/${fridge._id}/webhook` }
      ]

      res.json(fridgeWithLinks)
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
   * Creates a new fridge.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async create (req, res, next) {
    try {
      // will save location and/or description if present, not required
      if (!req.body.name) {
        next(createError(400, 'Bad request: Missing name for fridge.'))
        return
      }

      const existingFridge = await Fridge.findOne({ name: req.body.name })
      if (existingFridge) {
        next(createError(409, 'Fridge with this name already exists.'))
        return
      }

      const fridge = new Fridge({
        location: req.body.location,
        name: req.body.name,
        ownerId: req.user.id
      })

      await fridge.save()

      const fridgeWithLinks = fridge.toJSON() // Convert Mongoose document to JSON object
      fridgeWithLinks.links = [
        { rel: 'GET all fridges', href: '/api/v1/fridge' },
        { rel: 'GET this fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'POST add product to fridge', href: `/api/v1/fridge/${fridge._id}/product` },
        { rel: 'PUT fully edit fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'PATCH partially edit fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'DELETE fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'POST register webhook for this fridge', href: `/api/v1/fridge/${fridge._id}/webhook` }
      ]

      res
        .status(201)
        .json(fridgeWithLinks)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Edits the specified fridge. Replaces all but will remain under same ID.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async putEdit (req, res, next) {
    try {
      const fridge = await Fridge.findById(req.params.id)

      if (!fridge) {
        next(createError(404))
        return
      }

      if (!req.body.name) {
        next(createError(400, 'Bad request: Missing new name.'))
        return
      } else if (fridge.location && !req.body.location) {
        next(createError(400, 'Bad request: Missing new location.'))
        return
      } else if (fridge.temperature && !req.body.temperature) {
        next(createError(400, 'Bad request: Missing new temperature.'))
        return
      }

      if (req.body.name) {
        fridge.name = req.body.name
      }
      if (req.body.location) {
        fridge.location = req.body.location
      }
      if (req.body.temperature) {
        fridge.temperature = req.body.temperature
      }
      await fridge.save()

      const fridgeWithLinks = fridge.toJSON() // Convert Mongoose document to JSON object
      fridgeWithLinks.links = [
        { rel: 'POST add product to fridge', href: `/api/v1/fridge/${fridge._id}/product` },
        { rel: 'PUT fully edit fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'PATCH partially edit fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'DELETE fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'POST register webhook for this fridge', href: `/api/v1/fridge/${fridge._id}/webhook` }
      ]

      res.json(fridgeWithLinks)
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
   * Partially edits the specified fridge.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async patchEdit (req, res, next) {
    try {
      const fridge = await Fridge.findById(req.params.id)

      if (!fridge) {
        next(createError(404))
        return
      }

      // If not valid request
      if (!req.body.name && !req.body.location && !req.body.temperature) {
        next(createError(400, 'Bad request: No changes made'))
        return
      }

      if (req.body.name) {
        fridge.name = req.body.name
      }
      if (req.body.location) {
        fridge.location = req.body.location
      }
      if (req.body.temperature) {
        fridge.temperature = req.body.temperature
      }
      await fridge.save()

      const fridgeWithLinks = fridge.toJSON() // Convert Mongoose document to JSON object
      fridgeWithLinks.links = [
        { rel: 'POST add product to fridge', href: `/api/v1/fridge/${fridge._id}/product` },
        { rel: 'PUT fully edit fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'PATCH partially edit fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'DELETE fridge', href: `/api/v1/fridge/${fridge._id}` },
        { rel: 'POST register webhook for this fridge', href: `/api/v1/fridge/${fridge._id}/webhook` }
      ]

      res.json(fridgeWithLinks)
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
   * Deletes the specified fridge.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async delete (req, res, next) {
    try {
      const fridge = await Fridge.findById({ _id: `${req.params.id}` })
      if (!fridge) {
        next(createError(404))
        return
      }

      for (const productId of fridge.products) {
        await Product.deleteOne({ _id: `${productId}` })
      }
      await fridge.deleteOne({ _id: `${req.params.id}` })

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

  /**
   * Checks fridges for expired products.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async cleanOut (req, res, next) {
    try {
      const currentDate = new Date()

      const webhookService = new WebhookService()
      const webhookFridges = await webhookService.checkFridges(currentDate)
      for (const fridge of webhookFridges) {
        const response = await fetch(`${fridge.webhookUrl}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fridgeId: fridge._id,
            expiredProducts: fridge.expiredProducts,
            secret: fridge.webhookSecret
          })
        })
        if (!response.ok) {
          const error = new Error(`Webhook error ${response.status}`)
          error.message = `Webhook error ${response.status}`
        }
      }
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Registers a webhook for the specified fridge.
   * The webhookUrl and webhookSecret must be provided in the request body.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async registerWebhook (req, res, next) {
    try {
      const fridge = await Fridge.findById(req.params.id)
      if (!fridge) {
        next(createError(404))
        return
      }

      if (!req.body.webhookUrl || !req.body.webhookSecret) {
        next(createError(400, 'Bad request: Missing webhookUrl or webhookSecret.'))
        return
      }
      fridge.webhookUrl = req.body.webhookUrl
      fridge.webhookSecret = req.body.webhookSecret
      await fridge.save()

      res
        .status(204)
        .end()
    } catch (error) {
      next(error)
    }
  }
}
