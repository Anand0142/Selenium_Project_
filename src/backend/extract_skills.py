# extract_skills.py
import io
import os
import tempfile
from supabase import create_client
from pdfminer.high_level import extract_text
from docx import Document
import spacy
from spacy.matcher import PhraseMatcher
import logging

# Initialize with your credentials
supabase = create_client(
    "https://vjmlbzcssyywmeapaxds.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbWxiemNzc3l5d21lYXBheGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5ODMzNDUsImV4cCI6MjA2MDU1OTM0NX0.dHdMxjhT9MjRDVpzoIiOo6zD23iF45YIZH9iACD4ZwY"
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Load NLP model
nlp = spacy.load("en_core_web_sm")

# ✅ Known skills list
KNOWN_SKILLS = {
    "python", "java", "c", "c++", "c#", "html", "css", "javascript", "sql", "php",
    "django", "flask", "react", "git", "github", "figma", "data structures", "htl,css",
    "machine learning", "deep learning", "nlp", "natural language processing",
    "data science", "google cloud platform", "visual studio code", "object oriented programming",
    "json", "xml", "mysql", "mongodb", "tensorflow", "keras", "numpy", "pandas",
    "matplotlib", "bootstrap", ".net", "artificial intelligence"
}

# ❌ Skills to ignore
IGNORE_LIST = {
    "internship", "project", "certification", "leadership", "communication",
    "teamwork", "time management", "dedication", "hardworking", "self-motivated",
    "effective communication", "soft skills", "projects", "languages", "personal info"
}

# ✅ Skill normalization map
REPLACEMENTS = {
    "react js": "react",
    "reactjs": "react",
    "html,css": "html",
    "js": "javascript",
    "ml": "machine learning",
    "ai": "artificial intelligence"
}

# Initialize skill matcher using unique known skills
tech_skills = sorted(set([
    "Python", "JavaScript", "Java", "SQL", "AWS", "Docker", 
    "React", "Machine Learning", "Data Analysis", "Git",
    "TensorFlow", "PyTorch", "Flask", "Django", "Node.js"
 ]).union(KNOWN_SKILLS), key=str.lower)

matcher = PhraseMatcher(nlp.vocab)
patterns = [nlp(skill) for skill in tech_skills]
matcher.add("TECH_SKILLS", patterns)

def fetch_unprocessed_resumes():
    """Fetch resumes that need processing"""
    try:
        res = supabase.table('resumes') \
               .select('*') \
               .eq('processed', False) \
               .execute()
        return res.data
    except Exception as e:
        logging.error(f"Error fetching resumes: {e}")
        return []

def extract_skills(text):
    """Extract all skills from resume text"""
    doc = nlp(text)
    skills = set()

    # 1. Match technical skills
    matches = matcher(doc)
    for _, start, end in matches:
        matched_text = doc[start:end].text.lower().strip()
        # Apply normalization
        normalized = REPLACEMENTS.get(matched_text, matched_text)
        if normalized in KNOWN_SKILLS and normalized not in IGNORE_LIST:
            skills.add(normalized)

    # 2. Extract proper nouns in technical contexts
    for token in doc:
        if (token.pos_ == "PROPN" and 
            any(child.dep_ in ("dobj", "pobj") for child in token.children)):
            token_text = token.text.lower().strip()
            normalized = REPLACEMENTS.get(token_text, token_text)
            if normalized in KNOWN_SKILLS and normalized not in IGNORE_LIST:
                skills.add(normalized)

    return list(skills)

def process_resume(resume):
    """Process a single resume"""
    try:
        with tempfile.NamedTemporaryFile(suffix=f".{resume['file_type']}", delete=False) as tmp:
            # Download file
            file_content = supabase.storage \
                           .from_('resumes') \
                           .download(resume['file_path'])
            tmp.write(file_content)
            tmp_path = tmp.name

        # Extract text
        if resume['file_type'] == 'pdf':
            text = extract_text(tmp_path)
        else:
            doc = Document(tmp_path)
            text = '\n'.join([para.text for para in doc.paragraphs])

        # Get all skills
        skills = extract_skills(text)
        logging.info(f"Extracted skills for {resume['file_name']}: {skills}")

        # Store skills in NEW table (recommended approach)
        supabase.table('resume_skills').insert({
            'resume_id': resume['id'],
            'user_id': resume['user_id'],
            'skills': skills
        }).execute()

        # Mark as processed (without trying to update skills column)
        supabase.table('resumes').update({
            'processed': True,
            'processing_result': {
                'status': 'completed',
                'skills_count': len(skills)
            }
        }).eq('id', resume['id']).execute()

        return True

    except Exception as e:
        logging.error(f"Error processing {resume['file_name']}: {e}")
        supabase.table('resumes').update({
            'processing_result': {'error': str(e)}
        }).eq('id', resume['id']).execute()
        return False
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)

def main():
    """Process all unprocessed resumes"""
    logging.info("Starting resume processing")
    resumes = fetch_unprocessed_resumes()

    if not resumes:
        logging.info("No resumes to process")
        return

    success = 0
    for resume in resumes:
        if process_resume(resume):
            success += 1

    logging.info(f"Processed {success}/{len(resumes)} resumes successfully")

if __name__ == "__main__":
    main()
