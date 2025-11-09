const DEFAULT_ORIGINS = ['http://localhost:3000'];

function buildCorsConfig() {
  const rawOrigins = process.env.CORS_ORIGINS;
  const originList = rawOrigins
    ? rawOrigins.split(',').map((origin) => origin.trim())
    : DEFAULT_ORIGINS;

  return {
    origin: originList,
    credentials: true,
  };
}

module.exports = {
  buildCorsConfig,
};
