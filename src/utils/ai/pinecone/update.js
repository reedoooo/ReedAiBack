// update.js

const updatePinecone = async (pinecone, indexName, docs, embeddings) => {
  console.log('Updating Pinecone index...');
  const index = pinecone.Index(indexName);

  const batchSize = 100;
  let batch = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const embedding = await embeddings.embedQuery(doc.content);

    const vector = {
      id: `doc_${i}`,
      values: embedding,
      metadata: {
        content: doc.content,
        tokens: doc.tokens,
      },
    };

    batch.push(vector);

    if (batch.length === batchSize || i === docs.length - 1) {
      await index.upsert({
        upsertRequest: {
          vectors: batch,
        },
      });
      console.log(`Upserted batch of ${batch.length} vectors`);
      batch = [];
    }
  }

  console.log(`Pinecone index updated with ${docs.length} vectors`);
};

module.exports = { updatePinecone };
