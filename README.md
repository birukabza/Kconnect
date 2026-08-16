# KConnect AI

KConnect translates spoken English and Kinyarwanda in both directions. The
Next.js frontend records speech and plays the translated audio returned by the
FastAPI backend.

## Current features

- Account registration and login
- Password hashing with bcrypt
- MongoDB user storage through PyMongo
- JWT bearer authentication
- Authenticated English/Kinyarwanda speech translation
- Google Speech-to-Text, Translation, and Text-to-Speech integration
- Hidden temporary conversation context in MongoDB
- Validated cultural knowledge dataset ingestion with Gemini embeddings
- Authenticated semantic search with MongoDB Atlas Vector Search

Temporary conversations retain only the latest 20 text turns and expire after
60 minutes of inactivity. They are not displayed as history, and recorded or
synthesized audio is never stored. Semantic knowledge search is available as a
backend foundation; it is not yet connected to generated conversation tips.

## Backend setup

MongoDB must be running locally, or `MONGODB_URI` must point to a reachable
MongoDB deployment.

```powershell
cd Backend
Copy-Item .env.example .env
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Set these values in `Backend/.env`:

```dotenv
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=kconnect
JWT_SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
TEMPORARY_CONVERSATION_TTL_MINUTES=60
TEMPORARY_CONVERSATION_MAX_TURNS=20
GOOGLE_APPLICATION_CREDENTIALS=C:/path/to/service_account.json
GEMINI_API_KEY=replace-with-your-gemini-api-key
GEMINI_MODEL=your-generation-model
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_EMBEDDING_DIMENSIONS=768
GEMINI_EMBEDDING_BATCH_SIZE=20
```

`Backend/.env` and Google credential JSON files are ignored by Git.

The API runs at `http://127.0.0.1:8000`. Its interactive documentation is at
`http://127.0.0.1:8000/docs`.

## Knowledge dataset

Run these commands from `Backend`:

```powershell
python -m app.scripts.validate_knowledge
python -m app.scripts.ingest_knowledge
python -m app.scripts.setup_vector_index --wait
python -m app.scripts.search_knowledge "Should I wear a helmet on a moto?"
```

Ingestion validates `data.json`, embeds new or changed records, and idempotently
upserts them into MongoDB. It also creates or updates the 768-dimension cosine
vector index. The explicit setup command waits until Atlas reports that the
index is queryable. Authenticated clients search it through MongoDB's native
`$vectorSearch` stage with `POST /api/knowledge/search` and a body such as:

```json
{
  "query": "Should I wear a helmet on a moto?",
  "top_k": 3
}
```

## Frontend setup

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`, create an account, select a translation direction,
and use the microphone.

## Tests

```powershell
cd Backend
python -m pytest -q

cd ..\frontend
npm run build
```
