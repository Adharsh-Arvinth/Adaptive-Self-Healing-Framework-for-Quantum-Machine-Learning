import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\adhar\Desktop\capstone\artifacts"
# also write to the conversation artifact directory
CONV_ARTIFACT_DIR = r"C:\Users\adhar\.gemini\antigravity\brain\870f8ac9-5392-4bfe-99e1-cfc1e8a0a7e9"
os.makedirs(ARTIFACT_DIR, exist_ok=True)
os.makedirs(CONV_ARTIFACT_DIR, exist_ok=True)

LIVE_URL = "https://adaptive-self-healing-framework-for.vercel.app/"

VIEWPORTS = [
    ("large_desktop", 1920, 1080),
    ("desktop", 1440, 900),
    ("laptop", 1366, 768),
    ("tablet_landscape", 1024, 768),
    ("tablet_portrait", 768, 1024),
    ("large_mobile", 430, 932),
    ("standard_mobile", 390, 844),
    ("small_mobile", 360, 800),
]

def save_both(page, filename, full_page=False):
    p1 = os.path.join(ARTIFACT_DIR, filename)
    p2 = os.path.join(CONV_ARTIFACT_DIR, filename)
    page.screenshot(path=p1, full_page=full_page)
    page.screenshot(path=p2, full_page=full_page)
    print(f"  [SCREENSHOT SAVED]: {filename}")

def main():
    print("=" * 70)
    print("COMPREHENSIVE STORY REDESIGN PLAYWRIGHT AUDIT & VERIFICATION")
    print(f"Target URL: {LIVE_URL}")
    print("=" * 70)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # PART 1: DESKTOP STORYTELLING EXPERIENCE (1440 x 900)
        # -------------------------------------------------------------
        print("\n[PART 1] Auditing Desktop Storytelling Experience...")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(str(e)))

        # Add cache buster query parameter to guarantee fetching the freshest edge build
        fresh_url = f"{LIVE_URL}?cb={int(time.time())}"
        resp = page.goto(fresh_url, wait_until="networkidle")
        time.sleep(2)

        # Check Headline
        hero_h1 = page.locator("h1").inner_text()
        clean_h1 = " ".join(hero_h1.split()).upper()
        print(f"Hero H1 (normalized): '{clean_h1}'")
        assert "QUANTUM MODELS FAIL" in clean_h1, f"H1 did not contain expected headline: {clean_h1}"
        assert "INTELLIGENCE RECOVERS" in clean_h1, f"H1 did not contain expected headline: {clean_h1}"

        # 1. Desktop Hero Screenshot
        save_both(page, "desktop_hero_cinematic.png")

        # Scroll down to Chapter 1 & 2
        challenge_el = page.locator("#the-challenge")
        if challenge_el.count() > 0:
            challenge_el.scroll_into_view_if_needed()
            time.sleep(1)
            # Try triggering failure simulation
            sim_btn = page.locator("button:has-text('Run Failure Simulation')").first
            if sim_btn.is_visible():
                print("Triggering interactive failure simulation...")
                sim_btn.click()
                time.sleep(1.5)

        # 2. Desktop Storytelling Sections Screenshot
        save_both(page, "desktop_storytelling_chapters.png")

        # Scroll to Chapter 4 (Repair Mechanisms)
        repair_el = page.locator("#repair-mechanisms")
        if repair_el.count() > 0:
            repair_el.scroll_into_view_if_needed()
            time.sleep(1)
            save_both(page, "desktop_repair_mechanisms.png")

        # Scroll to Chapter 7 & 8 (Evidence & Limitations)
        research_el = page.locator("#research")
        if research_el.count() > 0:
            research_el.scroll_into_view_if_needed()
            time.sleep(1)
            save_both(page, "desktop_evidence_limitations.png")

        # -------------------------------------------------------------
        # PART 2: RESEARCH LABORATORY & SIX-ARM REPAIR MATRIX
        # -------------------------------------------------------------
        print("\n[PART 2] Auditing Interactive Research Laboratory...")
        lab_btn = page.locator("button:has-text('Enter Research Lab')").first
        if not lab_btn.is_visible():
            lab_btn = page.locator("button:has-text('Launch Live Lab')").first
        assert lab_btn.is_visible(), "Research Lab button not found in header/hero!"
        print("Clicking Enter Research Lab...")
        lab_btn.click()
        time.sleep(2)

        # Confirm lab view active
        return_btn = page.locator("button:has-text('Return to Story'), button:has-text('Return to Overview')").first
        assert return_btn.is_visible(), "Research Lab view failed to open!"
        print("Research Lab view active.")

        # 3. Research Laboratory Screenshot
        save_both(page, "research_laboratory_overview.png")

        # Scroll to Six-Arm Matrix
        matrix_header = page.locator("text=Six-Arm Adaptive Repair Matrix").first
        assert matrix_header.is_visible(), "Six-Arm Repair Matrix not visible in lab!"
        matrix_header.scroll_into_view_if_needed()
        time.sleep(1)

        # 4. Repair Matrix Screenshot
        save_both(page, "six_arm_repair_matrix.png")

        # Test Deploy on ARM 01 (Change Optimizer)
        deploy_btn = page.locator("button:has-text('Deploy')").first
        assert deploy_btn.is_enabled(), "First deploy button is not enabled!"
        print("Clicking Deploy on ARM 01...")
        deploy_btn.click()
        time.sleep(2)

        # Verify no client-side error
        body_text = page.locator("body").inner_text()
        assert "Application error: a client-side exception has occurred" not in body_text, "CRITICAL: Client-side exception occurred on Deploy!"
        print("Deploy button executed cleanly without client-side exceptions!")

        # 5. Notification / Toast Example Screenshot
        save_both(page, "notification_toast_verified.png")

        context.close()

        # -------------------------------------------------------------
        # PART 3: TABLET & MOBILE VIEWPORT AUDITS & SCREENSHOTS
        # -------------------------------------------------------------
        print("\n[PART 3] Auditing Tablet & Mobile Viewports...")
        
        # Tablet Portrait (768 x 1024)
        ctx_tab = browser.new_context(viewport={"width": 768, "height": 1024})
        pg_tab = ctx_tab.new_page()
        pg_tab.goto(fresh_url, wait_until="networkidle")
        time.sleep(1.5)
        # 6. Tablet View Screenshot
        save_both(pg_tab, "tablet_view_768x1024.png")
        ctx_tab.close()

        # Standard Mobile (390 x 844)
        ctx_mob = browser.new_context(viewport={"width": 390, "height": 844})
        pg_mob = ctx_mob.new_page()
        pg_mob.goto(fresh_url, wait_until="networkidle")
        time.sleep(1.5)
        # 7. Mobile View Screenshot
        save_both(pg_mob, "mobile_view_390x844.png")
        ctx_mob.close()

        # -------------------------------------------------------------
        # PART 4: 8-VIEWPORT RESPONSIVE AUDIT FOR ZERO OVERFLOW
        # -------------------------------------------------------------
        print("\n[PART 4] Auditing all 8 Responsive Viewports for Zero Horizontal Overflow...")
        for name, w, h in VIEWPORTS:
            ctx = browser.new_context(viewport={"width": w, "height": h})
            pg = ctx.new_page()
            pg.goto(fresh_url, wait_until="networkidle")
            time.sleep(1)

            scroll_w = pg.evaluate("() => document.documentElement.scrollWidth")
            inner_w = pg.evaluate("() => window.innerWidth")
            has_overflow = scroll_w > inner_w

            shot_file = f"viewport_{name}_{w}x{h}.png"
            save_both(pg, shot_file)

            status = "PASS (Zero Overflow)" if not has_overflow else f"FAIL (scrollWidth {scroll_w} > innerWidth {inner_w})"
            print(f"  * {name:<18} ({w}x{h}): {status}")
            assert not has_overflow, f"Horizontal overflow detected on viewport {name} ({w}x{h})!"
            ctx.close()

        browser.close()

    print("\n" + "=" * 70)
    print("ALL AUDIT PHASES COMPLETED WITH ZERO ERRORS!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nAUDIT FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
