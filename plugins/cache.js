// plugins/cache.js
import fp from 'fastify-plugin';
import IORedis from 'ioredis';

async function cachePlugin(fastify, options) {
  const redis = new IORedis(process.env.REDIS_URL);

  fastify.decorate('cache', {
    async get(key) {
      return redis.get(key);
    },
    async set(key, value, ttl) {
      return redis.set(key, value, 'EX', ttl);
    },
    async del(key) {
      return redis.del(key);
    },
  });

  fastify.addHook('onClose', (instance, done) => {
    redis.disconnect();
    done();
  });
}

export default fp(cachePlugin);
