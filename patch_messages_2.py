import json

def update_json(filepath):
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    if filepath.endswith('en.json'):
        data['Admin']['reason'] = "Reason:"
        data['Admin']['pageOf'] = "Page {page} of {totalPages}"
        data['Admin']['previous'] = "Previous"
        data['Admin']['next'] = "Next"
    else:
        data['Admin']['reason'] = "कारण:"
        data['Admin']['pageOf'] = "पृष्ठ {page} / {totalPages}"
        data['Admin']['previous'] = "अघिल्लो"
        data['Admin']['next'] = "अर्को"

    with open(filepath, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

update_json('messages/en.json')
update_json('messages/ne.json')
