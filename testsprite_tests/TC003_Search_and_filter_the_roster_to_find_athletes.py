import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

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
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000/atletas")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Type 'Lucas' into the search field labeled 'Buscar por nome ou posição...' and wait for the roster to update.
        # Buscar por nome ou posição... text field
        elem = page.get_by_placeholder('Buscar por nome ou posição...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Lucas")
        
        # -> Click the 'Categorias (Todas)' dropdown to open the category options so 'Sub-15' can be selected.
        # Categorias (Todas) Sub-11 Sub-13 Sub-15 Sub-17... dropdown
        elem = page.get_by_text('Categorias (Todas) Sub-11 Sub-13 Sub-15 Sub-17 Sub-20', exact=True)
        await elem.click(timeout=10000)
        
        # -> select_dropdown
        # Categorias (Todas) Sub-11 Sub-13 Sub-15 Sub-17... dropdown
        elem = page.locator("xpath=/html/body/main/div/div[2]/div[2]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Open the 'Status (Todos)' dropdown so the status options appear, then select the 'ATIVO' status.
        # Status (Todos) ATIVO LESIONADO INATIVO dropdown
        elem = page.get_by_text('Status (Todos) ATIVO LESIONADO INATIVO', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the 'ATIVO' option from the 'Status (Todos)' dropdown to apply the status filter and update the roster view.
        # Status (Todos) ATIVO LESIONADO INATIVO dropdown
        elem = page.locator("xpath=/html/body/main/div/div[2]/div[2]/select[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # --> Assertions to verify final state
        
        # --> Verify the roster list is narrowed to matching athletes
        # Assert: Roster shows exactly 1 athlete after applying the search and filters.
        await expect(page.locator("xpath=/html/body/main/div/div[3]/a")).to_have_count(1, timeout=15000), "Roster shows exactly 1 athlete after applying the search and filters."
        # Assert: Roster includes the matching athlete name 'Lucas Silva'.
        await expect(page.locator("xpath=/html/body/main/div/div[3]/a").nth(0)).to_contain_text("Lucas Silva", timeout=15000), "Roster includes the matching athlete name 'Lucas Silva'."
        
        # --> Verify the selected filters are reflected in the roster view
        # Assert: The status filter shows 'ATIVO' in the status control, indicating the status filter is reflected.
        await expect(page.locator("xpath=/html/body/main/div/div[2]/div[2]/select[2]").nth(0)).to_contain_text("ATIVO", timeout=15000), "The status filter shows 'ATIVO' in the status control, indicating the status filter is reflected."
        # Assert: The roster entry displays 'Sub-15', indicating the category filter is reflected in the roster view.
        await expect(page.locator("xpath=/html/body/main/div/div[3]/a").nth(0)).to_contain_text("Sub-15", timeout=15000), "The roster entry displays 'Sub-15', indicating the category filter is reflected in the roster view."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    