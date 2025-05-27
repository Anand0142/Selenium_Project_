import json
import os
import time
import argparse
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from docx import Document
import tempfile
from supabase import create_client
import threading
from concurrent.futures import ThreadPoolExecutor
import queue
from selenium.common.exceptions import NoSuchElementException, TimeoutException

# Configuration
SUPABASE_URL = "https://vjmlbzcssyywmeapaxds.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbWxiemNzc3l5d21lYXBheGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5ODMzNDUsImV4cCI6MjA2MDU1OTM0NX0.dHdMxjhT9MjRDVpzoIiOo6zD23iF45YIZH9iACD4ZwY"

# LinkedIn credentials
LINKEDIN_EMAIL = "23215A6704@bvrit.ac.in"
LINKEDIN_PASSWORD = "Anand 0608"

# External website credentials
EXTERNAL_EMAIL = "kammarianand20@gmail.com"
EXTERNAL_PASSWORD = "Anand 0142"

# Indeed credentials
INDEED_EMAIL = "kammarianand20@gmailcom"
INDEED_PASSWORD = "Anand 0142"

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create a queue for thread-safe printing
print_queue = queue.Queue()

def take_debug_screenshot(driver, name):
    """Take a screenshot and save it with timestamp"""
    try:
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        filename = f"debug_screenshots/{name}_{timestamp}.png"
        os.makedirs("debug_screenshots", exist_ok=True)
        driver.save_screenshot(filename)
        print(f"Debug screenshot saved: {filename}")
    except Exception as e:
        print(f"Failed to take debug screenshot: {str(e)}")

def thread_safe_print(*args, **kwargs):
    """Thread-safe printing function"""
    print_queue.put((' '.join(map(str, args)), kwargs))

def print_worker():
    """Worker function to handle thread-safe printing"""
    while True:
        try:
            message, kwargs = print_queue.get()
            print(message, **kwargs)
            print_queue.task_done()
        except Exception:
            break

def fetch_job_details():
    """Fetch all job details from the 'jobs' table in Supabase"""
    try:
        res = supabase.table('jobs').select('*').execute()
        if res.data:
            jobs = []
            for job in res.data:
                required_fields = ['job_link', 'resume_id', 'company', 'title', 'user_id']
                missing_fields = [field for field in required_fields if not job.get(field)]
                if not missing_fields:
                    jobs.append(job)
                else:
                    print(f"⚠ Skipping job {job.get('id')} - Missing required fields: {', '.join(missing_fields)}")
            return jobs
        else:
            raise Exception("No job details found in the 'jobs' table.")
    except Exception as e:
        print(f"Error fetching job details: {e}")
        return None

def download_customized_resume(resume_id, job_id):
    """Download the customized resume from Supabase storage bucket 'customizedresumes' using resume_id and job_id"""
    try:
        file_path = f"enhanced_{resume_id}_{job_id}.docx"
        file_content = supabase.storage.from_('customizedresumes').download(file_path)
        temp_dir = tempfile.gettempdir()
        local_path = os.path.join(temp_dir, f"enhanced_{resume_id}_{job_id}.docx")
        with open(local_path, 'wb') as f:
            f.write(file_content)
        return local_path
    except Exception as e:
        if "not found" in str(e).lower():
            print(f"Resume file not found for resume_id={resume_id}, job_id={job_id}. Please generate customized resumes first.")
        else:
            print(f"Failed to download customized resume: {e}")

def extract_resume_info(resume_path):
    """
    Extract comprehensive information from the resume.
    Fields: name, email, phone, address, education, experience, skills
    If a field is not found, leave it as an empty string.
    """
    doc = Document(resume_path)
    info = {
        "name": "",
        "email": "",
        "phone": "",
        "address": "",
        "education": "",
        "experience": "",
        "skills": "",
        "linkedin": "",
        "website": ""
    }

    current_section = None
    section_text = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        
        # Name: Assume first non-empty line is the name if not already set
        if not info["name"] and text:
            info["name"] = text
            continue
            
        # Email: Look for an email pattern
        if not info["email"] and "@" in text and "." in text:
            for word in text.split():
                if "@" in word and "." in word:
                    info["email"] = word.strip()
                    break
                    
        # Phone: Look for a sequence of 10-15 digits
        if not info["phone"]:
            digits = ''.join(filter(str.isdigit, text))
            if 10 <= len(digits) <= 15:
                info["phone"] = digits

        # LinkedIn: Look for LinkedIn URL
        if not info["linkedin"] and "linkedin.com" in text.lower():
            info["linkedin"] = text.strip()

        # Website: Look for website URL
        if not info["website"] and ("http://" in text.lower() or "https://" in text.lower()):
            info["website"] = text.strip()

        # Section detection
        lower_text = text.lower()
        if "education" in lower_text:
            current_section = "education"
            section_text = []
        elif "experience" in lower_text or "work" in lower_text:
            current_section = "experience"
            section_text = []
        elif "skills" in lower_text:
            current_section = "skills"
            section_text = []
        elif current_section:
            section_text.append(text)
            info[current_section] = "\n".join(section_text)

    return info

def try_fill_field(driver, field_name, value, field_type="text"):
    """Try to fill a form field with the given value"""
    if not value:
        return False
    try:
        selectors = [
            f"input[placeholder*='{field_name}']",
            f"input[name*='{field_name.lower()}']",
            f"//label[contains(., '{field_name}')]/following-sibling::input",
            f"//label[contains(., '{field_name}')]/following-sibling::textarea",
            f"textarea[placeholder*='{field_name}']",
            f"textarea[name*='{field_name.lower()}']"
        ]
        
        for selector in selectors:
            try:
                if selector.startswith("//"):
                    element = driver.find_element(By.XPATH, selector)
                else:
                    element = driver.find_element(By.CSS_SELECTOR, selector)
                element.clear()
                element.send_keys(value)
                print(f"  ✓ Filled {field_name}")
                return True
            except:
                continue
        return False
    except Exception as e:
        print(f"  ✗ Error filling {field_name}: {str(e)}")
        return False

def linkedin_login(driver, email, password):
    driver.get("https://www.linkedin.com/login")
    time.sleep(2)
    email_input = driver.find_element(By.ID, "username")
    password_input = driver.find_element(By.ID, "password")
    email_input.clear()
    email_input.send_keys(email)
    password_input.clear()
    password_input.send_keys(password)
    driver.find_element(By.XPATH, "//button[@type='submit']").click()
    time.sleep(3)

def check_login_status(driver):
    try:
        # Check for common elements that indicate we're logged in
        if "linkedin.com" in driver.current_url:
            # Look for elements that only appear when logged in
            logged_in_elements = [
                "//div[contains(@class, 'global-nav__me-photo')]",
                "//div[contains(@class, 'global-nav__me-menu')]",
                "//div[contains(@class, 'global-nav__me')]"
            ]
            for selector in logged_in_elements:
                try:
                    element = driver.find_element(By.XPATH, selector)
                    if element.is_displayed():
                        return True
                except:
                    continue
            return False
        else:
            # Add Indeed-specific checks here
            return True
    except:
        return False

def handle_external_website(driver, company):
    """Handle application on external company websites"""
    try:
        print(f"Detected external website for {company}")
        take_debug_screenshot(driver, f"external_website_{company}")
        
        # Common login form selectors
        login_selectors = [
            "//input[@type='email']",
            "//input[@name='email']",
            "//input[@id='email']",
            "//input[contains(@placeholder, 'Email')]",
            "//input[contains(@placeholder, 'email')]",
            "//input[contains(@class, 'email')]"
        ]
        
        password_selectors = [
            "//input[@type='password']",
            "//input[@name='password']",
            "//input[@id='password']",
            "//input[contains(@placeholder, 'Password')]",
            "//input[contains(@placeholder, 'password')]",
            "//input[contains(@class, 'password')]"
        ]
        
        # Try to find and fill login form
        for email_selector in login_selectors:
            try:
                email_input = driver.find_element(By.XPATH, email_selector)
                email_input.clear()
                email_input.send_keys(EXTERNAL_EMAIL)
                print("Found and filled email field")
                break
            except:
                continue
                
        for password_selector in password_selectors:
            try:
                password_input = driver.find_element(By.XPATH, password_selector)
                password_input.clear()
                password_input.send_keys(EXTERNAL_PASSWORD)
                print("Found and filled password field")
                break
            except:
                continue
        
        # Try to find and click login button
        login_button_selectors = [
            "//button[contains(., 'Login')]",
            "//button[contains(., 'Sign in')]",
            "//button[@type='submit']",
            "//input[@type='submit']",
            "//button[contains(@class, 'login')]",
            "//button[contains(@class, 'signin')]"
        ]
        
        for selector in login_button_selectors:
            try:
                login_button = driver.find_element(By.XPATH, selector)
                login_button.click()
                print("Clicked login button")
                time.sleep(2)
                break
            except:
                continue
                
        # Check if we need to create an account
        create_account_selectors = [
            "//a[contains(., 'Create Account')]",
            "//a[contains(., 'Sign up')]",
            "//button[contains(., 'Create Account')]",
            "//button[contains(., 'Sign up')]"
        ]
        
        for selector in create_account_selectors:
            try:
                create_account = driver.find_element(By.XPATH, selector)
                create_account.click()
                print("Clicked create account button")
                time.sleep(2)
                break
            except:
                continue
                
        return True
    except Exception as e:
        print(f"Error handling external website: {str(e)}")
        return False

def apply_to_job(job_link, resume_path, company, title):
    # Enhanced Chrome options
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-logging")
    options.add_argument("--log-level=3")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-popup-blocking")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-third-party-cookies")
    options.add_argument("--disable-web-security")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    # Add experimental options to suppress console messages
    options.add_experimental_option('excludeSwitches', ['enable-logging'])
    options.add_experimental_option('excludeSwitches', ['enable-automation'])
    options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)  # Reduced wait time from 20 to 10 seconds
    uploaded = False

    try:
        # Login if needed
        if "linkedin.com" in job_link.lower():
            linkedin_login(driver, LINKEDIN_EMAIL, LINKEDIN_PASSWORD)
            if not check_login_status(driver):
                print("WARNING: Login may have failed!")
                driver.save_screenshot("error_screenshots/login_failed.png")
                return False
            print("Successfully logged in to LinkedIn.")

        driver.get(job_link)
        time.sleep(2)  # Reduced from 3 to 2 seconds
        
        # Check if redirected to external website
        current_url = driver.current_url
        if "linkedin.com" not in current_url.lower():
            print(f"Redirected to external website: {current_url}")
            if handle_external_website(driver, company):
                print("Successfully handled external website")
            else:
                print("Failed to handle external website")
            return True

        # Take screenshot before attempting to find button
        take_debug_screenshot(driver, f"{company}_{title}_before_click")

        # Optimized button selectors for LinkedIn
        linkedin_button_selectors = [
            "//button[contains(@class, 'jobs-apply-button')]",
            "//button[contains(., 'Easy Apply')]",
            "//button[contains(., 'Apply')]",
            "//div[contains(@class, 'jobs-apply-button')]//button"
        ]

        # Try to find and click the apply button
        button_found = False
        print(f"\nTrying to find Apply button on LinkedIn...")
        
        for selector in linkedin_button_selectors:
            try:
                print(f"Trying selector: {selector}")
                button = wait.until(EC.element_to_be_clickable((By.XPATH, selector)))
                print(f"Found button with selector: {selector}")
                
                # Scroll button into view
                driver.execute_script("arguments[0].scrollIntoView(true);", button)
                time.sleep(0.5)  # Reduced from 1 to 0.5 seconds
                
                # Try JavaScript click first (faster)
                try:
                    driver.execute_script("arguments[0].click();", button)
                    print("JavaScript click successful")
                except:
                    button.click()
                    print("Regular click successful")
                
                button_found = True
                print("Successfully clicked Apply button!")
                take_debug_screenshot(driver, "after_button_click")
                break
            except Exception as e:
                print(f"Selector {selector} failed: {str(e)}")
                continue

        if not button_found:
            print("\nERROR: Could not find Apply button!")
            print("Current URL:", driver.current_url)
            return False

        # 2. Upload resume if file input is present
        try:
            file_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='file']")))
            file_input.send_keys(resume_path)
            print("Resume uploaded.")
            uploaded = True
            time.sleep(2)
        except Exception:
            print("No file input for resume upload found.")

        # 3. Extract info from resume
        resume_info = extract_resume_info(resume_path)
        # Example: resume_info = {"name": ..., "email": ..., "phone": ..., ...}

        # 4. Try to fill common fields (leave blank if not in resume)
        fields_to_fill = {
            "Name": resume_info.get("name", ""),
            "Email": resume_info.get("email", ""),
            "Phone": resume_info.get("phone", ""),
            "Company": company,
            "Position": title,
            "LinkedIn": resume_info.get("linkedin", ""),
            "Website": resume_info.get("website", ""),
            "Education": resume_info.get("education", ""),
            "Experience": resume_info.get("experience", ""),
            "Skills": resume_info.get("skills", "")
        }

        for field, value in fields_to_fill.items():
            if not value:
                continue  # Leave blank if not available
            # Try to fill by placeholder, name, or label
            selectors = [
                f"//input[contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{field.lower()}')]",
                f"//input[contains(translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{field.lower()}')]",
                f"//textarea[contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{field.lower()}')]",
                f"//textarea[contains(translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{field.lower()}')]"
            ]
            for selector in selectors:
                try:
                    elem = driver.find_element(By.XPATH, selector)
                    elem.clear()
                    elem.send_keys(value)
                    print(f"Filled {field}")
                    break
                except NoSuchElementException:
                    continue

        # 5. Try to submit the application
        submit_xpaths = [
            "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'submit')]",
            "//button[@type='submit']",
            "//input[@type='submit']"
        ]
        for xpath in submit_xpaths:
            try:
                submit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
                driver.execute_script("arguments[0].scrollIntoView(true);", submit_btn)
                time.sleep(1)
                driver.execute_script("arguments[0].click();", submit_btn)
                print("Application submitted.")
                break
            except Exception:
                continue

        print("Automation complete. If any fields are missing, user can fill them manually.")

    except Exception as e:
        print(f"\nERROR in apply_to_job: {str(e)}")
        print(f"Job Link: {job_link}")
        print(f"Company: {company}")
        print(f"Title: {title}")
        
        # Take error screenshot
        error_screenshot = f"error_screenshots/{company}_{title}_error.png"
        os.makedirs("error_screenshots", exist_ok=True)
        driver.save_screenshot(error_screenshot)
        print(f"Saved error screenshot to {error_screenshot}")
        
        return False
    finally:
        driver.quit()

def process_single_job(job):
    """Process a single job application"""
    job_id = job.get('id')
    resume_id = job.get('resume_id')
    job_link = job.get('job_link')
    company = job.get('company')
    title = job.get('title')
    
    thread_safe_print(f"\n📋 Processing job {job_id}: {title} at {company}")
    try:
        resume_path = download_customized_resume(resume_id, job_id)
        apply_to_job(job_link, resume_path, company, title)
        thread_safe_print(f"✅ Completed application for {title} at {company}")
        
    except Exception as e:
        thread_safe_print(f"❌ Failed to process job {job_id}: {e}")

if __name__ == "__main__":
    # Start the print worker thread
    print_thread = threading.Thread(target=print_worker, daemon=True)
    print_thread.start()
    
    jobs = fetch_job_details()
    if jobs:
        thread_safe_print(f"\n🚀 Found {len(jobs)} jobs to process")
        
        # Process jobs in parallel using ThreadPoolExecutor
        max_workers = min(5, len(jobs))  # Limit to 5 concurrent jobs or less
        thread_safe_print(f"🔄 Processing {max_workers} jobs simultaneously")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all jobs to the thread pool
            futures = [executor.submit(process_single_job, job) for job in jobs]
            
            # Wait for all jobs to complete
            for future in futures:
                try:
                    future.result()
                except Exception as e:
                    thread_safe_print(f"❌ Error in job processing: {e}")
        
        thread_safe_print("\n🎉 Finished processing all jobs")
    else:
        thread_safe_print("❌ Failed to fetch job details from the 'jobs' table.")
    
    # Wait for all print messages to be processed
    print_queue.join()