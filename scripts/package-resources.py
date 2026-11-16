"""Rebuild the public resource bundle from the reviewed manifest (Python 3)."""
import csv
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
resources = json.loads((root / 'content/resources.json').read_text())
project = json.loads((root / 'content/project.json').read_text())
budget = json.loads((root / 'content/budget.json').read_text())
with (root/'public/resources/hydroponics-cost-breakdown.csv').open('w') as file:
    writer = csv.writer(file)
    writer.writerow(['Category','Item','Quantity','Listed unit price (USD)','Listed line total (USD)','Basis','Source','Note'])
    for r in budget['rows']:
        writer.writerow([r['category'],r['name'],r['quantity'],f"{r['unitCents']/100:.2f}",f"{r['totalCents']/100:.2f}",r['basis'],r['source'],r['note']])
notes = ['# Classroom hydroponics — teacher resources', '', 'These are blank teaching materials, not student work.', 'The interactive slideshow opens in a browser. Its photos and videos need internet.', 'Use your own Kahoot session or the built-in backup quiz; the old PIN was removed.', '', '## Teaching notes', '']
for r in resources:
    notes += [f"### {r['title']}", r['description'], r['note'], f"Source: {r['source']}", '']
notes += ['## Budget', 'Historical estimates in USD, not receipt-verified spending or current prices.', *[f"{basis}: ${sum(r['totalCents'] for r in budget['rows'] if r['basis']==basis)/100:.2f}" for basis in ['Listed purchase','Frame estimate','Proposed addition']], 'Proposed additions are separate from the baseline.', 'See the CSV and website for price discrepancies and earlier-design allowances.', '', 'Public project: https://zacklinger.github.io/mrk-classroom/']
sequence = ['# Hydroponics teaching sequence', '', 'Adapted from the original 16-week unit plan. Flexible phases, not a fixed calendar.', '']
for n,p in enumerate(project['phases'],1):
    sequence += [f"## {n}. {p['title']}", p['scope'], '', p['description'], '', 'Activity: '+p['activity'], '', 'Evidence: '+p['evidence'], '']
with ZipFile(root / 'public/resources/classroom-hydroponics-resources.zip', 'w', ZIP_DEFLATED) as archive:
    for r in resources:
        file = root / 'public' / r['url'].removeprefix('./')
        archive.write(file, file.name)
    archive.write(root/'public/resources/hydroponics-cost-breakdown.csv','hydroponics-cost-breakdown.csv')
    archive.writestr('START-HERE.md','\n'.join(notes)+'\n')
    archive.writestr('TEACHING-SEQUENCE.md','\n'.join(sequence)+'\n')
print(f'Packaged {len(resources)} reviewed resources, budget, and teaching notes.')
