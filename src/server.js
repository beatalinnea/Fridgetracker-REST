/**
 * The starting point of the api design assignment.
 *
 * @author Beata Eriksson <be222gr@student.lnu.se>
 * @version 1.0.0
 */

import express from 'express'
import helmet from 'helmet'
import logger from 'morgan'
import { router } from './routes/router.js'
import { connectDB } from './config/mongoose.js'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'

try {
  // Connect to MongoDB.
  await connectDB()

  // Creates an Express application.
  const app = express()

  // Use helmet, send policy to the browser.
  app.use(helmet())

  // Set up a morgan logger using the dev format for log entries.
  app.use(logger('dev'))

  // Parse requests of the content type application/json.
  app.use(express.json({ limit: '500kb' }))

  // swagger configuration
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'fridgetracker/api/v1',
        version: '1.0.0'
      }
    },
    apis: ['src/routes/api/v1/*.js'] // files containing annotations as above
  }

  const openapiSpecification = swaggerJSDoc(options)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification))

  // Register routes.
  app.use('/', router)

  // Error handler.
  app.use(function (err, req, res, next) {
    err.status = err.status || 500

    if (req.app.get('env') !== 'development') {
      return res
        .status(err.status)
        .json({
          status: err.status,
          message: err.message
        })
    }

    // Development only!
    // Only providing detailed error in development.
    return res
      .status(err.status)
      .json({
        status: err.status,
        message: err.message,
        cause: err.cause
          ? {
              status: err.cause.status,
              message: err.cause.message,
              stack: err.cause.stack
            }
          : null,
        stack: err.stack
      })
  })

  // Starts the HTTP server listening for connections.
  app.listen(process.env.PORT, () => {
    console.log(`Server running at port: ${process.env.PORT}`)
    console.log('Press Ctrl-C to terminate...')
  })
} catch (err) {
  console.error(err)
  process.exitCode = 1
}
