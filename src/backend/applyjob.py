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

def download_resume(url):
    """Download the resume from the signed URL"""
    response = requests.get(url)
    if response.status_code == 200:
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, "resume.docx")
        with open(file_path, 'wb') as f:
            f.write(response.content)
        return file_path
    raise Exception(f"Failed to download resume: {response.status_code}")

def extract_resume_info(resume_path):
    """Extract basic info from the resume DOCX"""
    doc = Document(resume_path)
    info = {
        "name": "",
        "email": "",
        "phone": "",
        "skills": []
    }

    for para in doc.paragraphs:
        text = para.text.strip()
        
        # Extract name (usually first line)
        if not info["name"] and text:
            info["name"] = text.split('\n')[0]
            
        # Extract email
        if "@" in text and "." in text and not info["email"]:
            for word in text.split():
                if "@" in word and "." in word:
                    info["email"] = word.strip()
                    break
                    
        # Extract phone
        if any(char.isdigit() for char in text) and not info["phone"]:
            digits = ''.join(filter(str.isdigit, text))
            if 10 <= len(digits) <= 15:
                info["phone"] = digits

    return info

def apply_to_job(job_link, resume_url, company, position):
    """Apply to a job using the customized resume"""
    options = Options()
    options.add_argument("--start-maximized")
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 20)

    try:
        # Step 1: Download and parse resume
        print("📥 Downloading customized resume...")
        resume_path = download_resume(resume_url)
        resume_info = extract_resume_info(resume_path)
        print(f"📝 Resume info: {resume_info}")

        # Step 2: Navigate to job application
        driver.get(job_link)
        print(f"🌐 Opened job: {position} at {company}")
        time.sleep(3)

        # Step 3: Handle "Apply Now" button if exists
        try:
            apply_btn = wait.until(EC.element_to_be_clickable(
                (By.XPATH, "//a[contains(., 'Apply Now') or contains(., 'Apply')]")))
            apply_btn.click()
            print("👉 Clicked 'Apply Now'")
            time.sleep(3)
            
            if len(driver.window_handles) > 1:
                driver.switch_to.window(driver.window_handles[-1])
                print("🔁 Switched to new tab")
        except Exception:
            print("ℹ No 'Apply Now' button found")

        # Step 4: Try to fill basic fields
        def try_fill_field(field_name, value):
            if not value:
                return False
                
            try:
                # Try different selectors
                selectors = [
                    f"input[placeholder*='{field_name}']",
                    f"input[name*='{field_name.lower()}']",
                    f"//label[contains(., '{field_name}')]/following-sibling::input"
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

        # Fill basic info
        try_fill_field("Name", resume_info["name"])
        try_fill_field("Email", resume_info["email"])
        try_fill_field("Phone", resume_info["phone"])
        try_fill_field("Company", company)
        try_fill_field("Position", position)

        # Step 5: Upload resume
        uploaded = False
        file_inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
        for file_input in file_inputs:
            try:
                file_input.send_keys(resume_path)
                print("📄 Resume uploaded")
                uploaded = True
                time.sleep(2)
                break
            except Exception as e:
                print(f"⚠ Upload attempt failed: {str(e)}")

        if not uploaded:
            print("❌ Could not upload resume")
            driver.save_screenshot("upload_failed.png")

        # Step 6: Submit application
        try:
            submit_btn = wait.until(EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(., 'Submit') or contains(., 'Apply')]")))
            submit_btn.click()
            print("✅ Application submitted")
            time.sleep(3)
            driver.save_screenshot("submitted.png")
        except Exception:
            print("⚠ Could not submit application")
            driver.save_screenshot("submit_failed.png")

    except Exception as e:
        print(f"🚨 Error: {str(e)}")
        driver.save_screenshot("error.png")
    finally:
        driver.quit()
        try:
            os.remove(resume_path)
        except:
            pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--job-link', required=True, help='Job application URL')
    parser.add_argument('--resume-url', required=True, help='Signed URL for customized resume')
    parser.add_argument('--company', required=True, help='Company name')
    parser.add_argument('--position', required=True, help='Job position')
    
    args = parser.parse_args()
    
    print(f"\n🚀 Starting application for {args.position} at {args.company}")
    apply_to_job(args.job_link, args.resume_url, args.company, args.position)
    print("🎉 Application process completed")