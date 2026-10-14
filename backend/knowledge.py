"""External knowledge for chat only: PubMed (NCBI E-utilities), ICD-10-CM (NLM Clinical Tables) and RxNorm (NLM RxNav), called directly.

RxNorm generic names widen the chat's trial search (listed in the reply); nothing here feeds scoring or patient matching.
Only search terms leave the server, never profile or patient facts.
"""

import os
import re
import xml.etree.ElementTree as ET
from functools import lru_cache

import requests

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
ICD10CM = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"
RXNAV = "https://rxnav.nlm.nih.gov/REST"
TIMEOUT = 10
ABSTRACT_CHARS = 1500

# Personal details a question may carry: ages, emails, long numbers, first-person and family words. Places are removed by name.
_PERSONAL = [r"\b\d{1,3}[\s-]*(?:years?|yrs?)[\s-]*old\b", r"\b\d{1,3}\s*y/?o\b", r"\baged?\s+\d{1,3}\b", r"\S+@\S+", r"\b\d{4,}\b",
             r"\b(?:i['’]m|im|i|me|my|mine|we|our|wife|husband|mother|father|son|daughter|mom|dad|he|she|his|her|him|male|female|man|woman|men|women)\b(?!-)"]
_ASKS_ICD = re.compile(r"\b(?:icd(?:-?10(?:-?cm)?)?|diagnosis codes?|diagnostic codes?|billing codes?)\b", re.I)
_STOP = set("a am an and are as at please email diagnosed patient patients be been by can could do does for from had has have how i if in into is it its of on or should than that the their there these this those to was were what when where which who why will with would about any after before tell me show find give latest new recent research studies study evidence papers paper literature pubmed publications say says said know trials trial clinical icd code codes".split())


def search_terms(question: str, places: frozenset[str] = frozenset()) -> str:
    """Topic words for an outside search, with personal details and known place names removed. Empty when nothing is left."""
    text = _ASKS_ICD.sub(" ", question)
    for pattern in _PERSONAL:
        text = re.sub(pattern, " ", text, flags=re.I)
    words = re.findall(r"[A-Za-z0-9][\w+-]*", text)
    # Drop any run of up to three words that names a place in the trial index ("austin", "united states").
    keep = [True] * len(words)
    for size in (3, 2, 1):
        for i in range(len(words) - size + 1):
            if " ".join(words[i:i + size]).casefold() in places:
                keep[i:i + size] = [False] * size
    words = [w for w, k in zip(words, keep) if k and w.casefold() not in _STOP and not w.isdigit()]
    return " ".join(dict.fromkeys(words))[:200]


def _ncbi(path: str, params: dict) -> requests.Response:
    # NCBI asks for tool and email on every request; the key raises the limit from 3 to 10 requests a second.
    extra = {"tool": "orvant", "email": os.getenv("PUBMED_EMAIL"), "api_key": os.getenv("NCBI_API_KEY")}
    response = requests.get(f"{EUTILS}/{path}", params={**params, **{k: v for k, v in extra.items() if v}}, timeout=TIMEOUT)
    response.raise_for_status()
    return response


def _text(node) -> str:
    return " ".join("".join(node.itertext()).split()) if node is not None else ""


def search_pubmed(terms: str, n: int = 4) -> list[dict]:
    """Most relevant PubMed records with abstracts: pmid, title, journal, year, url, abstract."""
    if not terms:
        return []
    ids = _ncbi("esearch.fcgi", {"db": "pubmed", "term": f"({terms}) AND hasabstract", "retmax": n, "sort": "relevance", "retmode": "json"}).json()["esearchresult"]["idlist"]
    if not ids:
        return []
    root = ET.fromstring(_ncbi("efetch.fcgi", {"db": "pubmed", "id": ",".join(ids), "retmode": "xml"}).content)
    articles = []
    for item in root.iter("PubmedArticle"):
        pmid = _text(item.find(".//MedlineCitation/PMID"))
        abstract = " ".join(_text(part) for part in item.iterfind(".//Abstract/AbstractText"))
        year = _text(item.find(".//JournalIssue/PubDate/Year")) or _text(item.find(".//JournalIssue/PubDate/MedlineDate"))[:4]
        articles.append({"pmid": pmid, "title": _text(item.find(".//ArticleTitle")), "journal": _text(item.find(".//Journal/ISOAbbreviation")) or _text(item.find(".//Journal/Title")),
                         "year": year or None, "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/", "abstract": abstract[:ABSTRACT_CHARS]})
    return articles


def wants_icd(question: str) -> bool:
    return bool(_ASKS_ICD.search(question))


def lookup_icd10cm(terms: str, n: int = 5) -> list[dict]:
    """ICD-10-CM codes for a condition name: code and name.

    Lay wording is retried in the code set's terms ('cancer' as 'malignant neoplasm'), then as 4-letter prefixes ('ovarian' finds 'ovary').
    """
    formal = re.sub(r"\b(?:cancers?|carcinomas?|tumou?rs?)\b", "malignant neoplasm", terms, flags=re.I)
    for attempt in dict.fromkeys([terms, formal, " ".join(word[:4] for word in formal.split())]):
        response = requests.get(ICD10CM, params={"sf": "code,name", "terms": attempt, "maxList": n}, timeout=TIMEOUT)
        response.raise_for_status()
        rows = response.json()[3] or []
        if rows:
            return [{"code": code, "name": name} for code, name in rows]
    return []


# Drug words right after prior-therapy wording: "after Tagrisso", "progressed on Keytruda or Opdivo".
_PRIOR = re.compile(r"\b(?:after|prior|previous(?:ly)?(?:\s+(?:treated\s+with|on))?|progress(?:ed|ion)\s+on|failed|failing|resistant\s+to|refractory\s+to|treated\s+with|received)"
                    r"\s+((?:[A-Za-z][\w-]*)(?:\s*(?:,|/|and|or)\s*[A-Za-z][\w-]*){0,2})", re.I)


def prior_therapy_words(question: str) -> list[str]:
    words = [w for m in _PRIOR.finditer(question) for w in re.findall(r"[A-Za-z][\w-]*", m.group(1)) if len(w) >= 4 and w.casefold() not in _STOP | {"therapy", "treatment"}]
    return list(dict.fromkeys(words))[:3]


@lru_cache(maxsize=512)
def ingredients(name: str) -> tuple[str, ...]:
    """Generic names RxNorm gives for a drug name (Tagrisso -> osimertinib); empty when it is unknown or already generic."""
    # ponytail: per-process cache with no expiry; RxNav suggests 12-24 h, which a restart already gives.
    found = requests.get(f"{RXNAV}/rxcui.json", params={"name": name, "search": 2}, timeout=TIMEOUT)
    found.raise_for_status()
    ids = found.json().get("idGroup", {}).get("rxnormId") or []
    if not ids:
        return ()
    related = requests.get(f"{RXNAV}/rxcui/{ids[0]}/related.json", params={"tty": "IN PIN"}, timeout=TIMEOUT)
    related.raise_for_status()
    names = [p["name"] for group in related.json()["relatedGroup"].get("conceptGroup", []) for p in group.get("conceptProperties", [])]
    # "fam-trastuzumab deruxtecan-nxki" is written "trastuzumab deruxtecan" in trial text.
    # Salt forms ("osimertinib mesylate") add nothing to a search.
    names = [re.sub(r"^(?:fam|ado)-|-[a-z]{4}$", "", n.casefold()) for n in names]
    names = [n for n in names if not re.search(r"\s(?:\w+ate|\w+ide|sodium|potassium|calcium|magnesium)$", n)]
    return tuple(n for n in dict.fromkeys(names) if n != name.casefold())


def generic_names(words: list[str]) -> list[dict]:
    """Brand to generic expansions for the chat's trial search: [{"name": "Tagrisso", "generics": ["osimertinib", ...]}]."""
    return [{"name": w, "generics": list(g)} for w in words if (g := ingredients(w))]
