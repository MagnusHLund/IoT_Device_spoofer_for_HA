import express from 'express'
import path from 'path'
import yaml from 'js-yaml'

const app = express()
app.use(express.json())

// Serve React build
app.use(express.static('/app/frontend'))

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
  res.sendFile('/app/frontend/index.html')
})

app.listen(8080, () => console.log('Backend running on port 8080'))
