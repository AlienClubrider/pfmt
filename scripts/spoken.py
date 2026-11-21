"""Turn narration text into what Kokoro should actually say.

The narration files stay readable for people; this fixes the few things the
speech front end gets wrong (seen in Kokoro's phonemes on 2026-11-21: "15%" after a "$" became
"fifteen dollars percent", "<Void>" became "void)").
"""
import re

KEEP_AS_IS = {'iPhone', 'iPad', 'macOS', 'iOS', 'eBay'}

_RULES = [
    (re.compile(r'\$(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?'), r'\1\2 dollars'),  # $50 -> 50 dollars
    (re.compile(r'\$([A-Z])\b'), r'\1 dollars'),                      # $X -> X dollars
    (re.compile(r'(\d)\s?%'), r'\1 percent'),                         # 15% -> 15 percent
    (re.compile(r'\s?÷\s?'), ' divided by '),
    (re.compile(r'(\w)<(\w+)>'), r'\1 of \2'),                        # CompletableFuture<Void>
    (re.compile(r'\(\)\s*->\s*\.\.\.'), 'a lambda'),                  # supplyAsync(() -> ...)
    (re.compile(r'\.(\w+)\((?=[\s,.;])'), r'\1'),                     # .submit( -> submit
    (re.compile(r'\[([^\]\n]+)\]'), r'\1'),                           # [who] -> who
]

_CAMEL = re.compile(r'\b[A-Za-z]*[a-z][A-Z][A-Za-z]*\b')


def _split_camel(m: re.Match) -> str:
    word = m.group(0)
    if word in KEEP_AS_IS:
        return word
    return re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', word)                  # supplyAsync -> supply Async


def spoken(text: str) -> str:
    for pattern, repl in _RULES:
        text = pattern.sub(repl, text)
    return _CAMEL.sub(_split_camel, text)
