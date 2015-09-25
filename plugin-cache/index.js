'use strict';
var crypto = require('crypto');
var fs = require('fs');
var mkdirp = require('mkdirp');
var os = require('os');
var path = require('path');
var updateList = require('./src/update');

var log = process.env.LOGGER || console;

function createETag(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
}

module.exports = function (keyword, limit) {
  if (typeof keyword !== 'string') {
    log.error('Keyword is required');
    return;
  }

  var etag = null;
  var cache = path.join(os.tmpdir(), 'yeoman-generator-list', 'cache.json');
  try {
    fs.readFileSync(cache);
  }
  catch (e) {
    mkdirp.sync(path.dirname(cache));
    fs.writeFileSync(cache, '[]');
  }

  log.info('Cache file created at %s', cache);

  this.getETag = function () {
    return etag;
  };

  this.getCacheStream = function () {
    return fs.createReadStream(cache);
  };

  this.update = function () {
    return updateList(keyword, limit).then(function (data) {
      var json = JSON.stringify(data);
      etag = createETag(json);

      fs.writeFile(cache, json, function () {
        log.info('Updated: %s generators', data.length);
      });
    }).catch(function (err) {
      log.error('Failed to save to cache', err);
    });
  };
};
