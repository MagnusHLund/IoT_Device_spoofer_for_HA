import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { deviceRouter } from './routes/devices.js'
import { entityRouter } from './routes/entities.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())

// Serve React build
app.use(express.static(path.join(__dirname, '../frontend')))

// API routes
app.use('/api/devices', deviceRouter)
app.use('/api/entities', entityRouter)

// Ingress fallback
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'))
})

app.listen(8080, () => console.log('Backend running on port 8080'))
