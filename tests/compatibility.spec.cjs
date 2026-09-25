const {test,expect}=require('@playwright/test');
const {solveGate}=require('./helpers/learning-fixture.cjs');
test('touch start, countdown freeze, home, sound off and offline gate',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#learning-gate')).toBeVisible();
 await solveGate(page);await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('.game-exit a')).toHaveAttribute('href','https://cmlozanos.github.io/games/');
 await page.locator('#title-play').click();
 await page.evaluate(()=>{const now=Date.now;Date.now=()=>now()+600001;});
 await expect(page.locator('#learning-gate')).toBeVisible();
 const text=await page.locator('#countdown-text').textContent();
 await page.waitForTimeout(3200);await expect(page.locator('#countdown-text')).toHaveText(text);
 await solveGate(page);await expect(page.locator('#countdown-overlay')).toHaveClass(/hidden/,{timeout:7000});
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();await expect(page.locator('#learning-gate')).toBeVisible();await solveGate(page);await expect(page.locator('#title-play')).toBeVisible();
 expect(errors).toEqual([]);
});
