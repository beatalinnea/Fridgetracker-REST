/* eslint-disable jsdoc/check-indentation */
/* eslint-disable jsdoc/check-tag-names */
/**
 * Product routes.
 *
 * @author Beata Eriksson
 * @version 1.0.0
 */

import express from 'express'
import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import { ProductController } from '../../../controllers/product-controller.js'

export const router = express.Router()

const controller = new ProductController()

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
 * /fridge/:id/product:
 *   get:
 *     tags:
 *       - product
 *     description: returns all products in fridge
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 */
router.get('/', authenticateJWT, (req, res, next) => controller.findAll(req, res, next))

/**
 * @swagger
 * /fridge/:id/product:
 *   post:
 *     tags:
 *       - product
 *     description: adds product to fridge
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *       - name: name
 *         description: name of product
 *         in: body
 *         required: true
 *       - name: expirationDate
 *         description: expiration date of product in format "YYYY-MM-DD"
 *         in: body
 *         required: true
 *       - name: category
 *         description: category of product
 *         in: body
 *         required: false
 *       - name: price
 *         description: price of product
 *         in: body
 *         required: false
 *     responses:
 *       201:
 *         description: Created product, returns new product id
 */
router.post('/', authenticateJWT, (req, res, next) => controller.create(req, res, next))

/**
 * @swagger
 * /fridge/:id/product/:id:
 *   get:
 *     tags:
 *       - product
 *     description: returns product by id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *     responses:
 *       200:
 *         description: Returns product
 */
router.get('/:id',
  authenticateJWT,
  (req, res, next) => hasPermission(req, res, next, PermissionLevels.READ),
  (req, res, next) => controller.findById(req, res, next)
)

// Should be permission level UPDATE
/**
 * @swagger
 * /fridge/:id/product/:id:
 *   put:
 *     tags:
 *       - product
 *     description: replaces all product information
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *       - name: name
 *         description: name of product
 *         in: body
 *         required: true
 *       - name: expirationDate
 *         description: expiration date of product in format "YYYY-MM-DD"
 *         in: body
 *         required: true
 *       - name: category
 *         description: category of product - needs to be updated if already existing
 *         in: body
 *         required: false
 *       - name: price
 *         description: price of product - needs to be updated if already existing
 *         in: body
 *         required: false
 *     responses:
 *       204:
 *         description: Product was updated
 */
router.put('/:id',
  authenticateJWT,
  (req, res, next) => hasPermission(req, res, next, PermissionLevels.READ),
  (req, res, next) => controller.putEdit(req, res, next)
)

// Should be permission level UPDATE
/**
 * @swagger
 * /fridge/:id/product/:id:
 *   patch:
 *     tags:
 *       - product
 *     description: partially edits product information
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *       - name: name
 *         description: name of product
 *         in: body
 *         required: false
 *       - name: expirationDate
 *         description: expiration date of product in format "YYYY-MM-DD"
 *         in: body
 *         required: false
 *       - name: category
 *         description: category of product
 *         in: body
 *         required: false
 *       - name: price
 *         description: price of product
 *         in: body
 *         required: false
 *     responses:
 *       204:
 *         description: Product was updated
 */
router.patch('/:id',
  authenticateJWT,
  (req, res, next) => hasPermission(req, res, next, PermissionLevels.READ),
  (req, res, next) => controller.patchEdit(req, res, next)
)

// Should be permission level DELETE
/**
 * @swagger
 * /fridge/:id/product/:id:
 *   delete:
 *     tags:
 *       - product
 *     description: deletes product from fridge
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization header containing "Bearer " followed by access token from login
 *         in: header
 *         required: true
 *     responses:
 *       204:
 *         description: No content, product deleted
 */
router.delete('/:id',
  authenticateJWT,
  (req, res, next) => hasPermission(req, res, next, PermissionLevels.READ),
  (req, res, next) => controller.delete(req, res, next)
)
