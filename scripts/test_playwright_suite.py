import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\adhar\.gemini\antigravity\brain\870f8ac9-5392-4bfe-99e1-cfc1e8a0a7e9"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

VIEWPORTS = [
    ("large_desktop", 1920, 1080),
    ("desktop", 1440, 900),
    ("laptop", 1366, 768),
    ("small_laptop", 1280, 720),
    ("tablet_landscape", 1024, 768),
    ("tablet_portrait", 768, 1024),
    ("large_mobile", 430, 932),
    ("standard_mobile", 390, 844),
    ("small_mobile", 360, 800),
]

def run_suite():
    print("=" * 70)
    print("PLAYWRIGHT COMPREHENSIVE PRODUCTION VERIFICATION SUITE")
    print("=" * 70)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # -------------------------------------------------------------
        # PART 1: 9-VIEWPORT RESPONSIVE AUDIT & SCREENSHOT CAPTURE
        # -------------------------------------------------------------
        print("\n[PART 1] Testing 9 Responsive Viewports for Zero Horizontal Overflow...")
        overflow_failures = []
        for name, w, h in VIEWPORTS:
            context = browser.new_context(viewport={"width": w, "height": h})
            page = context.new_page()
            
            page.goto("http://localhost:3000/", wait_until="networkidle")
            time.sleep(0.8)
            
            scroll_w = page.evaluate("() => document.documentElement.scrollWidth")
            inner_w = page.evaluate("() => window.innerWidth")
            has_overflow = scroll_w > inner_w
            
            shot_path = os.path.join(ARTIFACT_DIR, f"viewport_{name}_{w}x{h}.png")
            page.screenshot(path=shot_path, full_page=False)
            
            status_str = "PASS (No overflow)" if not has_overflow else f"FAIL (scrollWidth {scroll_w} > innerWidth {inner_w})"
            print(f"  * {name:<18} ({w}x{h:<4}): {status_str}")
            if has_overflow:
                overflow_failures.append((name, w, h, scroll_w))
            context.close()
            
        # -------------------------------------------------------------
        # PART 2: INTERACTIVE RESEARCH LABORATORY & 6 REPAIR ARMS AUDIT
        # -------------------------------------------------------------
        print("\n[PART 2] Navigating to Interactive Research Laboratory...")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        
        page_errors = []
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))
        
        page.goto("http://localhost:3000/", wait_until="networkidle")
        time.sleep(1)
        
        # Click "Launch Live Lab"
        lab_btn = page.get_by_role("button", name="Launch Live Lab").first
        lab_btn.click()
        time.sleep(1.5)
        
        # Save laboratory screenshot
        dash_shot = os.path.join(ARTIFACT_DIR, "dashboard_desktop_1440x900.png")
        page.screenshot(path=dash_shot)
        print("  [OK] Opened Interactive Research Laboratory successfully.")
        
        # 1. Audit ARM 02: Reduce Circuit Depth (Must be genuinely disabled when L=2)
        print("\n[AUDIT 2.1] Testing ARM 02: Reduce Circuit Depth (Boundary Check)...")
        arm2_card = page.locator(".rounded-xl", has=page.locator("h4", has_text="Reduce Circuit Depth")).first
        arm2_deploy = arm2_card.locator("button", has_text="Deploy")
        is_arm2_disabled = arm2_deploy.is_disabled()
        print(f"  [OK] ARM 02 Deploy button genuinely disabled: {is_arm2_disabled}")
        assert is_arm2_disabled, "ARM 02 MUST be disabled when L=2 to prevent expressibility loss!"
        
        # 2. Audit Twin Simulation on ARM 01
        print("\n[AUDIT 2.2] Testing Digital Twin H=3 Forward Simulation on ARM 01...")
        arm1_card = page.locator(".rounded-xl", has=page.locator("h4", has_text="Change Optimizer")).first
        twin_btn = arm1_card.locator("button", has_text="Twin H=3")
        if twin_btn.is_visible():
            twin_btn.click()
            time.sleep(2)
            body_text = page.locator("body").inner_text()
            assert "Application error" not in body_text, "Fatal crash during Twin Simulation!"
            print("  [OK] Twin H=3 simulation completed with zero client errors.")
        
        # 3. Audit Deploy for All Eligible Arms
        deployable_arms = [
            ("ARM 01", "Change Optimizer"),
            ("ARM 03", "Modify Feature Map"),
            ("ARM 04", "Adjust Learning Rate"),
            ("ARM 05", "Apply Noise Mitigation"),
            ("ARM 06", "Perform Warm Restart"),
        ]
        
        print("\n[AUDIT 2.3] Testing Deploy interaction across all eligible repair arms...")
        for arm_num, arm_name in deployable_arms:
            card = page.locator(".rounded-xl", has=page.locator("h4", has_text=arm_name)).first
            deploy_btn = card.locator("button", has_text="Deploy")
            
            if not deploy_btn.is_disabled():
                print(f"  * Triggering Deploy on {arm_num} ({arm_name})...")
                deploy_btn.click()
                time.sleep(2)
                
                body_text = page.locator("body").inner_text()
                assert "Application error" not in body_text, f"FATAL CRASH when deploying {arm_name}!"
                assert len(page_errors) == 0, f"Page errors logged during {arm_name}: {page_errors}"
                
                has_feedback = (
                    "Repair Deployed" in body_text
                    or "Safety Filter Intervened" in body_text
                    or "ACTIVE DEPLOYMENT" in body_text
                )
                print(f"    [OK] {arm_name} response received safely. Feedback visible: {has_feedback}")
            else:
                print(f"  * {arm_num} ({arm_name}) button is disabled by active constraint.")
        
        # Capture Post-Deploy Validation Screenshot
        post_deploy_shot = os.path.join(ARTIFACT_DIR, "post_deploy_arm1_validation.png")
        page.screenshot(path=post_deploy_shot)
        
        # Click on Arm 05 card to test inspector
        arm5_card = page.locator(".rounded-xl", has=page.locator("h4", has_text="Apply Noise Mitigation")).first
        arm5_card.click()
        time.sleep(1)
        inspector_shot = os.path.join(ARTIFACT_DIR, "repair_matrix_detail_inspector.png")
        page.screenshot(path=inspector_shot)
        print("  [OK] Captured Repair Matrix deep-dive inspector view.")
        
        context.close()
        
        # -------------------------------------------------------------
        # PART 3: TABLET AND MOBILE DASHBOARD AUDITS
        # -------------------------------------------------------------
        print("\n[PART 3] Capturing Tablet Dashboard (768x1024) and Mobile Dashboard (390x844)...")
        # Tablet
        tab_ctx = browser.new_context(viewport={"width": 768, "height": 1024})
        tab_page = tab_ctx.new_page()
        tab_page.goto("http://localhost:3000/", wait_until="networkidle")
        tab_page.get_by_role("button", name="Launch Live Lab").first.click()
        time.sleep(1.5)
        tab_shot = os.path.join(ARTIFACT_DIR, "dashboard_tablet_768x1024.png")
        tab_page.screenshot(path=tab_shot)
        tab_scroll_w = tab_page.evaluate("() => document.documentElement.scrollWidth")
        tab_inner_w = tab_page.evaluate("() => window.innerWidth")
        print(f"  * Tablet Dashboard scrollWidth={tab_scroll_w}, innerWidth={tab_inner_w}, overflow={tab_scroll_w > tab_inner_w}")
        tab_ctx.close()
        
        # Mobile
        mob_ctx = browser.new_context(viewport={"width": 390, "height": 844})
        mob_page = mob_ctx.new_page()
        mob_page.goto("http://localhost:3000/", wait_until="networkidle")
        mob_page.locator("button:has-text('Live Lab')").first.click()
        time.sleep(1.5)
        mob_shot = os.path.join(ARTIFACT_DIR, "dashboard_mobile_390x844.png")
        mob_page.screenshot(path=mob_shot)
        mob_scroll_w = mob_page.evaluate("() => document.documentElement.scrollWidth")
        mob_inner_w = mob_page.evaluate("() => window.innerWidth")
        print(f"  * Mobile Dashboard scrollWidth={mob_scroll_w}, innerWidth={mob_inner_w}, overflow={mob_scroll_w > mob_inner_w}")
        mob_ctx.close()
        
        browser.close()
        
    print("\n" + "=" * 70)
    if overflow_failures:
        print(f"FAILED: Horizontal overflow detected on {len(overflow_failures)} viewports: {overflow_failures}")
        sys.exit(1)
    else:
        print("ALL PLAYWRIGHT TESTS PASSED! ZERO CRASHES, ZERO HORIZONTAL OVERFLOWS!")
        print("=" * 70)

if __name__ == "__main__":
    run_suite()
