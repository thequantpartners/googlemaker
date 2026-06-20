import os
import json
import httpx
from bs4 import BeautifulSoup
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

async def scrape_website(url: str) -> str:
    """
    Downloads and extracts text from a given URL.
    Returns a truncated string to avoid exceeding token limits (though Gemini has 1M+ tokens).
    """
    if not url.startswith("http"):
        url = "https://" + url
    
    try:
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            response = await client.get(url, timeout=15.0)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "lxml")
            
            # Remove scripts and styles
            for script in soup(["script", "style", "noscript", "header", "footer", "nav"]):
                script.extract()
                
            text = soup.get_text(separator=' ', strip=True)
            # Truncate to first 10,000 chars to be safe and fast
            return text[:10000]
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return ""

async def generate_campaign_copy(url: str, competitors: str | None, campaign_type: str) -> dict:
    """
    Calls Gemini API to generate highly optimized Google Ads campaign copy
    based on the scraped content of the user's website and competitor analysis.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured on the server.")

    # 1. Scrape the website
    website_text = await scrape_website(url)
    if not website_text:
        website_text = "Website could not be accessed. Generate copy based purely on the domain name."

    # 2. Prepare the prompt
    system_prompt = f"""
    You are an expert Google Ads performance marketer and growth hacker.
    Your task is to generate the perfect ad copy and keywords for a new {campaign_type} Campaign.
    You will analyze the content scraped from the user's website.
    
    You MUST respond with a raw JSON object (NO markdown wrappers, NO backticks) matching this exact structure:
    {{
        "campaign_name": "A short, descriptive name for the campaign",
        "keywords": ["keyword 1", "keyword 2", ...],
        "headlines": ["Headline 1", "Headline 2", ...],
        "descriptions": ["Description 1", "Description 2", ...]
    }}
    
    Rules:
    - Generate 10-20 highly relevant keywords. Use aggressive marketing tactics. 
    - If competitors are provided, USE the competitors' brand names as keywords to steal their traffic.
    - Generate 5 to 8 headlines. MAXIMUM 30 characters each. This is a strict Google Ads limit.
    - Generate 3 to 5 descriptions. MAXIMUM 90 characters each. This is a strict Google Ads limit.
    - Emphasize unique selling propositions (USPs) found in the website text.
    - The language of the ad copy should match the primary language of the website text.
    - DO NOT wrap the response in ```json ``` blocks. Return purely the JSON string.
    """

    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system_prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.8,
            response_mime_type="application/json",
        )
    )

    prompt = f"User Website URL: {url}\n\n"
    if competitors:
        prompt += f"Competitors to target/steal traffic from: {competitors}\n\n"
    
    prompt += f"Website Scraped Text:\n{website_text}\n\nPlease generate the Google Ads {campaign_type} campaign copy."

    try:
        # Run synchronous generate_content in a thread block or use async wrapper
        # genai SDK generate_content_async is available
        response = await model.generate_content_async(prompt)
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
