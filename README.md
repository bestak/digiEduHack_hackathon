# DigiEduHack 2025 — EduScale Engine  
**Challenge:** https://digieduhack.com/challenges/eduscale-engine-code-the-future-of-systemic-change

**Team:** It Worked Yesterday
- Bešťák, Vojtěch [@bestak](https://github.com/bestak)
- Novotný, Vojtěch [@vojtech-n](https://github.com/vojtech-n)
- Ridzoň, Daniel [@dede64](https://github.com/dede64)

---

## Overview

An AI-driven platform that processes, evaluates, and organizes diverse educational data.  
It integrates a local LLM stack, structured data entry, persistent file uploads, and a frontend designed for fast experimentation during the hackathon.

---

## Features

- Local, containerized AI processing (LLMs, embeddings, Whisper)
- File uploading via Uppy + tusd with persistent storage
- FastAPI backend with SQLite
- Realtime communication through WebSockets (chatbot)
- Simple static frontend for quick interaction and testing
- All services packaged via Docker Compose

---

## Tech Stack

### Core
- **Docker** (or Docker Desktop)  
- **Backend:** FastAPI  
- **Frontend:** HTML / CSS / JS  
- **WebSockets:** persistent chatbot connection  
- **Database:** SQLite  
- **File uploads:** Uppy + tusd  
- **Analytics / BI:** Metabase  
- **Vector store:** ChromaDB  

### AI Models
- `llama3.1:8b` — general LLM tasks, data manipulation  
- `embeddinggemma` — embeddings for RAG  
- `whisper` — speech-to-text  
- Embedded Ollama setup for fully local operation

---

## Data Privacy & Local Processing

- **Where is data processed?** Entirely on local hardware  
- **External AI services?** None  
- **Data leaving the EU?** No  

All components can run on a private server.  
(Using a single on-prem machine is possible, though not recommended for production-grade security.)

---

## Prerequisites

- Docker Engine 24+ / Docker Desktop 4.27+  
- Python backend requirements: `srcs/src/backend/requirements.txt`  
- Uppy: https://uppy.io/docs/quick-start/  
- tusd: https://tus.github.io/tusd/getting-started/installation/  
- Whisper: https://github.com/openai/whisper  
- Metabase (AGPL): https://www.metabase.com/  
- ChromaDB: https://www.trychroma.com/


## Getting Started
Clone the repository:
```bash
git clone git@github.com:bestak/digiEduHack_hackathon.git
cd digiEduHack_hackathon/srcs/
```

#### A. Use the embedded Ollama container (default, more self-contained):
```
docker compose --profile embedded-ollama up -d --build
```
This launches the ollama service defined in docker-compose.yml so everything stays inside Docker.

#### B. Use an existing host Ollama (saves resources, skips the container):
```
OLLAMA_HOST=http://host.docker.internal:11434 docker compose up -d --build
```
Because the Ollama service sits behind the embedded-ollama profile, it will only start if you explicitly request that profile.
(On Linux we add host.docker.internal via extra_hosts, so this hostname resolves to your host automatically.)

Whichever option you choose, make sure the Ollama instance has both the chat model and the embedding model pulled. By default the code expects:
```
ollama pull llama3.1:8b        # chat model (OLLAMA_MODEL)
ollama pull embeddinggemma     # embedding model (OLLAMA_EMBED_MODEL)
```

## Services
### **1. ollama (local LLM server, optional profile)**

* Exposes port **11434** → override via `OLLAMA_PORT=<port>`.
* Stores downloaded models in the named docker volume `ollama_data`.
* Auto-pulls `llama3.1:8b` and `embeddinggemma` on startup via `chat/docker-entrypoint.sh`.

### **2. backend (FastAPI + SQLite)**

* Exposes REST API on **[http://localhost:8000](http://localhost:8000)**
* Uses SQLite database stored in `./data/app.db`
* Provides endpoints:

  * `POST/GET/PUT/DELETE /regions`
  * `POST/GET/PUT/DELETE /schools`
  * `POST/GET /files`

### Auto-reload during development

The Docker image now launches Uvicorn with `--reload`, so `docker compose up backend` will automatically restart the API when files under `app/` change. If you ever need a production-like run, override the command (e.g., `docker compose run backend uvicorn app.main:app --host 0.0.0.0 --port 8000`) to drop the reload flag.

### **3. tusd (file upload server)**

* Exposes port **1080**
* Stores uploaded file chunks & metadata in `./data/uploads/`

### **4. frontend (EduZmena file upload UI)**

* Builds from `./eduzmena-frontend`
* Runs [`live-server`](https://www.npmjs.com/package/live-server) inside the container
* Serves the static upload UI on **[http://localhost:4173](http://localhost:4173)**
* Talks to the backend (`http://localhost:8000`) and tusd (`http://localhost:1080`) by default

Both `backend` and `tusd` access `/data` through a **shared bind mount**.

---

### File persistence

    Everything you upload or store survives container restarts because all data lives on your host:

```
./data/
 ├── app.db            ← SQLite database (regions, schools, file metadata)
 └── uploads/          ← tusd-managed uploaded files
```

Delete this folder to wipe all app data.

---

### Environment variables

You can override defaults using `.env` or via inline `docker compose`:

| Variable               | Default                              | Used by                     |
| ---------------------- | ------------------------------------ | --------------------------- |
| `OLLAMA_HOST`          | `http://ollama:11434`                | backend, worker, embeddings |
| `OLLAMA_PORT`          | `11434`                              | ollama                      |
| `OLLAMA_MODEL`         | `llama3.1:8b`                        | backend / worker LLM calls  |
| `OLLAMA_EMBED_MODEL`   | `embeddinggemma`                     | embeddings in RAG           |
| `BACKEND_TEST_PROMPT`  | “Say hi from the backend container”  | backend demo script         |
| `DATABASE_URL`         | `sqlite:////data/app.db`             | backend                     |
| `TUSD_URL`             | `http://tusd:1080`                   | backend for linking uploads |

---

### Backend API Usage

List regions

```bash
curl http://localhost:8000/regions
```

Create a region

```bash
curl -X POST http://localhost:8000/regions \
     -H "Content-Type: application/json" \
     -d '{"name": "Hlavní město Praha"}'
```

Create a school in a region (FK)

```bash
curl -X POST http://localhost:8000/schools \
     -H "Content-Type: application/json" \
     -d '{"name": "Gymnazium Nad Alejí", "region_id": 1}'
```

---

### File Upload Flow (tusd → backend)

1. **Upload file to tusd**

   ```bash
   curl -X POST http://localhost:1080/files
   ```

   (returns a `tus_id`)

2. **Save metadata in backend**

   ```bash
   curl -X POST \
     "http://localhost:8000/files?tus_id=<id>&filename=doc.pdf&school_id=1"
   ```

The backend stores `tus_id`, `filename`, and school association.

---

Logs

```bash
docker compose logs -f         # all services
docker compose logs -f backend # backend only
docker compose logs -f ollama  # ollama only
docker compose logs -f tusd    # tusd only
```

---

Stop / clean up

```bash
docker compose stop        # graceful stop
docker compose down        # remove containers, keep volumes
docker compose down -v     # remove containers + ollama model volume
rm -rf ./data              # wipe DB + uploads
```

## Known limitations
* Hallucinations and factual inaccuracies – possible limitations linked to the smaller model size.
* Chatbot response time – may be slower because all processing runs on local hardware.
* Reporting features – still partially incomplete and require further refinement.
* Dependency on open source solutions could lead to lack of support/end of support.