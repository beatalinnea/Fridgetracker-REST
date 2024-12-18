/**
 * Module for the UserController
 *
 * @author Beata Eriksson
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import { User } from '../models/user.js'

/**
 * Encapsulates a controller.
 */
export class UserController {
  /**
   * Authenticates a user. If valid login will return a token.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async login (req, res, next) {
    try {
      const user = await User.authenticate(req.body.username, req.body.password)

      const payload = {
        sub: user.username,
        given_name: user.firstName,
        family_name: user.lastName,
        email: user.email,
        id: user.id,
        x_permission_level: user.permissionLevel
      }

      // Create the access token.
      // Not creating a refresh token
      const accessToken = jwt.sign(payload, process.env.PRIVATE_KEY, {
        algorithm: 'RS256',
        expiresIn: process.env.ACCESS_TOKEN_LIFE
      })

      res
        .status(200)
        .json({
          token: accessToken,
          username: user.username,
          links: [
            { rel: 'GET your fridges', href: '/api/v1/fridge' },
            { rel: 'POST add new fridge', href: '/api/v1/fridge' }
          ]
        })
    } catch (error) {
      // Authentication failed.
      const err = createError(401)
      err.cause = error

      next(err)
    }
  }

  /**
   * Registers a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async register (req, res, next) {
    try {
      // default permission level is 1, can change if needed.
      const user = new User({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        permissionLevel: 1
      })

      await user.save()

      res
        .status(201)
        .json({
          id: user.id,
          links: [
            { rel: 'POST log in', href: '/api/v1/user/login' }
          ]
        })
    } catch (error) {
      let err = error

      if (err.code === 11000) {
        // Duplicated keys.
        err = createError(409, 'Email or username busy')
        err.cause = error
      } else if (error.name === 'ValidationError') {
        // Validation error(s).
        err = createError(400, 'Must provide username, password, firstName, lastName and email')
        err.cause = error
      }

      next(err)
    }
  }
}
