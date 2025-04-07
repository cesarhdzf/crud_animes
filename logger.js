const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info', // Nivel mínimo a registrar
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// En desarrollo, también muestra logs en la consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple()
  }));
}

module.exports = logger;