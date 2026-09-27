const assert = require('node:assert/strict');

// Browser-native context menus are outside Playwright's DOM; test cancellation
// and callout CSS separately from the real hold/release control checks.
async function checkTouchUI(page, selector, existingContextBlock = false) {
    const result = await page.locator(selector).first().evaluate((target, existingBlock) => {
        const sendMenu = pointerType => {
            const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
            if (pointerType) Object.defineProperty(event, 'pointerType', { value: pointerType });
            target.dispatchEvent(event);
            return event.defaultPrevented;
        };
        const touchMenu = sendMenu('touch');
        const style = getComputedStyle(target);
        const selection = style.userSelect || style.webkitUserSelect;
        const callout = !CSS.supports('-webkit-touch-callout', 'none') ||
            style.getPropertyValue('-webkit-touch-callout') === 'none';
        // The touchstart listener must not itself suppress scrolling.
        const surface = document.createElement('div');
        document.body.appendChild(surface);
        surface.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
        const pointerFallbackMenu = sendMenu();
        surface.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }));
        const start = new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [] });
        surface.dispatchEvent(start);
        const fallbackMenu = sendMenu();
        surface.remove();
        const editable = document.createElement('div');
        editable.id = 'touch-edit-fixture';
        editable.innerHTML = '<input><textarea></textarea><select><option>A</option><option>B</option></select><div contenteditable="true"><span>Texto</span></div>';
        editable.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:white;color:black';
        document.body.appendChild(editable);
        const forms = [...editable.querySelectorAll('input,textarea,select,[contenteditable],span')].map(node => {
            const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'pointerType', { value: 'touch' });
            node.dispatchEvent(event);
            const css = getComputedStyle(node);
            return {
                menuMatchesPolicy: event.defaultPrevented === existingBlock,
                selection: css.userSelect || css.webkitUserSelect,
                callout: !CSS.supports('-webkit-touch-callout', 'default') ||
                    css.getPropertyValue('-webkit-touch-callout') === 'default'
            };
        });
        return { touchMenu, pointerFallbackMenu, fallbackMenu, startCancelled: start.defaultPrevented, selection, callout, forms };
    }, existingContextBlock);
    assert.equal(result.touchMenu, true, 'touch contextmenu must be cancelled');
    assert.equal(result.pointerFallbackMenu, true, 'MouseEvent contextmenu after touch pointerdown must be cancelled');
    assert.equal(result.fallbackMenu, true, 'MouseEvent contextmenu after touch must be cancelled');
    assert.equal(result.startCancelled, false, 'global touchstart must leave scrolling available');
    assert.equal(result.selection, 'none', 'game controls must not select text');
    assert.equal(result.callout, true, 'WebKit callout disabled where supported');
    for (const form of result.forms) {
        assert.equal(form.menuMatchesPolicy, true, 'editable context menu retains the existing policy');
        assert.equal(form.selection, 'text', 'editable target retains text selection');
        assert.equal(form.callout, true, 'editable target retains WebKit callout');
    }
    const input = page.locator('#touch-edit-fixture input');
    await input.fill('abc');
    await input.press('End');
    await input.press('Shift+ArrowLeft');
    assert.deepEqual(await input.evaluate(node => [node.selectionStart, node.selectionEnd]), [2, 3]);
    await input.press('z');
    assert.equal(await input.inputValue(), 'abz', 'keyboard editing preserved');
    const textarea = page.locator('#touch-edit-fixture textarea');
    await textarea.fill('nota');
    assert.equal(await textarea.inputValue(), 'nota');
    await page.locator('#touch-edit-fixture select').selectOption({ label: 'B' });
    await page.locator('#touch-edit-fixture').evaluate(node => node.remove());
    // No recent touch: preserve the previous desktop context-menu behavior.
    await page.waitForTimeout(2100);
    const desktopBlocked = await page.locator(selector).first().evaluate(target => {
        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        return event.defaultPrevented;
    });
    assert.equal(desktopBlocked, existingContextBlock, 'desktop context-menu behavior unchanged');
}
module.exports = { checkTouchUI };
