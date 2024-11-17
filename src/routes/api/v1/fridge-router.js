/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable jsdoc/check-indentation */
/**
 * Fridge routes.
 *
 * @author Beata Eriksson
 * @version 1.0.0
 */

import express from 'express'
import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import { FridgeController } from '../../../controllers/fridge-controller.js'

export const router = express.Router()

const controller = new FridgeController()

// -------
// HELPERS:
// -------

// Declaring variable, preparing for taking use of permissionlevels.
// NOTE: Did not find necessary information about how to give a certain user a certain permission level when being registered, therefore giving all users with reading permission a permission to do everything.
const PermissionLevels = Object.freeze({
  READ: 1,
  CREATE: 2,
  UPDATE: 4,
  DELETE: 8
})

/**
 * Authorize requests.
 *
 * If authorization is successful, that is the user is granted access
 * to the requested resource, the request is authorized to continue.
 * If authentication fails, a forbidden response will be sent.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @param {number} permissionLevel - ...
 */
const hasPermission = (req, res, next, permissionLevel) => {
  req.user?.permissionLevel & permissionLevel
    ? next()
    : next(createError(403))
}

/**
 * Authenticates requests.
 *
 * If authentication is successful, `req.user`is populated and the
 * request is authorized to continue.
 * If authentication fails, an unauthorized response will be sent.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const authenticateJWT = (req, res, next) => {
  try {
    const [authenticationScheme, token] = req.headers.authorization?.split(' ')

    if (authenticationScheme !== 'Bearer') {
      throw new Error('Invalid authentication scheme.')
    }

    const payload = jwt.verify(token, process.env.PUBLIC_KEY)

    req.user = {
      username: payload.sub,
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      id: payload.id,
      permissionLevel: payload.x_permission_level
    }

    next()
  } catch (err) {
    const error = createError(401)
    error.cause = err
    next(error)
  }
}

// -------
// ROUTES:
// -------

/**
 * @swagger
 * /fridge:
 *   get:
 *     tags:
 *       - fridge
 *     description: gets all users fridges
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *     responses:
 *       200:
 *         description: returns fridges with containing products
 */
router.get('/', authenticateJWT, (req, res, next) => controller.findAll(req, res, next))

/**
 * @swagger
 * /fridge/cleanout:
 *   get:
 *     tags:
 *       - fridge
 *     description: calls all fridges with registered webhooks with their expired products
 *     produces:
 *       - application/json
 */
router.get('/cleanout', (req, res, next) => controller.cleanOut(req, res, next))

/**
 * @swagger
 * /fridge:
 *   post:
 *     tags:
 *       - fridge
 *     description: adds a new fridge
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *       - name: name
 *         description: chosen name for fridge
 *         in: body
 *         required: true
 *       - name: location
 *         description: location description of fridge
 *         in: body
 *         required: false
 *     responses:
 *       201:
 *         description: Created fridge, returns new fridge
 */
router.post('/', authenticateJWT, (req, res, next) => controller.create(req, res, next))

/**
 * @swagger
 * /fridge/:id:
 *   get:
 *     tags:
 *       - fridge
 *     description: get fridge by id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *     responses:
 *       200:
 *         description: returns fridge with containing products
 */
router.get('/:id',
  authenticateJWT,
  (req, res, next) => hasPermission(req, res, next, PermissionLevels.READ),
  (req, res, next) => controller.findById(req, res, next)
)

// Should be permission level UPDATE
/**
 * @swagger
 * /fridge/:id:
 *   put:
 *     tags:
 *       - fridge
 *     description: replaces all fridge information
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *       - name: name
 *         description: name of fridge
 *         in: body
 *         required: true
 *       - name: location
 *         description: location description of fridge - required update if already existing
 *         in: body
 *         required: false
 *       - name: temperature
 *         description: temperature of fridge - required update if already existing
 *         in: body
 *         required: false
 *     responses:
 *       204:
 *         description: fridge information updated
 */
router.put('/:id',
  authenticateJWT,
  (req, res, next) => hasPermission(req, res, next, PermissionLevels.READ),
  (req, res, next) => controller.putEdit(req, res, next)
)

// Should be permission level UPDATE
/**
 * @swagger
 * /fridge/:id:
 *   patch:
 *     tags:
 *       - fridge
 *     description: partially updates fridge information
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *       - name: name
 *         description: name of fridge
 *         in: body
 *         required: false
 *       - name: location
 *         description: location description of fridge
 *         in: body
 *         required: false
 *       - name: temperature
 *         description: temperature of fridge
 *         in: body
 *         required: false
 *     responses:
 *       204:
 *         description: fridge information updated
 */
router.patch('/:id',
  authenticateJWT,
  (req, res, next) => hasPermission(req, res, next, PermissionLevels.READ),
  (req, res, next) => controller.patchEdit(req, res, next)
)

// Should be permission level DELETE
/**
 * @swagger
 * /fridge/:id:
 *   delete:
 *     tags:
 *       - fridge
 *     description: deletes fridge
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *     responses:
 *       204:
 *         description: No content, fridge and containing products deleted
 */
router.delete('/:id',
  authenticateJWT,
  (req, res, next) => hasPermission(req, res, next, PermissionLevels.READ),
  (req, res, next) => controller.delete(req, res, next)
)

// POST get webhook when fridge has expired products.
// Should be permission level DELETE
/**
 * @swagger
 * /fridge/:id/webhook:
 *   post:
 *     tags:
 *       - webhook
 *     description: registers webhook for expired items in particular fridge
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *       - name: webhookUrl
 *         description: url for webhook to be sent to
 *         in: body
 *         required: true
 *       - name: webhookSecret
 *         description: chosen secret for webhook, to be sent with webhook
 *         in: body
 *         required: true
 *     responses:
 *       204:
 *         description: No content, webhook was registered for specified fridge
 */
router.post('/:id/webhook', authenticateJWT,
  (req, res, next) => hasPermission(req, res, next, PermissionLevels.READ),
  (req, res, next) => controller.registerWebhook(req, res, next)
)
