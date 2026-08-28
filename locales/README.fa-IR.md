<a name="readme-top"></a>

<p align="center">
  <a href="https://Akili.bqitech.com src="https://github.com/BQI-TECH/Akili" alt="Akili logo"></a>
</p>

<div align='center'>
</div>

<p align="center" dir="rtl">
    <b>Akili:</b> اپلیکیشن همه‌کاره هوش مصنوعی که دنبالش بودید.<br />
    با اسناد خود چت کنید، از عامل‌های هوش مصنوعی استفاده کنید، با قابلیت پیکربندی بالا، چند کاربره، و بدون نیاز به تنظیمات پیچیده.
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

<p align="center" dir="rtl">
  <b>English</b> · <a href='./locales/README.zh-CN.md'>简体中文</a> · <a href='./locales/README.ja-JP.md'>日本語</a> · <b>فارسی</b>
</p>

<p align="center" dir="rtl">
👈 Akili برای دسکتاپ (مک، ویندوز و لینوکس)! <a href="https://Akili.bqitech.com target="_blank">دانلود کنید</a>
</p>

<div dir="rtl">
یک اپلیکیشن کامل که به شما امکان می‌دهد هر سند، منبع یا محتوایی را به زمینه‌ای تبدیل کنید که هر LLM می‌تواند در حین گفتگو به عنوان مرجع از آن استفاده کند. این برنامه به شما اجازه می‌دهد LLM یا پایگاه داده برداری مورد نظر خود را انتخاب کنید و همچنین از مدیریت چند کاربره و مجوزها پشتیبانی می‌کند.
</div>

![Chatting](https://github.com/BQI-TECH/Akili)

<details>
<summary><kbd>دموی ویدیویی را تماشا کنید!</kbd></summary>

[![Watch the video](/images/youtube.png)](https://youtu.be/f95rGD9trL0)

</details>
<div dir="rtl">

### نمای کلی محصول

Akili یک اپلیکیشن کامل است که در آن می‌توانید از LLM‌های تجاری آماده یا LLM‌های متن‌باز محبوب و راه‌حل‌های vectorDB برای ساخت یک ChatGPT خصوصی بدون محدودیت استفاده کنید که می‌توانید آن را به صورت محلی اجرا کنید یا از راه دور میزبانی کنید و با هر سندی که به آن ارائه می‌دهید، هوشمندانه گفتگو کنید.

Akili اسناد شما را به اشیایی به نام `workspaces` تقسیم می‌کند. یک Workspace مانند یک رشته عمل می‌کند، اما با اضافه شدن کانتینرسازی اسناد شما. Workspaceها می‌توانند اسناد را به اشتراک بگذارند، اما با یکدیگر ارتباط برقرار نمی‌کنند تا بتوانید زمینه هر workspace را تمیز نگه دارید.

</div>
<div dir="rtl">

## ویژگی‌های جذاب Akili

- 🆕 [**عامل‌های هوش مصنوعی سفارشی**](https://github.com/BQI-TECH/Akili)
- 🖼️ **پشتیبانی از چند مدل (هم LLMهای متن‌باز و هم تجاری!)**
- 👤 پشتیبانی از چند کاربر و سیستم مجوزها _فقط در نسخه Docker_
- 🦾 عامل‌ها در فضای کاری شما (مرور وب، اجرای کد و غیره)
- 💬 [ویجت چت قابل جاسازی سفارشی برای وب‌سایت شما](../embed/README.md) _فقط در نسخه Docker_
- 📖 پشتیبانی از انواع مختلف سند (PDF، TXT، DOCX و غیره)
- رابط کاربری ساده چت با قابلیت کشیدن و رها کردن و استنادهای واضح
- ۱۰۰٪ آماده استقرار در فضای ابری
- سازگار با تمام [ارائه‌دهندگان محبوب LLM متن‌باز و تجاری](#supported-llms-embedder-models-speech-models-and-vector-databases)
- دارای اقدامات داخلی صرفه‌جویی در هزینه و زمان برای مدیریت اسناد بسیار بزرگ در مقایسه با سایر رابط‌های کاربری چت
- API کامل توسعه‌دهنده برای یکپارچه‌سازی‌های سفارشی!
- و موارد بیشتر... نصب کنید و کشف کنید!

### LLMها، مدل‌های Embedder، مدل‌های گفتاری و پایگاه‌های داده برداری پشتیبانی شده

**مدل‌های زبانی بزرگ (LLMs):**

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

<div dir="rtl">

**مدل‌های Embedder:**

- [Akili Native Embedder](/server/storage/models/README.md) (پیش‌فرض)
- [OpenAI](https://openai.com)
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [LocalAi (همه)](https://localai.io/)
- [Ollama (همه)](https://ollama.ai/)
- [LM Studio (همه)](https://lmstudio.ai)
- [Cohere](https://cohere.com/)

**مدل‌های رونویسی صوتی:**

- [Akili Built-In](https://github.com/BQI-TECH/Akili) (پیش‌فرض)
- [OpenAI](https://openai.com/)

**پشتیبانی TTS (تبدیل متن به گفتار):**

- امکانات داخلی مرورگر (پیش‌فرض)
- [PiperTTSLocal - اجرا در مرورگر](https://github.com/rhasspy/piper)
- [OpenAI TTS](https://platform.openai.com/docs/guides/text-to-speech/voice-options)
- [ElevenLabs](https://elevenlabs.io/)
- هر سرویس TTS سازگار با OpenAI

**پشتیبانی STT (تبدیل گفتار به متن):**

- امکانات داخلی مرورگر (پیش‌فرض)

**پایگاه‌های داده برداری:**

- [LanceDB](https://github.com/lancedb/lancedb) (پیش‌فرض)
- [PGVector](https://github.com/pgvector/pgvector)
- [Astra DB](https://www.datastax.com/products/datastax-astra)
- [Pinecone](https://pinecone.io)
- [Chroma](https://trychroma.com)
- [Weaviate](https://weaviate.io)
- [Qdrant](https://qdrant.tech)
- [Milvus](https://milvus.io)
- [Zilliz](https://zilliz.com)

### نمای کلی فنی

این مخزن شامل سه بخش اصلی است:

- `frontend`: یک رابط کاربری viteJS + React که می‌توانید برای ایجاد و مدیریت آسان تمام محتوای قابل استفاده توسط LLM اجرا کنید.
- `server`: یک سرور NodeJS express برای مدیریت تمام تعاملات و انجام مدیریت vectorDB و تعاملات LLM.
- `collector`: سرور NodeJS express که اسناد را از رابط کاربری پردازش و تجزیه می‌کند.
- `docker`: دستورالعمل‌های Docker و فرآیند ساخت + اطلاعات برای ساخت از منبع.
- `embed`: زیرماژول برای تولید و ایجاد [ویجت قابل جاسازی وب](https://github.com/BQI-TECH/Akili).
- `browser-extension`: زیرماژول برای [افزونه مرورگر کروم](https://github.com/BQI-TECH/Akili).

</div>

## 🛳 میزبانی شخصی

<div dir="rtl">

BQI-TECH و جامعه کاربران، روش‌ها، اسکریپت‌ها و قالب‌های متعددی را برای اجرای Akili به صورت محلی نگهداری می‌کنند. برای مطالعه نحوه استقرار در محیط مورد نظر خود یا استقرار خودکار، به جدول زیر مراجعه کنید.

</div>

| Docker                                           | AWS                                     | GCP                                     | Digital Ocean                                  | Render.com                                           |
| ------------------------------------------------ | --------------------------------------- | --------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| [![Deploy on Docker][docker-btn]][docker-deploy] | [![Deploy on AWS][aws-btn]][aws-deploy] | [![Deploy on GCP][gcp-btn]][gcp-deploy] | [![Deploy on DigitalOcean][do-btn]][do-deploy] | [![Deploy on Render.com][render-btn]][render-deploy] |

| Railway                                             | RepoCloud                                                 | Elestio                                             |
| --------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| [![Deploy on Railway][railway-btn]][railway-deploy] | [![Deploy on RepoCloud][repocloud-btn]][repocloud-deploy] | [![Deploy on Elestio][elestio-btn]][elestio-deploy] |

<div dir="rtl">

[یا راه‌اندازی نمونه تولیدی Akili بدون Docker →](../BARE_METAL.md)

## راه‌اندازی برای توسعه

- `yarn setup` برای پر کردن فایل‌های `.env` مورد نیاز در هر بخش از برنامه (از ریشه مخزن).
  - قبل از ادامه، آن‌ها را پر کنید. اطمینان حاصل کنید که `server/.env.development` پر شده است، در غیر این صورت همه چیز درست کار نخواهد کرد.
- `yarn dev:server` برای راه‌اندازی سرور به صورت محلی (از ریشه مخزن).
- `yarn dev:frontend` برای راه‌اندازی فرانت‌اند به صورت محلی (از ریشه مخزن).
- `yarn dev:collector` برای اجرای جمع‌کننده اسناد (از ریشه مخزن).

[درباره اسناد بیشتر بدانید](../server/storage/documents/DOCUMENTS.md)

[درباره کش‌کردن بردار بیشتر بدانید](../server/storage/vector-cache/VECTOR_CACHE.md)

## تله‌متری و حریم خصوصی

Akili توسط BQI-TECH Inc دارای ویژگی تله‌متری است که اطلاعات استفاده ناشناس را جمع‌آوری می‌کند.

<details>
<summary><kbd>اطلاعات بیشتر درباره تله‌متری و حریم خصوصی Akili</kbd></summary>

### چرا؟

<div dir="rtl">
ما از این اطلاعات برای درک نحوه استفاده از Akili، اولویت‌بندی کار روی ویژگی‌های جدید و رفع اشکالات، و بهبود عملکرد و پایداری Akili استفاده می‌کنیم.
</div>

### غیرفعال کردن

<div dir="rtl">
برای غیرفعال کردن تله‌متری، `DISABLE_TELEMETRY` را در تنظیمات .env سرور یا داکر خود روی "true" تنظیم کنید. همچنین می‌توانید این کار را در برنامه با رفتن به نوار کناری > `حریم خصوصی` و غیرفعال کردن تله‌متری انجام دهید.
</div>

### دقیقاً چه چیزی را ردیابی می‌کنید؟

<div dir="rtl">
ما فقط جزئیات استفاده‌ای را که به ما در تصمیم‌گیری‌های محصول و نقشه راه کمک می‌کند، ردیابی می‌کنیم، به طور خاص:

- نوع نصب شما (Docker یا Desktop)
- زمانی که سندی اضافه یا حذف می‌شود. هیچ اطلاعاتی _درباره_ سند نداریم. فقط رویداد ثبت می‌شود.
- نوع پایگاه داده برداری در حال استفاده. به ما کمک می‌کند بدانیم کدام ارائه‌دهنده بیشتر استفاده می‌شود.
- نوع LLM در حال استفاده. به ما کمک می‌کند محبوب‌ترین انتخاب را بشناسیم.
- ارسال چت. این معمول‌ترین "رویداد" است و به ما ایده‌ای از فعالیت روزانه می‌دهد.

می‌توانید این ادعاها را با پیدا کردن تمام مکان‌هایی که `Telemetry.sendTelemetry` فراخوانی می‌شود، تأیید کنید. ارائه‌دهنده تله‌متری [PostHog](https://posthog.com/) است.

[مشاهده همه رویدادهای تله‌متری در کد منبع](https://github.com/search?q=repo%3ABQI-TECH%2FAkili%20.sendTelemetry(&type=code)

</div>

</details>

## 👋 مشارکت

<div dir="rtl">

- ایجاد issue
- ایجاد PR با فرمت نام شاخه `<شماره issue>-<نام کوتاه>`
- تأیید از تیم اصلی
</div>

## 🌟 مشارکت‌کنندگان

[![مشارکت‌کنندگان akili](https://contrib.rocks/image?repo=BQI-TECH/Akili)](https://github.com/BQI-TECH/Akili)

[![نمودار تاریخچه ستاره‌ها](https://api.star-history.com/svg?repos=BQI-TECH/Akili&type=Timeline)](https://star-history.com/#BQI-TECH/Akili&Date)

## 🔗 محصولات بیشتر

<div dir="rtl">

- **[VectorAdmin][vector-admin]:** یک رابط کاربری و مجموعه ابزار همه‌کاره برای مدیریت پایگاه‌های داده برداری.
- **[OpenAI Assistant Swarm][assistant-swarm]:** تبدیل کل کتابخانه دستیاران OpenAI به یک ارتش واحد تحت فرمان یک عامل.
</div>

<div align="right">

[![][back-to-top]](#readme-top)

</div>

---

<div dir="ltr" align="left">

Copyright © 2025 [BQI-TECH][profile-link]. <br />
This project is [MIT](../LICENSE) licensed.

</div>
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
