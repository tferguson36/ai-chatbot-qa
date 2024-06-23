import OpenAI from 'openai';
import * as fs from 'fs/promises';
import dotenv from 'dotenv';
import { tokenizeText } from './tokenizer.js';
import { isEmbeddingsExist, saveEmbeddings } from './db/db.js';
dotenv.config();

const FILENAME = 'bdnf-article.txt';
const MAX_TOKENS = 500;
const openAi = new OpenAI();

export async function createEmbeddings() {
  if (await isEmbeddingsExist()) {
    console.log("Embeddings already exist for the test file. Delete them if you'd like to recalculate");
    return;
  }

  console.log('Reading article and creating embeddings');

  const textBuffer = await fs.readFile(FILENAME);

  // remove unnecessary whitespace which can complicate embedding process
  const text = textBuffer.toString('utf-8').replace('\n', ' ').replace(/\s+/g, ' ');

  const sections = text.split('<<section>>');

  const textChunks = sections.map((txt) => txt.trim() && chunkSection(txt.trim())).flat(1);

  console.log(`Embedding ${textChunks.length} text chunks`);

  const embeddings = await getEmbeddings(textChunks);
  console.log(`Received ${embeddings.length} embeddings`);

  const textChunkEmbeddings = textChunks.map((chunk, idx) => ({
    ...chunk,
    embedding: embeddings[idx],
  }));

  await saveEmbeddings(textChunkEmbeddings);
}

export async function getEmbeddings(textChunks) {
  const embeddingsResp = await openAi.embeddings.create({
    model: 'text-embedding-ada-002',
    input: textChunks instanceof Array ? textChunks.map((ch) => ch.text) : textChunks,
    encoding_format: 'float',
  });

  const embeddings = embeddingsResp.data?.map((data) => data.embedding);
  return embeddings;
}

/**
 * LLMs have a max token context which includes everything sent with the prompt and the answer it replies with.
 * i.e. As of now, gpt-3.5-turbo has a context window of 16,385 tokens
 *
 * We must keep this in mind and limit the size of the reference text we plan to send along with a given prompt.
 */
function chunkSection(section) {
  const data = [];

  const sectionTokens = tokenizeText(section);

  if (sectionTokens.length <= MAX_TOKENS) {
    data.push({
      numTokens: sectionTokens.length,
      text: section,
    });
  } else {
    console.log(`Section with ${sectionTokens.length} tokens is too large; splitting section`);

    const subSections = splitSectionIntoSmallerEmbeddings(section);

    for (const sub of subSections) {
      const subTokens = tokenizeText(sub);
      data.push({
        numTokens: subTokens.length,
        text: sub,
      });
    }
  }

  return data;
}

function splitSectionIntoSmallerEmbeddings(text) {
  const sentences = text.split(/[\.\?\!]+\s{1}/);

  const subSections = [];

  let chunk = [];
  let numTokens = 0;
  for (const sentence of sentences) {
    const tokenCount = tokenizeText(sentence)?.length;

    if (numTokens && numTokens + tokenCount > MAX_TOKENS) {
      // Create sub-section from chunk and reset chunk
      subSections.push(`${chunk.join('. ')}.`);
      chunk = [];
      numTokens = 0;
    }

    if (tokenCount > MAX_TOKENS) {
      // leave as is
      subSections.push(`${sentence}.`);
    } else {
      chunk.push(sentence);
      numTokens += tokenCount + 1; // account for punctuation removed during split
    }
  }

  if (chunk.length) {
    subSections.push(`${chunk.join('. ')}.`);
  }

  return subSections;
}
