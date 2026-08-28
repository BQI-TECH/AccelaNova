<a name="readme-top"></a>

<p align="center">
  <a href="https://Akili.bqitech.com src="https://github.com/BQI-TECH/Akili" alt="Akili logo"></a>
</p>

<div align='center'>
</div>

<p align="center">
<b>Akili:</b> Aradığınız hepsi bir arada yapay zeka uygulaması.<br />
Belgelerinizle sohbet edin, yapay zeka ajanlarını kullanın, son derece özelleştirilebilir, çok kullanıcılı ve zahmetsiz kurulum!
</p>

<p align="center">
  <a href="https://discord.gg/6UyHPeGZAC" target="_blank">
        </a> |
  <a href="https://github.com/BQI-TECH/Akili" target="_blank">
      <img src="https://img.shields.io/static/v1?label=license&message=MIT&color=white" alt="License">
  </a> |
  <a href="https://github.com/BQI-TECH/Akili target="_blank">
    Docs
  </a> |
   <a href="https://Akili.bqitech.com target="_blank">
    Hosted Instance
  </a>
</p>

<p align="center">
  <b>English</b> · <a href='./locales/README.zh-CN.md'>简体中文</a> · <a href='./locales/README.ja-JP.md'>日本語</a> · <a href='./locales/README.tr-TR.md'>Turkish</a>
</p>

<p align="center">  
👉 Masaüstü için Akili (Mac, Windows ve Linux)! <a href="https://Akili.bqitech.com target="_blank"> Şimdi İndir</a>  
</p>

Herhangi bir belgeyi, kaynağı veya içeriği sohbet sırasında herhangi bir büyük dil modelinin referans olarak kullanabileceği bir bağlama dönüştürmenizi sağlayan tam kapsamlı bir uygulama. Bu uygulama, kullanmak istediğiniz LLM veya Vektör Veritabanını seçmenize olanak tanırken, çok kullanıcılı yönetim ve yetkilendirme desteği de sunar.

![Mesajlaşma](https://github.com/BQI-TECH/Akili)

<details>
<summary><kbd>Demoyu izle!</kbd></summary>

[![Video'yu izle](/images/youtube.png)](https://youtu.be/f95rGD9trL0)

</details>

### Ürün Genel Bakışı

Akili, ticari hazır büyük dil modellerini veya popüler açık kaynak LLM'leri ve vektör veritabanı çözümlerini kullanarak, hiçbir ödün vermeden özel bir ChatGPT oluşturmanıza olanak tanıyan tam kapsamlı bir uygulamadır. Bu uygulamayı yerel olarak çalıştırabilir veya uzaktan barındırarak sağladığınız belgelerle akıllı sohbetler gerçekleştirebilirsiniz.

Akili, belgelerinizi **"çalışma alanları" (workspaces)** adı verilen nesnelere ayırır. Bir çalışma alanı, bir sohbet dizisi gibi çalışır ancak belgelerinizi kapsülleyen bir yapı sunar. Çalışma alanları belgeleri paylaşabilir, ancak birbirleriyle iletişim kurmaz, böylece her çalışma alanının bağlamını temiz tutabilirsiniz.

## Akili’in Harika Özellikleri

- 🆕 [**Özel Yapay Zeka Ajanları**](https://github.com/BQI-TECH/Akili)
- 🆕 [**Kod yazmadan AI Ajanı oluşturma aracı**](https://github.com/BQI-TECH/Akili)
- 🖼️ **Çoklu-mod desteği (hem kapalı kaynak hem de açık kaynak LLM'ler!)**
- 👤 Çok kullanıcılı destek ve yetkilendirme _(Yalnızca Docker sürümünde)_
- 🦾 Çalışma alanı içinde ajanlar (web'de gezinme vb.)
- 💬 [Web sitenize gömülebilir özel sohbet aracı](https://github.com/BQI-TECH/Akili) _(Yalnızca Docker sürümünde)_
- 📖 Çoklu belge türü desteği (PDF, TXT, DOCX vb.)
- Sade ve kullanışlı sohbet arayüzü, sürükle-bırak özelliği ve net kaynak gösterimi.
- %100 bulut konuşlandırmaya hazır.
- [Tüm popüler kapalı ve açık kaynak LLM sağlayıcılarıyla](#supported-llms-embedder-models-speech-models-and-vector-databases) uyumlu.
- Büyük belgeleri yönetirken zaman ve maliyet tasarrufu sağlayan dahili optimizasyonlar.
- Özel entegrasyonlar için tam kapsamlı Geliştirici API’si.
- Ve çok daha fazlası... Kurup keşfedin!

### Desteklenen LLM'ler, Embedding Modelleri, Konuşma Modelleri ve Vektör Veritabanları

**Büyük Dil Modelleri (LLMs):**

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
- [LocalAi (all models)](https://localai.io/)
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
- [Novita AI (chat models)](https://novita.ai/model-api/product/llm-api?utm_source=github_Akili&utm_medium=github_readme&utm_campaign=link)
- [PPIO](https://ppinfra.com?utm_source=github_Akili)

**Embedder modelleri:**

- [Akili Native Embedder](/server/storage/models/README.md) (default)
- [OpenAI](https://openai.com)
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [LocalAi (all)](https://localai.io/)
- [Ollama (all)](https://ollama.ai/)
- [LM Studio (all)](https://lmstudio.ai)
- [Cohere](https://cohere.com/)

**Ses Transkripsiyon Modelleri:**

- [Akili Built-In](https://github.com/BQI-TECH/Akili) (default)
- [OpenAI](https://openai.com/)

**TTS (text-to-speech) desteği:**

- Native Browser Built-in (default)
- [PiperTTSLocal - runs in browser](https://github.com/rhasspy/piper)
- [OpenAI TTS](https://platform.openai.com/docs/guides/text-to-speech/voice-options)
- [ElevenLabs](https://elevenlabs.io/)
- Any OpenAI Compatible TTS service.

**STT (speech-to-text) desteği:**

- Native Browser Built-in (default)

**Vektör Databases:**

- [LanceDB](https://github.com/lancedb/lancedb) (default)
- [PGVector](https://github.com/pgvector/pgvector)
- [Astra DB](https://www.datastax.com/products/datastax-astra)
- [Pinecone](https://pinecone.io)
- [Chroma](https://trychroma.com)
- [Weaviate](https://weaviate.io)
- [Qdrant](https://qdrant.tech)
- [Milvus](https://milvus.io)
- [Zilliz](https://zilliz.com)

### Teknik Genel Bakış

Bu monorepo üç ana bölümden oluşmaktadır:

- **`frontend`**: ViteJS + React tabanlı bir ön yüz, LLM'in kullanabileceği tüm içeriği kolayca oluşturup yönetmenizi sağlar.
- **`server`**: NodeJS ve Express tabanlı bir sunucu, tüm etkileşimleri yönetir ve vektör veritabanı işlemleri ile LLM entegrasyonlarını gerçekleştirir.
- **`collector`**: Kullanıcı arayüzünden gelen belgeleri işleyen ve ayrıştıran NodeJS Express tabanlı bir sunucu.
- **`docker`**: Docker kurulum talimatları, derleme süreci ve kaynak koddan nasıl derleneceğine dair bilgiler içerir.
- **`embed`**: [Web gömme widget’ı](https://github.com/BQI-TECH/Akili) oluşturma ve entegrasyonu için alt modül.
- **`browser-extension`**: [Chrome tarayıcı eklentisi](https://github.com/BQI-TECH/Akili) için alt modül.

## 🛳 Kendi Sunucunuzda Barındırma

BQI-TECH ve topluluk, Akili'i yerel olarak çalıştırmak için çeşitli dağıtım yöntemleri, betikler ve şablonlar sunmaktadır. Aşağıdaki tabloya göz atarak tercih ettiğiniz ortamda nasıl dağıtım yapabileceğinizi öğrenebilir veya otomatik dağıtım seçeneklerini keşfedebilirsiniz.
| Docker | AWS | GCP | Digital Ocean | Render.com |
|----------------------------------------|----|-----|---------------|------------|
| [![Deploy on Docker][docker-btn]][docker-deploy] | [![Deploy on AWS][aws-btn]][aws-deploy] | [![Deploy on GCP][gcp-btn]][gcp-deploy] | [![Deploy on DigitalOcean][do-btn]][do-deploy] | [![Deploy on Render.com][render-btn]][render-deploy] |

| Railway                                             | RepoCloud                                                 | Elestio                                             |
| --------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| [![Deploy on Railway][railway-btn]][railway-deploy] | [![Deploy on RepoCloud][repocloud-btn]][repocloud-deploy] | [![Deploy on Elestio][elestio-btn]][elestio-deploy] |

[veya Docker kullanmadan üretim ortamında Akili kurun →](../BARE_METAL.md)

## Geliştirme İçin Kurulum

- `yarn setup` → Uygulamanın her bileşeni için gerekli `.env` dosyalarını oluşturur (repo’nun kök dizininden çalıştırılmalıdır).
  - Devam etmeden önce bu dosyaları doldurun. **Özellikle `server/.env.development` dosyasının doldurulduğundan emin olun**, aksi takdirde sistem düzgün çalışmaz.
- `yarn dev:server` → Sunucuyu yerel olarak başlatır (repo’nun kök dizininden çalıştırılmalıdır).
- `yarn dev:frontend` → Ön yüzü yerel olarak çalıştırır (repo’nun kök dizininden çalıştırılmalıdır).
- `yarn dev:collector` → Belge toplayıcıyı çalıştırır (repo’nun kök dizininden çalıştırılmalıdır).

[Belgeler hakkında bilgi edinin](../server/storage/documents/DOCUMENTS.md)

[Vektör önbellekleme hakkında bilgi edinin](../server/storage/vector-cache/VECTOR_CACHE.md)

## Harici Uygulamalar ve Entegrasyonlar

_Bu uygulamalar BQI-TECH tarafından yönetilmemektedir, ancak Akili ile uyumludur. Burada listelenmeleri bir onay anlamına gelmez._

- [Midori AI Alt Sistem Yöneticisi](https://io.midori-ai.xyz/subsystem/akili/) - Docker konteyner teknolojisini kullanarak yapay zeka sistemlerini verimli bir şekilde dağıtmanın pratik bir yolu.
- [Coolify](https://coolify.io/docs/services/akili/) - Tek tıklamayla Akili dağıtımı yapmanıza olanak tanır.
- [GPTLocalhost for Microsoft Word](https://gptlocalhost.com/demo/) - Akili’i Microsoft Word içinde kullanmanıza olanak tanıyan yerel bir Word eklentisi.

## Telemetri ve Gizlilik

BQI-TECH tarafından geliştirilen Akili, anonim kullanım bilgilerini toplayan bir telemetri özelliği içermektedir.

<details>  
<summary><kbd>Akili için Telemetri ve Gizlilik hakkında daha fazla bilgi</kbd></summary>

### Neden?

Bu bilgileri, Akili’in nasıl kullanıldığını anlamak, yeni özellikler ve hata düzeltmelerine öncelik vermek ve uygulamanın performansını ve kararlılığını iyileştirmek için kullanıyoruz.

### Telemetriden Çıkış Yapma (Opt-Out)

Sunucu veya Docker `.env` ayarlarında `DISABLE_TELEMETRY` değerini "true" olarak ayarlayarak telemetriyi devre dışı bırakabilirsiniz. Ayrıca, uygulama içinde **Kenar Çubuğu > Gizlilik** bölümüne giderek de bu özelliği kapatabilirsiniz.

### Hangi Verileri Açıkça Takip Ediyoruz?

Yalnızca ürün ve yol haritası kararlarını almamıza yardımcı olacak kullanım detaylarını takip ediyoruz:

- Kurulum türü (Docker veya Masaüstü)
- Bir belgenin eklenme veya kaldırılma olayı. **Belgenin içeriği hakkında hiçbir bilgi toplanmaz**, yalnızca olayın gerçekleştiği kaydedilir. Bu, kullanım sıklığını anlamamıza yardımcı olur.
- Kullanılan vektör veritabanı türü. Hangi sağlayıcının daha çok tercih edildiğini belirlemek için bu bilgiyi topluyoruz.
- Kullanılan LLM türü. En popüler modelleri belirleyerek bu sağlayıcılara öncelik verebilmemizi sağlar.
- Sohbet başlatılması. Bu en sık gerçekleşen "olay" olup, projenin günlük etkinliği hakkında genel bir fikir edinmemize yardımcı olur. **Yalnızca olay kaydedilir, sohbetin içeriği veya doğası hakkında hiçbir bilgi toplanmaz.**

Bu verileri doğrulamak için kod içinde **`Telemetry.sendTelemetry` çağrılarını** inceleyebilirsiniz. Ayrıca, bu olaylar günlük kaydına yazıldığı için hangi verilerin gönderildiğini görebilirsiniz (eğer etkinleştirilmişse). **IP adresi veya diğer tanımlayıcı bilgiler toplanmaz.** Telemetri sağlayıcısı, açık kaynaklı bir telemetri toplama hizmeti olan [PostHog](https://posthog.com/)‘dur.

[Kaynak kodda tüm telemetri olaylarını görüntüle](https://github.com/search?q=repo%3ABQI-TECH%2FAkili%20.sendTelemetry(&type=code)

</details>

## 👋 Katkıda Bulunma

- Bir **issue** oluşturun.
- `<issue numarası>-<kısa ad>` formatında bir **PR (Pull Request)** oluşturun.
- Çekirdek ekipten **LGTM (Looks Good To Me)** onayı alın.

## 🌟 Katkıda Bulunanlar

[![akili contributors](https://contrib.rocks/image?repo=BQI-TECH/Akili)](https://github.com/BQI-TECH/Akili)

[![Star History Chart](https://api.star-history.com/svg?repos=BQI-TECH/Akili&type=Timeline)](https://star-history.com/#BQI-TECH/Akili&Date)

## 🔗 Diğer Ürünler

- **[VectorAdmin][vector-admin]:** Vektör veritabanlarını yönetmek için hepsi bir arada GUI ve araç paketi.
- **[OpenAI Assistant Swarm][assistant-swarm]:** Tüm OpenAI asistanlarınızı tek bir ajan tarafından yönetilen bir yapay zeka ordusuna dönüştürün.

<div align="right">

[![][back-to-top]](#readme-top)

</div>

---

Telif Hakkı © 2025 [BQI-TECH][profile-link]. <br />  
Bu proje [MIT](../LICENSE) lisansı ile lisanslanmıştır.

<!-- LINK GROUP -->

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-222628?style=flat-square
[profile-link]: https://github.com/BQI-TECH
[vector-admin]: https://github.com/BQI-TECH/Akili
[assistant-swarm]: https://github.com/BQI-TECH/Akili
[docker-btn]: ./images/deployBtns/docker.png
[docker-deploy]: ./docker/HOW_TO_USE_DOCKER.md
[aws-btn]: ./images/deployBtns/aws.png
[aws-deploy]: ./cloud-deployments/aws/cloudformation/DEPLOY.md
[gcp-btn]: https://deploy.cloud.run/button.svg
[gcp-deploy]: ./cloud-deployments/gcp/deployment/DEPLOY.md
[do-btn]: https://www.deploytodo.com/do-btn-blue.svg
[do-deploy]: ./cloud-deployments/digitalocean/terraform/DEPLOY.md
[render-btn]: https://render.com/images/deploy-to-render-button.svg
[render-deploy]: https://render.com/deploy?repo=https://github.com/BQI-TECH/Akili
[render-btn]: https://render.com/images/deploy-to-render-button.svg
[render-deploy]: https://render.com/deploy?repo=https://github.com/BQI-TECH/Akili
[railway-btn]: https://railway.app/button.svg
[railway-deploy]: https://railway.app/template/HNSCS1?referralCode=WFgJkn
[repocloud-btn]: https://d16t0pc4846x52.cloudfront.net/deploylobe.svg
[repocloud-deploy]: https://repocloud.io/details/?app_id=276
[elestio-btn]: https://elest.io/images/logos/deploy-to-elestio-btn.png
[elestio-deploy]: https://elest.io/open-source/akili
