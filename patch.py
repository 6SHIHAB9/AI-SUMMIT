import os
import uuid
import shutil

with open('backend/main.py', 'r') as f:
    content = f.read()

upload_code = """
UPLOAD_DIR = 'uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount('/uploads', StaticFiles(directory=UPLOAD_DIR), name='uploads')

@app.post('/upload')
def upload_file(file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if ext not in ['png', 'jpg', 'jpeg', 'webp']:
        raise HTTPException(status_code=400, detail='Unsupported file type. Only PNG, JPG, JPEG, WEBP are allowed.')
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {'filename': unique_filename}

"""

if '@app.post("/upload")' not in content and "@app.post('/upload')" not in content:
    content = content.replace('@app.post("/tickets",', upload_code + '@app.post("/tickets",')
    with open('backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
