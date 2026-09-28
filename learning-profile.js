/* Local generic learning preferences; never stores a child's identity or answers. */
(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LearningProfile = api;
}(typeof window !== 'undefined' ? window : null, function (root) {
  'use strict';
  var NAME = 'family-learning-profile', YEAR = 31536000000;
  var TYPES = ['addition', 'subtraction', 'trace', 'reading'], DEFAULTS = TYPES.slice(0, 3);
  function validSelection(items) {
    return Array.isArray(items) && items.length > 0 && items.length <= TYPES.length && items.every(function (item, index) {
      return TYPES.indexOf(item) >= 0 && items.indexOf(item) === index;
    });
  }
  function valid(value, now) {
    return !!(value && (value.version === 1 || value.version === 2) && (value.level === 'learner' || value.level === 'advanced') &&
      typeof value.reading === 'boolean' && typeof value.expiresAt === 'number' && isFinite(value.expiresAt) &&
      value.expiresAt > now && value.expiresAt <= now + YEAR + 60000 &&
      (value.version === 1 || (validSelection(value.challenges) && value.reading === (value.challenges.indexOf('reading') >= 0))));
  }
  function selection(reading) { return reading ? TYPES.slice() : DEFAULTS.slice(); }
  function normalize(value) {
    var challenges = value.version === 1 ? selection(value.reading) : TYPES.filter(function (type) { return value.challenges.indexOf(type) >= 0; });
    return {version:2, level:value.level, reading:challenges.indexOf('reading') >= 0, challenges:challenges, expiresAt:value.expiresAt};
  }
  function read() {
    if (!root || !root.document) return null;
    try {
      var cookies = root.document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var item = cookies[i].trim();
        if (item.indexOf(NAME + '=') !== 0) continue;
        var value = JSON.parse(decodeURIComponent(item.slice(NAME.length + 1)));
        return valid(value, Date.now()) ? normalize(value) : null;
      }
    } catch (ignore) { /* Cookie access can be unavailable in private/restricted browsers. */ }
    return null;
  }
  function attributes() {
    return '; Path=/; SameSite=Lax' + (root.location.protocol === 'https:' ? '; Secure' : '');
  }
  function save(settings) {
    if (!root || !root.document || !settings) return false;
    var challenges = settings.challenges;
    // Keep the existing save API usable by previously integrated callers.
    if (challenges === undefined && typeof settings.reading === 'boolean') challenges = selection(settings.reading);
    if (!validSelection(challenges)) return false;
    var value = normalize({version:2, level:settings.level, challenges:challenges, expiresAt:Date.now() + YEAR});
    if (!valid(value, Date.now())) return false;
    try {
      root.document.cookie = NAME + '=' + encodeURIComponent(JSON.stringify(value)) + '; Max-Age=31536000' + attributes();
      var stored = read();
      return !!(stored && stored.level === value.level && stored.challenges.join(',') === value.challenges.join(',') && stored.expiresAt === value.expiresAt);
    } catch (ignore) { return false; }
  }
  function clear() {
    if (!root || !root.document) return false;
    try {
      root.document.cookie = NAME + '=; Max-Age=0' + attributes();
      // Read directly too: a blocked getter must not be mistaken for a successful deletion.
      return root.document.cookie.split(';').every(function (item) { return item.trim().indexOf(NAME + '=') !== 0; });
    } catch (ignore) { return false; }
  }
  return {read:read, save:save, clear:clear, cookieName:NAME, lifetime:YEAR, valid:valid, types:TYPES.slice(), defaults:DEFAULTS.slice()};
}));
