const base = require('@playwright/test');

// Exercise the visible challenge, never an application unlock/debug API.
async function solveGate(page) {
  const gate = page.locator('#learning-gate');
  if (!await gate.count()) return;
  const prompt = page.locator('#gate-prompt');
  if (await prompt.isVisible()) {
    const text = await prompt.textContent();
    const parts = text.match(/(\d)\s*([+−-])\s*(\d)/);
    if (!parts) throw new Error('Unrecognized arithmetic challenge: ' + text);
    const answer = parts[2] === '+' ? Number(parts[1]) + Number(parts[3]) : Number(parts[1]) - Number(parts[3]);
    await page.locator('[data-gate-key="' + answer + '"]').click();
  } else {
    const canvas = page.locator('#gate-trace');
    const strokes = await canvas.evaluate(node => window.LearningGate.Core.glyphs[node.dataset.letter]);
    const box = await canvas.boundingBox();
    for (const stroke of strokes) {
      const point = value => ({x:box.x + value[0] * box.width / 100,y:box.y + value[1] * box.height / 100});
      let p = point(stroke[0]);
      await page.mouse.move(p.x,p.y);
      await page.mouse.down();
      for (let i=1;i<stroke.length;i++) {
        p = point(stroke[i]);
        await page.mouse.move(p.x,p.y,{steps:3});
      }
      await page.mouse.up();
    }
  }
  await base.expect(gate).toHaveCount(0);
}

const test = base.test.extend({
  page: async ({page},use) => {
    for (const method of ['goto','reload']) {
      const original = page[method].bind(page);
      page[method] = async (...args) => {
        const response = await original(...args);
        await solveGate(page);
        return response;
      };
    }
    await use(page);
  }
});
module.exports = {test,expect:base.expect,solveGate};
