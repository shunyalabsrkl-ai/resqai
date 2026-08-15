import os
import json

from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)

client = AsyncGroq(
    api_key=GROQ_API_KEY
)


async def analyze_emergency(description: str):

    prompt = f"""
You are ResQAI, an AI emergency-response intelligence system.

Analyze this emergency report:

"{description}"

Return ONLY valid JSON.

Use exactly this structure:

{{
    "emergency_type": "FIRE | MEDICAL | ACCIDENT | CRIME | NATURAL_DISASTER | OTHER",
    "severity": "LOW | MEDIUM | HIGH | CRITICAL",
    "people_at_risk": true,
    "medical_required": true,
    "fire_response_required": false,
    "police_required": false,
    "recommended_actions": [
        "action 1",
        "action 2"
    ],
    "summary": "short emergency summary"
}}

Rules:
- Do not invent facts.
- If information is unknown, use false where appropriate.
- CRITICAL means immediate danger to life or major threat.
- Return JSON only.
"""

    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are ResQAI emergency intelligence AI."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1
    )

    content = response.choices[0].message.content.strip()

    # Handle accidental markdown fences
    if content.startswith("```"):
        content = content.replace("```json", "")
        content = content.replace("```", "")
        content = content.strip()

    return json.loads(content)