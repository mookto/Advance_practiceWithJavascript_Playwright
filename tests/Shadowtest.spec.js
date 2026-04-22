const { test, expect } = require('@playwright/test');
const path = require('path');

test('SelectorsHub Practice Automation', async ({ page }) => {
    // 1. Navigate to the page
    await page.goto('https://selectorshub.com/xpath-practice-page/', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 // Overrides config for this specific action if needed
    });
    // 2. Scroll down (Playwright usually scrolls automatically, but manual is fine)
    await page.mouse.wheel(0, 2000);

    // 3. Handle Disabled Element (Forcefully setting value)
    const disabledField = page.locator('input[placeholder="Enter Last name"]');
    await disabledField.evaluate(el => el.value = 'Forced Text');

    // 4. Dropdown selection
    await page.selectOption('#cars', 'opel');

    // 5. Date Picker selection
    await page.locator('input[type="date"]').fill('2026-12-10');

    // 6. File Download handling
    // We start listening for the download event BEFORE clicking the button
    const [download] = await Promise.all([
        page.waitForEvent('download'), 
        page.locator('//a[contains(text(),"Click to Download PNG File")]').click(),
    ]);
    // Save the downloaded file to a specific path
    await download.saveAs('./downloads/selectors_hub.png');

    // 7. File Upload
    await page.setInputFiles('#myFile', 'C:/Users/mahed/Desktop/DUA/99 names.jpg');

    // 8. Handle Window Alerts and Prompts
    // In Playwright, we handle dialogs via a listener before they appear
    page.on('dialog', async dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        if (dialog.type() === 'prompt') {
            await dialog.accept('Gemini User');
        } else {
            await dialog.accept();
        }
    });

    // Trigger Window Alert
    await page.getByText('Click To Open Window Alert').click();

    // Trigger Window Prompt
    await page.getByText('Click To Open Window Prompt Alert').click();

    // 9. Bottom Modal handling
    await page.locator('#myBtn').click();
    await page.locator('.close').click();

    // 10. Pagination Loop
    const nextButton = page.locator('button[aria-label="Next"]');
    let pageCount = 1;

    while (true) {
        console.log(`Processing page ${pageCount}...`);
        
        // Check if next button is visible and not disabled by class
        const isVisible = await nextButton.isVisible();
        const classAttribute = await nextButton.getAttribute('class');

        if (isVisible && !classAttribute.includes('disabled')) {
            await nextButton.scrollIntoViewIfNeeded();
            await nextButton.click();
            pageCount++;
            // Short delay to allow table refresh
            await page.waitForTimeout(1000); 
        } else {
            console.log('Reached the last page.');
            break;
        }
    }
});