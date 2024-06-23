-- https://github.com/pgvector/pgvector

create extension vector;

create table ai_chat_hello (
  id serial primary key,
  text text not null,
  embedding vector(1536) not null --text-embedding-ada-002 dimension
);