import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createEmbeddings } from './embeddings.js';
dotenv.config();

// const openai = new OpenAI();

// const completion = await openai.chat.completions.create({
//   messages: [{ role: "user", content: "Cats hate what animal?" }],
//   model: "gpt-3.5-turbo",
// });

// console.log(completion.choices[0].message);

await createEmbeddings();
