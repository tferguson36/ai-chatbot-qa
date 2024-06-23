import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createEmbeddings, getEmbeddings } from './embeddings.js';
import { getSimilarEmbeddings, pool } from './db/db.js';
import { tokenizeText } from './tokenizer.js';
dotenv.config();

try {
  await createEmbeddings();

  await answerQuestion('What is the best temperature to bake a chicken at?');
  await answerQuestion('What is BDNF?');
  await answerQuestion('What are some of the benefits of high BDNF levels?');
  await answerQuestion('In a paragraph, explain how one might reduce their bdnf?');
  await answerQuestion('How old is Rhonda?');
} finally {
  await pool.end();
}

async function answerQuestion(question) {
  const questionEmbeddings = (await getEmbeddings(question))?.[0];

  const referenceEmbeddings = await getSimilarEmbeddings(questionEmbeddings, 5);
  console.log(
    'Context embedding ids:',
    referenceEmbeddings.map((embed) => embed.id)
  );

  const referenceText = referenceEmbeddings.map((embed) => embed.text);

  const context = referenceText.join('\n\n####\n\n');
  console.log('Context tokens:', tokenizeText(context).length);

  const openAi = new OpenAI();
  const completion = await openAi.chat.completions.create({
    messages: [
      { role: 'system', content: 'Answer the question based on the context below, and if the question can\'t be answered based on the context, say "I don\'t know"\n\n' },
      { role: 'user', content: `Context: ${context}\n\n---\n\nQuestion: ${question}\nAnswer:` },
    ],
    model: 'gpt-3.5-turbo',
  });

  console.log(`${question}\n\t${completion.choices[0].message.content}\n`);
}
