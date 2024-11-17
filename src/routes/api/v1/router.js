/* eslint-disable jsdoc/check-indentation */
/* eslint-disable jsdoc/check-tag-names */
/**
 * The routes.
 *
 * @author Beata Eriksson
 * @version 1.0.0
 */

import express from 'express'
import createError from 'http-errors'
import { router as fridgeRouter } from './fridge-router.js'
import { router as userRouter } from './user-router.js'
import { router as productRouter } from './product-router.js'

export const router = express.Router()

/**
 * @swagger
 * /:
 *   get:
 *     description: Returns a welcome message and a list of available endpoints.
 */
router.get('/', (req, res) => res.json({
  message: 'Welcome to version 1 of this RESTful API!',
  // TODO Edit these to match swagger documentation.
  endpoints: [
    { path: '/fridge', method: 'GET', description: 'List all images' },
    { path: '/fridge', method: 'POST', description: 'Create image' },
    { path: '/fridge/cleanout', method: 'GET', description: 'Releases webhook for expired items in fridges' },
    { path: '/fridge/{id}', method: 'GET', description: 'Get single image' },
    { path: '/fridge/{id}', method: 'PUT', description: 'Edit image' },
    { path: '/fridge/{id}', method: 'PATCH', description: 'Partially edit image' },
    { path: '/fridge/{id}', method: 'DELETE', description: 'Delete image' },
    { path: '/fridge/{id}/webhook', method: 'POST', description: 'Register webhook for expired items in particular fridge' },
    { path: '/fridge/{id}/product', method: 'GET', description: 'List all products in fridge' },
    { path: '/fridge/{id}/product', method: 'POST', description: 'Create product in fridge' },
    { path: '/fridge/{id}/product/{id}', method: 'GET', description: 'Get single product in fridge' },
    { path: '/fridge/{id}/product/{id}', method: 'PUT', description: 'Edit product in fridge' },
    { path: '/fridge/{id}/product/{id}', method: 'PATCH', description: 'Partially edit product in fridge' },
    { path: '/fridge/{id}/product/{id}', method: 'DELETE', description: 'Delete product in fridge' },
    { path: '/user/register', method: 'POST', description: 'Register a new user' },
    { path: '/user/login', method: 'POST', description: 'Log in and obtain an access token' }
  ]
}))

/**
 * Middleware to save fridge id to request object.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const saveFridge = (req, res, next) => {
  const fridgeId = req.params.id
  if (fridgeId) {
    req.fridgeId = fridgeId
    next()
  } else {
    next(createError(400, 'Fridge ID is missing'))
  }
}

router.use('/fridge', fridgeRouter)
router.use('/user', userRouter)
router.use('/fridge/:id/product', saveFridge, productRouter)
