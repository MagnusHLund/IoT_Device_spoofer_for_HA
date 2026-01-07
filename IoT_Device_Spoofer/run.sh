#!/usr/bin/with-contenv bashio
# ==============================================================================
# Start IoT Device Spoofer with Home Assistant addon configuration
# ==============================================================================

# Read addon options
export MQTT_HOST=$(bashio::config 'mqtt_host')
export MQTT_PORT=$(bashio::config 'mqtt_port')

if bashio::config.has_value 'mqtt_username'; then
    export MQTT_USERNAME=$(bashio::config 'mqtt_username')
fi

if bashio::config.has_value 'mqtt_password'; then
    export MQTT_PASSWORD=$(bashio::config 'mqtt_password')
fi

bashio::log.info "Starting IoT Device Spoofer..."
bashio::log.info "MQTT Broker: ${MQTT_HOST}:${MQTT_PORT}"

# Start the Node.js server
cd /app
exec node backend/server.js
