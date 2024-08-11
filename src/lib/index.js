const { Tables } = require('@/supabase/types');
const { LLM, LLMID, OpenRouterLLM } = require('@/types');
const { toast } = require('sonner');
const { LLM_LIST_MAP } = require('./llm/llm-list');

const fetchHostedModels = async profile => {
  try {
    const providers = ['google', 'anthropic', 'perplexity'];

    if (profile.use_azure_openai) {
      providers.push('azure');
    } else {
      providers.push('openai');
    }

    const response = await fetch('/api/keys');

    if (!response.ok) {
      throw new Error(`Server is not responding.`);
    }

    const data = await response.json();

    let modelsToAdd = [];

    for (const provider of providers) {
      let providerKey;

      if (provider === 'google') {
        providerKey = 'google_gemini_api_key';
      } else if (provider === 'azure') {
        providerKey = 'azure_openai_api_key';
      } else {
        providerKey = `${provider}_api_key`;
      }

      if (profile?.[providerKey] || data.isUsingEnvKeyMap[provider]) {
        const models = LLM_LIST_MAP[provider];

        if (Array.isArray(models)) {
          modelsToAdd.push(...models);
        }
      }
    }

    return {
      envKeyMap: data.isUsingEnvKeyMap,
      hostedModels: modelsToAdd,
    };
  } catch (error) {
    console.warn('Error fetching hosted models: ' + error);
  }
};

const fetchOllamaModels = async () => {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_OLLAMA_URL + '/api/tags');

    if (!response.ok) {
      throw new Error(`Ollama server is not responding.`);
    }

    const data = await response.json();

    const localModels = data.models.map(model => ({
      modelId: model.name,
      modelName: model.name,
      provider: 'ollama',
      hostedId: model.name,
      platformLink: 'https://ollama.ai/library',
      imageInput: false,
    }));

    return localModels;
  } catch (error) {
    console.warn('Error fetching Ollama models: ' + error);
  }
};

const fetchOpenRouterModels = async () => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');

    if (!response.ok) {
      throw new Error(`OpenRouter server is not responding.`);
    }

    const { data } = await response.json();

    const openRouterModels = data.map(model => ({
      modelId: model.id,
      modelName: model.id,
      provider: 'openrouter',
      hostedId: model.name,
      platformLink: 'https://openrouter.dev',
      imageInput: false,
      maxContext: model.context_length,
    }));

    return openRouterModels;
  } catch (error) {
    console.error('Error fetching Open Router models: ' + error);
    toast.error('Error fetching Open Router models: ' + error);
  }
};

module.exports = {
  fetchHostedModels,
  fetchOllamaModels,
  fetchOpenRouterModels,
};
