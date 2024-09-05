// plugins/queue.js
import fp from 'fastify-plugin';
import Queue from 'bull';
import { processFile } from '../controllers/fileUploadController.js';

async function queuePlugin(fastify, options) {
  const fileQueue = new Queue('fileProcessing', process.env.REDIS_URL);

  fileQueue.process('processFile', processFile);

  fastify.decorate('queue', fileQueue);

  fastify.addHook('onClose', (instance, done) => {
    fileQueue.close().then(() => done());
  });
}

export default fp(queuePlugin);