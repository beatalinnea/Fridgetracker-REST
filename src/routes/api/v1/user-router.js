/* eslint-disable jsdoc/check-indentation */
/* eslint-disable jsdoc/check-tag-names */
/**
 * User routes.
 *
 * @author Beata Eriksson
 * @version 1.0.0
 */

import express from 'express'
import { UserController } from '../../../controllers/user-controller.js'

export const router = express.Router()

const controller = new UserController()

/**
 * @swagger
 * /user/login:
 *   post:
 *     tags:
 *       - user
 *     description: log in user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: username of registered user
 *         in: body
 *         required: true
 *       - name: password
 *         description: password of registered user
 *         in: body
 *         required: true
 *     responses:
 *       200:
 *         description: Returns username and access token for further requests
 *       401:
 *         description: Authentication failed
 */
router.post('/login', (req, res, next) => controller.login(req, res, next))

/**
 * @swagger
 * /user/register:
 *   post:
 *     tags:
 *       - user
 *     description: register user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: wanted username for new user
 *         in: body
 *         required: true
 *       - name: password
 *         description: wanted password for new user
 *         in: body
 *         required: true
 *       - name: firstName
 *         description: first name of new user
 *         in: body
 *         required: true
 *       - name: lastName
 *         description: last name of new user
 *         in: body
 *         required: true
 *       - name: email
 *         description: email of new user
 *         in: body
 *         required: true
 *     responses:
 *       201:
 *         description: Created user, returns new user id
 *       409:
 *         description: Email or username busy
 *       400:
 *         description: Bad request, missing parameters
 */
router.post('/register', (req, res, next) => controller.register(req, res, next))
