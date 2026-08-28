<a name="readme-top"></a>

<p align="center">
  <a href="https://akili.bqitech.com"><img src="https://github.com/BQI-TECH/AccelaNova/blob/main/frontend/public/akili.png" alt="Akili logo"></a>
</p>

<p align="center">
    <b>Akili:</b> The all-in-one AI app you were looking for.<br />
    Chat with your docs, use AI Agents, hyper-configurable, multi-user, & no frustrating setup required.
</p>

<p align="center">
  <b>English</b> · <a href='./locales/README.zh-CN.md'>简体中文</a> · <a href='./locales/README.ja-JP.md'>日本語</a>
</p>

<p align="center">
👉 Akili for desktop (Mac, Windows, & Linux)! <a href="https://akili.bqitech.com" target="_blank">Download Now</a>
</p>

A full-stack application that enables you to turn any document, resource, or piece of content into context that any LLM can use as a reference during chatting. This application allows you to pick and choose which LLM or Vector Database you want to use as well as supporting multi-user management and permissions.

<details>
<summary><kbd>Watch the demo!</kbd></summary>

[![Watch the video](/images/youtube.png)](https://youtu.be/f95rGD9trL0)

</details>

### Product Overview

Akili is a full-stack application where you can use commercial off-the-shelf LLMs or popular open source LLMs and vectorDB solutions to build a private ChatGPT with no compromises that you can run locally as well as host remotely and be able to chat intelligently with any documents you provide it.

Akili divides your documents into objects called `workspaces`. A Workspace functions a lot like a thread, but with the addition of containerization of your documents. Workspaces can share documents, but they do not talk to each other so you can keep your context for each workspace clean.

## Cool features of Akili

- 👤 Multi-user instance support and permissioning _Docker version only_
- 🦾 Agents inside your workspace (browse the web, etc)
- 📖 Multiple document type support (PDF, TXT, DOCX, etc)
- Simple chat UI with Drag-n-Drop functionality and clear citations.
- 100% Cloud deployment ready.
- Works with all popular [closed and open-source LLM providers](#supported-llms-embedder-models-speech-models-and-vector-databases).
- Built-in cost & time-saving measures for managing very large documents compared to any other chat UI.
- Full Developer API for custom integrations!
- Much more...install and find out!

### Supported LLMs, Embedder Models, Speech models, and Vector Databases

**Large Language Models (LLMs):**

- [Any open-source llama.cpp compatible model](/server/storage/models/README.md#text-generation-llm-selection)
- [OpenAI](https://openai.com)
- [OpenAI (Generic)](https://openai.com)
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)
- [Anthropic](https://www.anthropic.com/)
- [NVIDIA NIM (chat models)](https://build.nvidia.com/explore/discover)
- [Google Gemini Pro](https://ai.google.dev/)
- [Hugging Face (chat models)](https://huggingface.co/)
- [Ollama (chat models)](https://ollama.ai/)
- [LM Studio (all models)](https://lmstudio.ai)
- [LocalAI (all models)](https://localai.io/)
- [Together AI (chat models)](https://www.together.ai/)
- [Fireworks AI (chat models)](https://fireworks.ai/)
- [Perplexity (chat models)](https://www.perplexity.ai/)
- [OpenRouter (chat models)](https://openrouter.ai/)
- [DeepSeek (chat models)](https://deepseek.com/)
- [Mistral](https://mistral.ai/)
- [Groq](https://groq.com/)
- [Cohere](https://cohere.com/)
- [KoboldCPP](https://github.com/LostRuins/koboldcpp)
- [LiteLLM](https://github.com/BerriAI/litellm)
- [Text Generation Web UI](https://github.com/oobabooga/text-generation-webui)
- [Apipie](https://apipie.ai/)
- [xAI](https://x.ai/)
- [Novita AI (chat models)](https://novita.ai/model-api/product/llm-api)
- [PPIO](https://ppinfra.com)
- [Moonshot AI](https://www.moonshot.ai/)
- [CometAPI (chat models)](https://api.cometapi.com/)

**Embedder models:**

- [Akili Native Embedder](/server/storage/models/README.md) (default)
- [OpenAI](https://openai.com)
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [LocalAI (all)](https://localai.io/)
- [Ollama (all)](https://ollama.ai/)
- [LM Studio (all)](https://lmstudio.ai)
- [Cohere](https://cohere.com/)

**Audio Transcription models:**

- [Akili Built-In](/server/storage/models/README.md#audiovideo-transcription) (default)
- [OpenAI](https://openai.com/)

**TTS (text-to-speech) support:**

- Native Browser Built-in (default)
- [PiperTTSLocal - runs in browser](https://github.com/rhasspy/piper)
- [OpenAI TTS](https://platform.openai.com/docs/guides/text-to-speech/voice-options)
- [ElevenLabs](https://elevenlabs.io/)
- Any OpenAI Compatible TTS service.

**STT (speech-to-text) support:**

- Native Browser Built-in (default)

**Vector Databases:**

- [LanceDB](https://github.com/lancedb/lancedb) (default)
- [PGVector](https://github.com/pgvector/pgvector)
- [Astra DB](https://www.datastax.com/products/datastax-astra)
- [Pinecone](https://pinecone.io)
- [Chroma & ChromaCloud](https://trychroma.com)
- [Weaviate](https://weaviate.io)
- [Qdrant](https://qdrant.tech)
- [Milvus](https://milvus.io)
- [Zilliz](https://zilliz.com)

### Technical Overview

This monorepo consists of six main sections:

- `frontend`: A viteJS + React frontend that you can run to easily create and manage all your content the LLM can use.
- `server`: A NodeJS express server to handle all the interactions and do all the vectorDB management and LLM interactions.
- `collector`: NodeJS express server that processes and parses documents from the UI.
- `docker`: Docker instructions and build process + information for building from source.

## 🛳 Self-Hosting

BQI-TECH maintains deployment scripts and templates for running Akili locally. Refer to the table below for common deployment options.

| Docker | AWS | GCP | Digital Ocean | Render.com |
|----------------------------------------|----|-----|---------------|------------|
| [![Deploy on Docker][docker-btn]][docker-deploy] | [![Deploy on AWS][aws-btn]][aws-deploy] | [![Deploy on GCP][gcp-btn]][gcp-deploy] | [![Deploy on DigitalOcean][do-btn]][do-deploy] | [![Deploy on Render.com][render-btn]][render-deploy] |

| Railway | RepoCloud | Elestio |
| --------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| [![Deploy on Railway][railway-btn]][railway-deploy] | [![Deploy on RepoCloud][repocloud-btn]][repocloud-deploy] | [![Deploy on Elestio][elestio-btn]][elestio-deploy] |

[or set up a production Akili instance without Docker →](./BARE_METAL.md)

## How to setup for development

- `yarn setup` To fill in the required `.env` files you'll need in each of the application sections (from root of repo).
  - Go fill those out before proceeding. Ensure `server/.env.development` is filled or else things won't work right.
- `yarn dev:server` To boot the server locally (from root of repo).
- `yarn dev:frontend` To boot the frontend locally (from root of repo).
- `yarn dev:collector` To then run the document collector (from root of repo).

[Learn about documents](./server/storage/documents/DOCUMENTS.md)

[Learn about vector caching](./server/storage/vector-cache/VECTOR_CACHE.md)

## Telemetry & Privacy

Akili contains a telemetry feature that collects anonymous usage information.

<details>
<summary><kbd>More about Telemetry & Privacy for Akili</kbd></summary>

### Why?

We use this information to help us understand how Akili is used, to help us prioritize work on new features and bug fixes, and to help us improve Akili's performance and stability.

### Opting out

Set `DISABLE_TELEMETRY` in your server or docker .env settings to "true" to opt out of telemetry. You can also do this in-app by going to the sidebar > `Privacy` and disabling telemetry.

### What do you explicitly track?

We will only track usage details that help us make product and roadmap decisions, specifically:

- Type of your installation (Docker or Desktop)
- When a document is added or removed. No information _about_ the document. Just that the event occurred.
- Type of vector database in use.
- Type of LLM provider & model tag in use.
- When a chat is sent. Only the **event** is sent — we have no information on the nature or content of the chat itself.

You can verify these claims by searching the codebase for `Telemetry.sendTelemetry`. Additionally these events are written to the output log so you can also see the specific data which was sent - if enabled. **No IP or other identifying information is collected**. The Telemetry provider is [PostHog](https://posthog.com/) - an open-source telemetry collection service.

We take privacy very seriously. The anonymous data is _never_ shared with third parties.

</details>

## 👋 Contributing

- [Contributing to Akili](./CONTRIBUTING.md) - How to contribute to Akili.

<div align="right">

[![][back-to-top]](#readme-top)

</div>

---

This project is [MIT](./LICENSE) licensed.

<!-- LINK GROUP -->

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-222628?style=flat-square
[docker-btn]: ./images/deployBtns/docker.png
[docker-deploy]: ./docker/HOW_TO_USE_DOCKER.md
[aws-btn]: ./images/deployBtns/aws.png
[aws-deploy]: ./cloud-deployments/aws/cloudformation/DEPLOY.md
[gcp-btn]: https://deploy.cloud.run/button.svg
[gcp-deploy]: ./cloud-deployments/gcp/deployment/DEPLOY.md
[do-btn]: https://www.deploytodo.com/do-btn-blue.svg
[do-deploy]: ./cloud-deployments/digitalocean/terraform/DEPLOY.md
[render-btn]: https://render.com/images/deploy-to-render-button.svg
[render-deploy]: ./docker/HOW_TO_USE_DOCKER.md
[railway-btn]: https://railway.app/button.svg
[railway-deploy]: ./docker/HOW_TO_USE_DOCKER.md
[repocloud-btn]: https://d16t0pc4846x52.cloudfront.net/deploylobe.svg
[repocloud-deploy]: ./docker/HOW_TO_USE_DOCKER.md
[elestio-btn]: https://elest.io/images/logos/deploy-to-elestio-btn.png
[elestio-deploy]: ./docker/HOW_TO_USE_DOCKER.md
