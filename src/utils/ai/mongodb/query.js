const getVectorSearchResults = async (collection, vectorEmbedding, filterQuery) => {
  return collection
    .aggregate([
      {
        $vectorSearch: {
          index: 'default',
          vector: vectorEmbedding,
          path: 'embedding',
          filter: filterQuery,
          limit: 3,
          numCandidates: 30,
        },
      },
      {
        $addFields: {
          score: {
            $meta: 'vectorSearchScore',
          },
        },
      },
      { $match: { score: { $gte: 0.8 } } },
    ])
    .toArray();
};

module.exports = {
  getVectorSearchResults,
};
