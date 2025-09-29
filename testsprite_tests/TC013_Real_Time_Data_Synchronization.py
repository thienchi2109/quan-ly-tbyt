import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Input username and password for first client and click login.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[3]/div/div/div[2]/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('ntchi')
        

        # Input password for first client and click login again.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[3]/div/div/div[2]/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[3]/div/div/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Open new tab and navigate to login page for second client login.
        await page.goto('http://localhost:3000', timeout=10000)
        

        # Input username and password for second client and click login.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[3]/div/div/div[2]/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('ntchi')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[3]/div/div/div[2]/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[3]/div/div/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Thiết bị' (Equipment) menu to open equipment management page on the first client.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/nav/a[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Perform an equipment status update or start/stop a usage session on the first client.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div[2]/div[3]/div/div/table/tbody/tr[2]/td[7]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Sửa thông tin' (Edit information) to update equipment status on the first client.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[4]/div/div[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Change the equipment status to 'Hoạt động' (Active) and save changes on the first client.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[5]/form/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Verify on the second client that the equipment status update is reflected immediately without page refresh.
        await page.goto('http://localhost:3000/equipment', timeout=10000)
        

        # Perform a start/stop usage session action on the first client and verify real-time update on the second client.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div[2]/div[3]/div/div/table/tbody/tr[3]/td[7]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Xem chi tiết' (View details) or relevant option to start/stop usage session on the first client.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[4]/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Nhật ký sử dụng' (Usage log) tab to access usage session controls on the first client.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[5]/div[2]/div/button[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Bắt đầu sử dụng' (Start using) button to start usage session on the first client.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[5]/div[2]/div[5]/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Bắt đầu sử dụng' (Start using) button to confirm and start usage session on the first client.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[7]/form/div[4]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assertion: Verify equipment status update is reflected immediately on the second client without page refresh.
        second_client_frame = context.pages[-1]
        await second_client_frame.wait_for_selector("xpath=//table/tbody/tr[2]/td[6][text()='Hoạt động']", timeout=5000)
        status_text = await second_client_frame.locator("xpath=//table/tbody/tr[2]/td[6]").inner_text()
        assert status_text == 'Hoạt động', f"Expected equipment status to be 'Hoạt động', but got '{status_text}'"
          
        # Assertion: Verify usage session start is reflected immediately on the second client without page refresh.
        await second_client_frame.wait_for_selector("xpath=//table/tbody/tr[3]/td[7]/button[contains(text(),'Kết thúc sử dụng')]", timeout=5000)
        button_text = await second_client_frame.locator("xpath=//table/tbody/tr[3]/td[7]/button").inner_text()
        assert 'Kết thúc sử dụng' in button_text, f"Expected usage session button to show 'Kết thúc sử dụng', but got '{button_text}'"
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    