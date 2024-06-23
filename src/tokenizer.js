import { encoding_for_model } from 'tiktoken';

export function tokenizeText(text) {
  let tokenizer;
  try {
    tokenizer = encoding_for_model('gpt-3.5-turbo');
    return tokenizer.encode(text);
  } finally {
    tokenizer.free();
  }
}
