"""Localize Google Fonts for keyframe comps.
Usage: python3 tools/fetch_fonts.py <name> "<css2 family query>"
  e.g. python3 tools/fetch_fonts.py instrument "family=Instrument+Serif:ital@0;1"
Writes fonts/<name>/fonts.css (with local url()s) that a comp page can <link>.
"""
import os, re, subprocess, sys
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36"
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name, q = sys.argv[1], sys.argv[2]
d = os.path.join(root, 'fonts', name); os.makedirs(d, exist_ok=True)
css = subprocess.run(['curl', '-sS', '-A', UA, f'https://fonts.googleapis.com/css2?{q}&display=swap'], capture_output=True, text=True, check=True).stdout
# keep only latin subsets to stay small
blocks = re.findall(r'/\* ([a-z\-]+) \*/\s*(@font-face \{.*?\})', css, re.S)
out = []
for subset, block in blocks:
    if subset not in ('latin', 'latin-ext'):
        continue
    url = re.search(r'url\((https://[^)]+)\)', block).group(1)
    fn = re.sub(r'[^a-zA-Z0-9._-]', '_', url.split('/s/')[-1])
    path = os.path.join(d, fn)
    if not os.path.exists(path):
        subprocess.run(['curl', '-sS', '-o', path, url], check=True)
    out.append(block.replace(url, fn))
open(os.path.join(d, 'fonts.css'), 'w').write('\n'.join(out) + '\n')
print(os.path.join('fonts', name, 'fonts.css'), len(out), 'faces')
