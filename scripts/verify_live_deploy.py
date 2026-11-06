import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\adhar\.gemini\antigravity\brain\870f8ac9-5392-4bfe-99e1-cfc1e8a0a7e9"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

LIVE_URL = "https://adaptive-self-healing-framework-for.vercel.app/"

def main():
    print(f"Connecting to live production deployment: {LIVE_URL}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))

        resp = page.goto(LIVE_URL, wait_until="networkidle")
        status_code = resp.status if resp else "Unknown"
        print(f"Live site HTTP status: {status_code}")
        time.sleep(1.5)

        # Check for client-side crash text
        body_text = page.locator("body").inner_text()
        if "Application error: a client-side exception has occurred" in body_text:
            print("ERROR: Application error text found on initial page load!")
            page.screenshot(path=os.path.join(ARTIFACT_DIR, "live_deploy_error_initial.png"))
            return False

        print("Initial page loaded cleanly without exceptions.")
        
        # Click on 'Launch Live Lab'
        lab_button = page.locator("button:has-text('Launch Live Lab')").first
        if not lab_button.is_visible():
            # Try hero button
            lab_button = page.locator("button:has-text('Launch Interactive Lab')").first
        
        if lab_button.is_visible():
            print("Clicking Launch Live Lab button in Header...")
            lab_button.click()
            time.sleep(2.0)
        else:
            print("ERROR: Launch Live Lab button not found!")
            return False

        # Confirm we are in dashboard view
        return_button = page.locator("button:has-text('Return to Overview')").first
        if return_button.is_visible():
            print("Dashboard view active: 'Return to Overview' button detected.")
        else:
            print("WARNING: 'Return to Overview' button not visible.")

        # Ensure Six-Arm Repair Matrix is visible
        matrix_header = page.locator("text=Six-Arm Adaptive Repair Matrix").first
        if matrix_header.is_visible():
            print("Six-Arm Adaptive Repair Matrix found.")
            matrix_header.scroll_into_view_if_needed()
            time.sleep(1.0)
        else:
            print("ERROR: Six-Arm Adaptive Repair Matrix not found in dashboard!")
            page.screenshot(path=os.path.join(ARTIFACT_DIR, "live_dashboard_missing_matrix.png"))
            return False

        # Take screenshot of the Matrix before clicking deploy
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "live_dashboard_matrix_before_deploy.png"))

        # Find Deploy buttons in the Six-Arm Matrix
        deploy_buttons = page.locator("button:has-text('Deploy')")
        count = deploy_buttons.count()
        print(f"Found {count} Deploy buttons in Six-Arm Matrix.")

        if count == 0:
            print("ERROR: No Deploy buttons found in Six-Arm Matrix!")
            return False

        # Click the first enabled Deploy button (ARM 01 Change Optimizer)
        first_btn = deploy_buttons.first
        print(f"Clicking first Deploy button (ARM 01)...")
        first_btn.click()
        time.sleep(2.0)

        body_text_after = page.locator("body").inner_text()
        if "Application error: a client-side exception has occurred" in body_text_after:
            print("CRITICAL DEFECT: Application error occurred upon clicking Deploy!")
            page.screenshot(path=os.path.join(ARTIFACT_DIR, "live_deploy_error_after_click.png"))
            return False

        print("SUCCESS: Deploy button clicked without client-side exception!")

        screenshot_path = os.path.join(ARTIFACT_DIR, "live_production_post_deploy_verified.png")
        page.screenshot(path=screenshot_path, full_page=False)
        print(f"Saved verification screenshot to: {screenshot_path}")

        # Check console errors
        print(f"Console errors during session: {len(console_errors)}")
        for err in console_errors:
            print(f"  - {err}")

        browser.close()
        return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
