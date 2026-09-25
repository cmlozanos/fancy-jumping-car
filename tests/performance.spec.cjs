const {test,expect}=require('@playwright/test');
const {readFileSync}=require('node:fs');
const {solveGate}=require('./helpers/learning-fixture.cjs');
// Instrument the real module in this test response, never in shipped code.
test.use({serviceWorkers:'block'});
test('hidden work stops; racing, selectors and optional light quality remain usable',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.js?*',route=>{
    const source=readFileSync('src/main.js','utf8')
      .replaceAll('renderer.render(scene, camera);','window.__perf.main++; renderer.render(scene, camera);')
      .replace('prevRenderer.render(prevScene, prevCamera);','window.__perf.preview++; prevRenderer.render(prevScene, prevCamera);');
    return route.fulfill({contentType:'text/javascript',body:'window.__perf={main:0,preview:0};\n'+source+`\nwindow.__sample=()=>({time:state.time,progress:state.progress,ratio:renderer.getPixelRatio(),shadows:renderer.shadowMap.enabled,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,previewRunning:prevAnimId!==null,...window.__perf});`});
  });
  const sample=()=>page.evaluate(()=>window.__sample());
  await page.goto('/');await solveGate(page);
  await expect(page.locator('#quality-toggle')).toHaveAttribute('aria-pressed','true');
  expect((await sample()).ratio).toBe(0.65);
  await page.locator('#quality-toggle').click();
  await page.waitForTimeout(250);expect((await sample()).main).toBe(0);
  await page.locator('#title-vehicles').click();
  await expect.poll(async()=>(await sample()).preview).toBeGreaterThan(2);
  expect((await sample()).main).toBe(0);
  await page.locator('#vehicle-close').click();const closed=await sample();
  await page.waitForTimeout(250);expect((await sample()).preview).toBe(closed.preview);
  expect((await sample()).previewRunning).toBe(false);
  await page.locator('#title-play').click();
  await expect(page.locator('#countdown-overlay')).toHaveClass(/hidden/,{timeout:7000});
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(600);await page.keyboard.up('ArrowUp');
  expect((await sample()).progress).toBeGreaterThan(0);
  await page.locator('#open-levels').click();const levelPaused=await sample();
  await page.waitForTimeout(350);expect(await sample()).toEqual(levelPaused);
  await page.locator('#level-close').click();
  await page.locator('#open-character').click();const charPaused=await sample();
  await page.waitForTimeout(250);const charAfter=await sample();expect(charAfter.time).toBe(charPaused.time);expect(charAfter.main).toBe(charPaused.main);expect(charAfter.preview).toBeGreaterThan(charPaused.preview);
  await page.locator('#vehicle-close').click();
  const normalStart=await sample();await page.waitForTimeout(1000);const normalEnd=await sample();
  expect(normalEnd.ratio).toBe(1);expect(normalEnd.shadows).toBe(true);
  for(const viewport of [{width:360,height:640},{width:640,height:360},{width:1024,height:768}]) {
    await page.setViewportSize(viewport);
    const nav=await page.locator('.game-exit').boundingBox(),hud=await page.locator('#hud').boundingBox();
    expect(hud.y).toBeGreaterThanOrEqual(nav.y+nav.height);
    const action=await page.locator('[data-control="action"]').boundingBox();
    expect(hud.y+hud.height).toBeLessThan(action.y);
    await expect(page.locator('#quality-toggle')).toBeInViewport();
    await expect(page.locator('[data-control="action"]')).toBeInViewport();
    await page.screenshot({path:test.info().outputPath(`normal-${viewport.width}x${viewport.height}.png`)});
  }
  await page.setViewportSize({width:1280,height:800});
  await page.locator('#quality-toggle').click();
  await expect(page.locator('#quality-toggle')).toHaveAttribute('aria-pressed','true');
  const lightStart=await sample();await page.waitForTimeout(1000);const lightEnd=await sample();
  expect(lightEnd.ratio).toBe(0.65);expect(lightEnd.shadows).toBe(false);expect(lightEnd.time).toBeGreaterThan(lightStart.time);
  console.log(JSON.stringify({browser:process.env.CHROME95_PATH?'Chromium95':'modern',normal:{frames:normalEnd.main-normalStart.main,calls:normalEnd.calls,triangles:normalEnd.triangles},light:{frames:lightEnd.main-lightStart.main,calls:lightEnd.calls,triangles:lightEnd.triangles}}));
  await page.screenshot({path:test.info().outputPath('light-tablet.png')});
  await page.reload();await solveGate(page);expect((await sample()).ratio).toBe(0.65);await expect(page.locator('#quality-toggle')).toHaveAttribute('aria-pressed','true');
  await page.locator('#quality-toggle').click();expect((await sample()).ratio).toBe(1);
  const selectedCharacter=await page.evaluate(()=>localStorage.getItem('selectedCharacter'));
  await page.reload();await solveGate(page);
  await expect(page.locator('#quality-toggle')).toHaveAttribute('aria-pressed','false');
  expect((await sample()).ratio).toBe(1);
  expect(await page.evaluate(()=>localStorage.getItem('selectedCharacter'))).toBe(selectedCharacter);
  expect(errors).toEqual([]);
});
