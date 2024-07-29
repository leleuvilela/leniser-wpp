import puppetter from 'puppeteer';

const screenshot = async (url: string) => {
    const browser = await puppetter.launch({
        defaultViewport: {
            width: 845,
            height: 600,
        },
        headless: true, // false to show the browser.
        args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForNetworkIdle({ idleTime: 2000 });
    const screenshot = await page.screenshot({ type: 'jpeg' });
    await browser.close();
    return screenshot;
};

export { screenshot };
