

var fs = require('fs'),
    path = require('path');

var ngit = exports;

ngit.update = function (targetPath, callback) {
  var rootPath = (targetPath.charAt(0) === '/') 
                  ? path.normalize(targetPath) 
                  : path.normalize(process.cwd() + '/' + targetPath),
      statsList = {},
      oldStats = {},
      started = 0,
      finished = 0,
      running = 0;
  
  checkPrevious(rootPath, function (err) {
    if (err) {
      console.log('Skipping .ngit file due to error: %s', err.message);
    }
    statPath(rootPath);  
  });
  

  function statPath(item) {
    started++;
    (function tryStat(target) {
      if (running >= ngit.limit) {
        return process.nextTick(function () {
          tryStat(target);
        });
      }
      running++;
      fs.lstat(target, function (err, stats) {
        if (err) {
          return callback(err);
        }
        if (stats.isFile()) {
          onFile(target, stats.mtime);
        }
        else if (stats.isDirectory()) {
          onDir(target);
        }
        else {
          finished++;
          return onComplete();
        }
      });
    })(item);
  }

  function onDir(dir) {
    fs.readdir(dir, function (err, items) {
      if (err) {
        return callback(err);
      }
      items.forEach(function (item) {
        statPath(dir + '/' + item);
      });
      finished++;
      return onComplete();
    });
  }

  function onFile(file, mtime) {
    if ((/node_modules/.test(file))
        || (/\.git/.test(file))) {
      finished++;
      return onComplete();
    }
    statsList[file.replace(rootPath + '/', '')] = mtime;
    finished++;
    return onComplete();
  }

  function onComplete() {
    running--;
    if ((started === finished)&&(running === 0)) {
      return compare();
    }
  }

  function checkPrevious (dir, done) {
    var ngitPath = dir + '/.ngit';
    path.exists(ngitPath, function (exists) {
      if (exists) {
        return fs.readFile(ngitPath, function (err, data) {
          if (err) {
            return done(err);
          }
          try{
            oldStats = JSON.parse(data);
            return done();
          }
          catch (err) {
            return done(err);
          }
        });
      }
      oldStats = false; 
      return done();
    });
  }

  function compare() {
    var current = Object.keys(statsList).sort(),
        excludes = [];
    if (!oldStats) {
      return saveData();
    }
    current.forEach(function (item, i) {
      if (oldStats[item] == statsList[item].toJSON()) {
        excludes.push(item);
      }
    });
    if (excludes) {
      return saveExcludes(excludes);
    }
    return saveData();
  }

  function saveExcludes(excludes) {
    fs.writeFile(process.cwd() + '/.jitsuignore', excludes.join('\r\n'), function (err) {
      if (err) {
        return callback(err);
      }
      return saveData();
    });
  }

  function saveData() {
    fs.writeFile(process.cwd() + '/.ngit', JSON.stringify(statsList), function (err) {
      if (err) {
        return callback(err);
      }
      return callback();
    });
  }

}


ngit.limit = 32;

