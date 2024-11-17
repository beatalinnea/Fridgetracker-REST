/**
 * Module for webhook service.
 *
 * @author Beata Eriksson
 * @version 1.0.0
 */

import { Fridge } from '../models/fridge.js'
import { Product } from '../models/product.js'

/** Encapsulates a webhook service. */
export class WebhookService {
  /**
   * Checks all fridges for expired products.
   *
   * @param {Date} date - The date to check against.
   * @returns {Promise<Fridge[]>} The fridges with expired products.
   */
  async checkFridges (date) {
    const webhookFridges = await Fridge.find({ webhookUrl: { $exists: true } })
    for (const fridge of webhookFridges) {
      fridge.expiredProducts = []
      if (fridge.products.length > 0) {
        for (const productId of fridge.products) {
          const product = await Product.findById(productId)
          if (product.expirationDate < date) {
            fridge.expiredProducts.push(product)
          }
        }
      }
    }
    return webhookFridges
  }
}
