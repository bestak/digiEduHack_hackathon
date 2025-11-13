# Ollama Chat Stack (`digiEduHack_hackathon/srcs/chat`)

This directory hosts a self-contained Docker Compose setup for the official [`ollama/ollama`](https://hub.docker.com/r/ollama/ollama) image. Everything lives under `digiEduHack_hackathon/srcs/chat`, so you can keep the hackathon repo tidy while running local chat experiments.

## Prerequisites
- Docker Engine 24+ or Docker Desktop 4.27+ with Compose v2.
- (Optional) NVIDIA GPU + NVIDIA Container Toolkit if you need GPU acceleration on Linux.

## Start the stack
```bash
cd digiEduHack_hackathon/srcs/chat
docker compose up -d
```
- The service binds port `11434` by default; override it with `OLLAMA_PORT=<hostPort>` if needed.
- Model/runtime data persist in the named volume `ollama_data`. Remove it with `docker compose down -v` to reclaim space.

## Auto-installed model
On the first start the container automatically downloads `llama3.1:8b` (and verifies it exists on subsequent boots) before beginning to serve requests. The download happens inside the container, so no host tooling is required.

## Manual troubleshooting / extras
- Re-download or update the model:
  ```bash
  docker compose exec ollama ollama pull llama3.1:8b
  ```
- Try another chat run inside the container:
  ```bash
  docker compose exec -it ollama ollama run llama3.1:8b
  ```
- Hit the HTTP API from your host:
  ```bash
  curl http://localhost:11434/api/chat -d '{
    "model": "llama3.1:8b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
  ```

  ```bash
  curl http://localhost:11434/api/chat -d '{
    "model": "deepseek-r1:1.5b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
  ```

## GPU usage
Uncomment the `deploy.resources` block in `docker-compose.yml` to reserve all available NVIDIA GPUs on Linux (requires the NVIDIA Container Toolkit). On Docker Desktop for macOS/Windows, enable GPU access through the UI if your hardware supports it—no compose change needed.

## Stop / clean up
```bash
docker compose stop        # Graceful stop
docker compose down        # Stop and keep the volume
docker compose down -v     # Stop and delete downloaded models/configs
```

That is all you need to spin up Ollama with the `llama3.1:8b` model inside this repository.
