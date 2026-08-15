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

Temporary conversations retain only the latest 20 text turns and expire after
60 minutes of inactivity. They are not displayed as history, and recorded or
synthesized audio is never stored. The cultural-tip dataset is not connected
yet.

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
```

`Backend/.env` and Google credential JSON files are ignored by Git.

The API runs at `http://127.0.0.1:8000`. Its interactive documentation is at
`http://127.0.0.1:8000/docs`.

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
