import json
from openai import AsyncAzureOpenAI
from config import settings

client = AsyncAzureOpenAI(
    azure_endpoint = settings.azure_openai_endpoint,
    api_key        = settings.azure_openai_key,
    api_version    = "2024-02-01",
)

async def call_gpt4o(prompt: str, max_tokens: int = 1500) -> str:
    response = await client.chat.completions.create(
        model       = settings.azure_openai_deployment,
        temperature = 0,
        max_tokens  = max_tokens,
        response_format = {"type": "json_object"},
        messages    = [{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content
