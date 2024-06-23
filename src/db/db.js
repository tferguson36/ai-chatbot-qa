import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  ssl: true,
});

export async function saveEmbeddings(textChunkEmbeddings) {
  for (const data of textChunkEmbeddings) {
    await pool.query('insert into ai_chat_hello (text, embedding) values ($1, $2)', [data.text, JSON.stringify(data.embedding)]);
  }
  console.log('Successfully saved embeddings to db');
}

export async function getSimilarEmbeddings(embedding, count = 5) {
  // Uses cosine distance calculation to find most similar embeddings
  // https://github.com/pgvector/pgvector?tab=readme-ov-file#querying
  const results = await pool.query('select * from ai_chat_hello order by embedding <=> $1 limit $2', [JSON.stringify(embedding), count]);
  return results.rows;
}

export async function isEmbeddingsExist() {
  const results = await pool.query('select * from ai_chat_hello');
  return results.rowCount;
}
