import { Router } from 'express'
import { getAvailableEntityTypes } from '../factories/entityFactory.js'

export const entityRouter = Router()

entityRouter.get('/types', (req, res) => {
  res.json(getAvailableEntityTypes())
})
