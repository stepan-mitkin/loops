(function() {
function clone(obj) {
    var copy;
    if (obj && typeof obj === 'object') {
        copy = {};
        Object.assign(copy, obj);
        return copy;
    } else {
        return obj;
    }
}
function createUtils() {
    var utils;
    utils = {};
    utils.clone = clone;
    return utils;
}
window.createUtils = createUtils;
})();