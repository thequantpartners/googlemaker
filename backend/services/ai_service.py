import os
import json
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def generate_campaign_copy(business_description: str) -> dict:
    """
    Calls Gemini API to generate highly optimized Google Ads campaign copy
    based on the user's business description.
    Returns a dictionary with campaign_name, keywords, headlines, and descriptions.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured on the server.")

    system_prompt = """
    You are an expert Google Ads performance marketer.
    Your task is to generate the perfect ad copy and keywords for a new Search Campaign based on the user's business description.
    You MUST respond with a raw JSON object (NO markdown wrappers, NO backticks) matching this exact structure:
    {
        "campaign_name": "A short, descriptive name for the campaign",
        "keywords": ["keyword 1", "keyword 2", ...],
        "headlines": ["Headline 1", "Headline 2", ...],
        "descriptions": ["Description 1", "Description 2", ...]
    }
    
    Rules:
    - Generate 10-15 highly relevant keywords (mix of exact and broad match intent, but write them as plain text).
    - Generate 4 to 6 headlines. MAXIMUM 30 characters each. This is a strict Google Ads limit.
    - Generate 2 to 4 descriptions. MAXIMUM 90 characters each. This is a strict Google Ads limit.
    - The language of the ad copy should match the language the user used to describe their business.
    - DO NOT wrap the response in ```json ``` blocks. Return purely the JSON string.
    """

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.7,
            response_mime_type="application/json",
        )
    )

    prompt = f"Business Description:\n{business_description}\n\nPlease generate the Google Ads campaign copy."

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # In case the model still outputs markdown despite instructions
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text.strip())
        return data
    except Exception as e:
        raise ValueError(f"Failed to generate campaign copy: {str(e)}")
