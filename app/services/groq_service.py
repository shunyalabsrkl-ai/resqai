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


def fallback_analysis(description: str):
    """Keep emergency reporting available if the external AI provider is down."""
    text = description.lower()

    if any(word in text for word in ["fire", "burn", "smoke", "blast"]):
        emergency_type = "FIRE"
    elif any(word in text for word in ["accident", "crash", "collision", "vehicle"]):
        emergency_type = "ACCIDENT"
    elif any(word in text for word in ["crime", "attack", "threat", "robbery", "violence"]):
        emergency_type = "CRIME"
    elif any(word in text for word in ["flood", "earthquake", "storm", "cyclone"]):
        emergency_type = "NATURAL_DISASTER"
    elif any(word in text for word in ["medical", "injured", "unconscious", "bleeding", "ambulance"]):
        emergency_type = "MEDICAL"
    else:
        emergency_type = "OTHER"

    critical_terms = ["unconscious", "not breathing", "severe bleeding", "trapped", "explosion", "fire spreading"]
    high_terms = ["injured", "accident", "fire", "attack", "urgent"]
    severity = "CRITICAL" if any(term in text for term in critical_terms) else "HIGH" if any(term in text for term in high_terms) else "MEDIUM"

    return {
        "emergency_type": emergency_type,
        "severity": severity,
        "people_at_risk": severity in ["HIGH", "CRITICAL"],
        "medical_required": emergency_type == "MEDICAL",
        "fire_response_required": emergency_type == "FIRE",
        "police_required": emergency_type == "CRIME",
        "recommended_actions": ["A responder will review this emergency report."],
        "summary": "Emergency report received; automated fallback triage applied.",
        "analysis_source": "fallback",
    }


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

    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are ResQAI emergency intelligence AI."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )

        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except Exception as error:
        # Never let an optional third-party AI call prevent an SOS report.
        print(f"ResQAI AI analysis unavailable; using fallback triage: {error}")
        return fallback_analysis(description)
