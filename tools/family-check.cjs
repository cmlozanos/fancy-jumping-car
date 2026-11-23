const assert = require('node:assert/strict');
async function openAdults(page) {
  await page.locator('family-v2-shell #adults').click();
  const label = await page.locator('family-v2-shell #gate-label').textContent();
  const digits = label.match(/\d+/g).map(Number);
  await page.locator('family-v2-shell #answer').fill(String(digits[0] * digits[1]));
  await page.locator('family-v2-shell #gate button').click();
  await page.locator('family-v2-shell #adult-settings').waitFor({state:'visible'});
}
async function setting(page, selector) {
  await openAdults(page);
  await page.locator(selector).click();
  await page.locator('family-v2-shell #close').click();
  await page.waitForFunction(() => !document.querySelector('family-v2-shell').shadowRoot.querySelector('dialog').open);
  await page.waitForTimeout(30);
}
async function familyPause(page, read) {
  await page.evaluate(() => {
    window.__familyEvents = [];
    if (!window.__familyListening) {
      for (const type of ['pause', 'resume']) window.addEventListener('familyv2:' + type, () => window.__familyEvents.push(type));
      window.__familyListening = true;
    }
  });
  await page.locator('family-v2-shell #adults').click();
  const before = await read();
  await page.waitForTimeout(350);
  assert.deepEqual(await read(), before, 'Adult gate freezes the actual simulation');
  await page.locator('family-v2-shell #close').click();
  await page.waitForFunction(() => !document.querySelector('family-v2-shell').shadowRoot.querySelector('dialog').open);
  await page.waitForTimeout(30);
  assert.deepEqual(await page.evaluate(() => window.__familyEvents), ['pause', 'resume']);
  const result = await page.evaluate(() => {
    const before = FamilyV2.read().points;
    FamilyV2.award('family-browser-check', 1);
    const once = FamilyV2.read().points;
    FamilyV2.award('family-browser-check', 1);
    return { before, once, twice: FamilyV2.read().points, font: document.fonts.check('20px \"' + FamilyV2.fontFamily + '\"'), files: getComputedStyle(document.documentElement).getPropertyValue('--family-height') };
  });
  assert.equal(result.once, result.twice, 'award ids are deduplicated');
  assert.ok(result.once >= result.before);
  assert.equal(result.font, true);
  assert.ok(result.files.endsWith('px'));
}
module.exports = {openAdults, setting, familyPause};
