# src/backend/main.py
import time
import logging
from extract_skills import main as extract_skills_main
from match_jobs import find_and_store_jobs as match_jobs_main
from customize_resumes import process_resumes as customized_resume_main

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def main():
    try:
        # Step 1: Extract skills
        logging.info("Starting skill extraction...")
        extract_skills_main()
        
        # Step 2: Match jobs
        logging.info("Starting job matching...")
        match_jobs_main()
        
        # Step 3: Customize resumes
        logging.info("Starting resume customization...")
        customized_resume_main()
        
        logging.info("All processes completed successfully")
        
    except Exception as e:
        logging.error(f"Process failed: {e}")
        raise

if __name__ == "__main__":
    main()