import os
import json
from tavily import TavilyClient
from services.azure_openai import call_gpt4o
from config import settings

class ResearchScraper:

    def __init__(self):
        self.client = TavilyClient(api_key=settings.tavily_api_key)

    async def research_entity(self, company_name: str, cin: str,
                               sector: str, sub_sector: str) -> dict:
        """
        Run all 3 research categories using Tavily and return combined results.
        Tavily's search_depth="advanced" fetches full page content, not just snippets.
        """
        import asyncio

        news_task  = asyncio.to_thread(self._search_news,  company_name, sector)
        legal_task = asyncio.to_thread(self._search_legal, company_name, cin)
        macro_task = asyncio.to_thread(self._search_macro, sector, sub_sector)

        news_results, legal_results, macro_results = await asyncio.gather(
            news_task, legal_task, macro_task
        )

        # GPT-4o sentiment analysis over all results
        all_text = self._flatten_results(news_results + legal_results)
        sentiment = await self._analyze_sentiment(all_text, company_name, sector)

        return {
            "news":      news_results,
            "legal":     legal_results,
            "macro":     macro_results,
            "sentiment": sentiment,
        }

    def _search_news(self, company_name: str, sector: str) -> list:
        """Financial news and recent developments"""
        queries = [
            f"{company_name} financial results credit rating 2024 2025",
            f"{company_name} NPA default loan restructuring",
            f"{company_name} RBI SEBI regulatory action penalty",
        ]
        results = []
        for query in queries:
            try:
                response = self.client.search(
                    query=query,
                    search_depth="advanced",      # full content, not just snippet
                    max_results=4,
                    include_domains=[
                        "economictimes.indiatimes.com",
                        "livemint.com",
                        "business-standard.com",
                        "financialexpress.com",
                        "moneycontrol.com",
                        "reuters.com",
                        "bloombergquint.com",
                        "rbi.org.in",
                    ]
                )
                for r in response.get("results", []):
                    results.append({
                        "title":     r.get("title", ""),
                        "url":       r.get("url", ""),
                        "content":   r.get("content", "")[:800],  # truncate for token efficiency
                        "score":     r.get("score", 0),
                        "published": r.get("published_date", ""),
                        "category":  "news",
                        "query":     query,
                    })
            except Exception:
                continue
        # Deduplicate by URL, sort by Tavily relevance score
        seen = set()
        deduped = []
        for r in sorted(results, key=lambda x: x["score"], reverse=True):
            if r["url"] not in seen:
                seen.add(r["url"])
                deduped.append(r)
        return deduped[:10]

    def _search_legal(self, company_name: str, cin: str) -> list:
        """Legal, regulatory, and court-related findings"""
        queries = [
            f"{company_name} court case lawsuit winding up India",
            f"{company_name} fraud scam wilful defaulter CIBIL",
            f"MCA {cin if cin else company_name} struck off disqualified director",
        ]
        results = []
        for query in queries:
            try:
                response = self.client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=3,
                    include_domains=[
                        "mca.gov.in",
                        "ecourts.gov.in",
                        "sebi.gov.in",
                        "rbi.org.in",
                        "ibbi.gov.in",        # insolvency board
                        "nclt.gov.in",
                        "economictimes.indiatimes.com",
                        "business-standard.com",
                    ]
                )
                for r in response.get("results", []):
                    results.append({
                        "title":    r.get("title", ""),
                        "url":      r.get("url", ""),
                        "content":  r.get("content", "")[:600],
                        "score":    r.get("score", 0),
                        "category": "legal",
                        "query":    query,
                    })
            except Exception:
                continue
        seen = set()
        deduped = []
        for r in sorted(results, key=lambda x: x["score"], reverse=True):
            if r["url"] not in seen:
                seen.add(r["url"])
                deduped.append(r)
        return deduped[:8]

    def _search_macro(self, sector: str, sub_sector: str) -> list:
        """Sector outlook, macro trends, RBI policy signals"""
        queries = [
            f"India {sector} sector credit outlook 2025 RBI lending",
            f"{sector} {sub_sector} NPA trend interest rate impact India",
            f"India GDP growth {sector} demand forecast 2025 2026",
        ]
        results = []
        for query in queries:
            try:
                response = self.client.search(
                    query=query,
                    search_depth="basic",     # basic is enough for macro trends
                    max_results=3,
                )
                for r in response.get("results", []):
                    results.append({
                        "title":    r.get("title", ""),
                        "url":      r.get("url", ""),
                        "content":  r.get("content", "")[:600],
                        "score":    r.get("score", 0),
                        "category": "macro",
                        "query":    query,
                    })
            except Exception:
                continue
        seen = set()
        deduped = []
        for r in sorted(results, key=lambda x: x["score"], reverse=True):
            if r["url"] not in seen:
                seen.add(r["url"])
                deduped.append(r)
        return deduped[:8]

    def _flatten_results(self, results: list) -> str:
        lines = []
        for r in results[:12]:
            lines.append(f"Title: {r['title']}")
            lines.append(f"Content: {r['content'][:300]}")
            lines.append("---")
        return "\n".join(lines)

    async def _analyze_sentiment(self, articles_text: str,
                                  company_name: str, sector: str) -> dict:
        prompt = f"""Analyse these news and legal articles about {company_name} 
(sector: {sector}) for credit risk assessment.

Articles:
{articles_text[:3500]}

Respond ONLY in JSON:
{{
  "overall_sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "sentiment_score": -1.0,
  "positive_signals": ["signal1", "signal2"],
  "risk_signals": ["risk1", "risk2"],
  "red_flags": ["redflag1"],
  "legal_concerns": ["concern1"],
  "sector_outlook": "One paragraph on sector tailwinds/headwinds",
  "media_summary": "One paragraph summarising the entity's media presence"
}}"""
        result = await call_gpt4o(prompt)
        return json.loads(result)

scraper = ResearchScraper()
