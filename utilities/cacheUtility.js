const cache = {};

function setCache(key, value) {
    console.log("Setting cache for key:", key);
    cache[key] = value;
}

function getCache(key) {
    console.log("Getting cache for key:", key);
    return cache[key] || null;
}

function deleteCache(key) {
    console.log("Deleting cache for key:", key);
    delete cache[key];
}

module.exports = {
    setCache,
    getCache,
    deleteCache
};
