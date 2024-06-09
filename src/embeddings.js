import * as fs from 'fs/promises';
import { encoding_for_model } from 'tiktoken';

const fileName = 'bdnf-article.txt';

/**
 * For this example embeddings will be stored in a CSV and comparisons done via standard algorithms locally.
 *
 * In production, embeddings are typically stored in a vector database like Pinecone (or simply Postgres with pgVector plugin),
 * and search/comparison algorithms are handled there.
 */

export async function createEmbeddings() {
  console.log('Reading article to csv');

  const textBuffer = await fs.readFile(fileName);

  // remove unnecessary whitespace which can complicate embedding process
  const text = textBuffer
    .toString('utf-8')
    .replace('\n', ' ')
    .replace(/\s+/g, ' ');

  const sections = text.split('<<section>>');

  let csvData = 'fileName,numTokens,text\n';
  sections
    .map((txt) => txt.trim())
    .filter((txt) => txt)
    .forEach((txt) => {
      const tokens = tokenizeText(txt);
      csvData += `${fileName},${tokens.length},${txt}\n`;
    });

  const csvFileName = fileName.split('.')[0] + '.csv';
  await fs.writeFile(csvFileName, csvData);
}

function tokenizeText(text) {
  let tokenizer;
  try {
    tokenizer = encoding_for_model('gpt-3.5-turbo');
    return tokenizer.encode(text);
  } finally {
    tokenizer.free();
  }
}
