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
        model_name="gemini-flash-latest",
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

import urllib.parse

async def find_competitors(url: str) -> list[str]:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured on the server.")

    website_text = await scrape_website(url)
    if not website_text:
        raise ValueError("Could not scrape the provided URL.")

    model = genai.GenerativeModel(
        model_name="gemini-flash-latest",
        generation_config=genai.types.GenerationConfig(temperature=0.3)
    )

    # 1. Ask Gemini for the best Google Search query
    query_prompt = f"Analyze this website content and provide the single best Google Search query to find their direct competitors (e.g., 'Miami immigration lawyer' or 'CRM software'). Return ONLY the search query string, nothing else.\n\nContent:\n{website_text[:5000]}"
    
    try:
        query_response = await model.generate_content_async(query_prompt)
        search_query = query_response.text.strip().replace('"', '')
    except Exception as e:
        if "429" in str(e):
            raise ValueError("La Inteligencia Artificial está saturada (límite del plan gratuito). Por favor, espera 1 minuto y vuelve a intentarlo.")
        raise ValueError(f"Failed to generate search query: {str(e)}")

    # 2. Scrape Google and DuckDuckGo for the query concurrently
    search_results_text = ""
    
    import asyncio
    async def fetch_google():
        google_url = f"https://www.google.com/search?q={urllib.parse.quote(search_query)}"
        try:
            async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
                res = await client.get(
                    google_url, 
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                    timeout=5.0
                )
                soup = BeautifulSoup(res.text, "lxml")
                titles = soup.select('h3')
                return "--- GOOGLE SEARCH RESULTS ---\n" + "".join([f"Title: {t.text.strip()}\n" for t in titles[:8] if t.text.strip()])
        except Exception as e:
            print(f"Google HTTP search error: {e}")
            return ""

    async def fetch_ddg():
        search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(search_query)}"
        try:
            async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
                res = await client.get(search_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}, timeout=5.0)
                soup = BeautifulSoup(res.text, "lxml")
                results = soup.select('.result__snippet')
                titles = soup.select('.result__title')
                return "\n--- OTHER SEARCH ENGINE (DuckDuckGo) RESULTS ---\n" + "".join([f"Title: {t.text.strip()}\nSnippet: {s.text.strip()}\n\n" for t, s in zip(titles[:8], results[:8])])
        except Exception as e:
            print(f"DuckDuckGo Search failed: {e}")
            return ""

    try:
        g_task = asyncio.wait_for(fetch_google(), timeout=4.0)
        d_task = asyncio.wait_for(fetch_ddg(), timeout=4.0)
        concurrent_results = await asyncio.gather(g_task, d_task, return_exceptions=True)
        search_results_text += concurrent_results[0] if isinstance(concurrent_results[0], str) else ""
        search_results_text += concurrent_results[1] if isinstance(concurrent_results[1], str) else ""
    except Exception as e:
        print(f"Concurrent search error: {e}")

    # 3. Ask Gemini to extract the competitors from the combined search results
    extract_prompt = f"""
    We searched Google for "{search_query}" to find competitors for a business.
    Here are the search results:
    
    {search_results_text}
    
    Extract the names of up to 5 direct competitors from these results. Ignore directories (like Yelp, Avvo, Expertise, Justia) if possible.
    Return ONLY a raw JSON array of strings containing the names of the competitors. No markdown formatting, no backticks.
    Example: ["Competitor 1", "Competitor 2"]
    """

    extract_model = genai.GenerativeModel(
        model_name="gemini-flash-latest",
        generation_config=genai.types.GenerationConfig(
            temperature=0.3,
            response_mime_type="application/json",
        )
    )

    try:
        response = await extract_model.generate_content_async(extract_prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        
        data = json.loads(text.strip())
        if isinstance(data, list):
            return data
        return []
    except Exception as e:
        if "429" in str(e):
            raise ValueError("La Inteligencia Artificial está saturada (límite del plan gratuito). Por favor, espera 1 minuto y vuelve a intentarlo.")
        raise ValueError(f"Failed to find competitors from search: {str(e)}")
