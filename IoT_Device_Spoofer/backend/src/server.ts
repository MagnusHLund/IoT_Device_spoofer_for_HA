import express from 'express'
import path from 'path'
import yaml from 'js-yaml'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())

// Serve React build
app.use(express.static(path.join(__dirname, '../frontend')))

// YAML generation endpoint
app.post('/generate', (req, res) => {
  const config = req.body

  const yamlOutput = yaml.dump({
    sensor: {
      name: config.name,
      state_topic: config.topic,
      unit_of_measurement: config.unit,
    },
  })

  res.json({ yaml: yamlOutput })
})

// Ingress fallback
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
})

app.listen(8080, () => console.log('Backend running on port 8080'))
