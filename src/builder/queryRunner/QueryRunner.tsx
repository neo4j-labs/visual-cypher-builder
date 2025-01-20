// QueryRunner.tsx
import React, { useState } from 'react';
import { Typography } from '@neo4j-ndl/react';
import ResultsVisualization from './ResultsVisualization';

export default function QueryRunner() {
  const [nodes] = useState([
    { id: '1', labels: ['Person'], documents: ['doc1.pdf'], chunkConnections: 5 },
    { id: '2', labels: ['Organization'], documents: ['doc2.pdf'], chunkConnections: 3 },
    { id: '3', labels: ['Place'], documents: ['doc3.pdf'], chunkConnections: 7 },
  ]);

  return (
    <div>
      <Typography variant='h4'>Results</Typography>
      <ResultsVisualization data={nodes} />
    </div>
  );
}