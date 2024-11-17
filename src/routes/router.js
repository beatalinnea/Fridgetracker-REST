/**
 * @file Defines the main router.
 * @module router
 * @author Beata Eriksson <be222gr@student.lnu.se>
 */

// User-land modules.
import express from 'express'

// Application modules.
import createError from 'http-errors'
import { router as v1Router } from './api/v1/router.js'

export const router = express.Router()

router.use('/api/v1', v1Router)

// Catch 404 (ALWAYS keep this as the last route).
router.use('*', (req, res, next) => next(createError(404)))
