/**
 *@author: Ian Hoegen
 *@description: This is the central manager of all packages for translationCore.
 ******************************************************************************/
const pathex = require('path-extra');
const fs = require(window.__base + 'node_modules/fs-extra');
const git = require('../GitApi.js');
const npm = pathex.join(window.__base, 'node_modules', '.bin', 'npm');
const babelCli = pathex.join(window.__base, 'node_modules', '.bin', 'babel');
const exec = require('child_process').exec;
const api = window.ModuleApi;

const PARENT = pathex.datadir('translationCore')
const PACKAGE_SAVE_LOCATION = pathex.join(PARENT, 'packages');
const PACKAGE_COMPILE_LOCATION = pathex.join(PARENT, 'packages-compiled')
const CENTRAL_REPO = "https://raw.githubusercontent.com/translationCoreApps/translationCore-apps/master/directory.json";

/**
 * @description - This downloads the specified package to the packages folder.
 * @param {String} packageName - The name of the package to be installed.
 * @param {function} callback - To be called upon completion
 ******************************************************************************/
function downloadPackage(packageName, callback) {
  getPackageList(function(obj){
    var packageLocation = obj[packageName].repo;
    fs.ensureDirSync(PACKAGE_SAVE_LOCATION);
    fs.ensureDirSync(PACKAGE_COMPILE_LOCATION);
    var source = pathex.join(PACKAGE_SAVE_LOCATION, packageName);
    fs.emptyDirSync(source);
    git(PACKAGE_SAVE_LOCATION).mirror(packageLocation, source, function() {
      var destination = pathex.join(PACKAGE_COMPILE_LOCATION, packageName);
      fs.emptyDirSync(destination);
      fs.removeSync(destination);
      var command = '"' + npm + '"' + ' install';
      exec(command, {cwd: source}, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          callback(`exec error: ${error}`, null);
          return;
        }
        fs.copy(source, destination, function (err) {
          installDependencies(packageName);
          compilePackage(destination, packageName, callback)
        });
      });
    });
  });
}
/**
 * @description - This compiles the specified package to the folder it resides in.
 * @param {String} destination - The location of the package, in packages-compiled.
 * @param {String} packageName - The name of the package
 * @param {function} callback - To be called upon completion
 ******************************************************************************/
function compilePackage(destination, packageName, callback) {
  var command = '"' + babelCli + '"' + ' ' + '"'+ destination +'"' + ' --ignore node_modules,.git --out-dir ' + '"'+ destination+'"';
  fs.ensureDirSync(destination);
  var filesInPackage = fs.readdirSync(destination);
  if (!filesInPackage.includes('.babelrc')) {
    if (callback) {
      callback('Installation Successful');
    }
    return;
  }
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      callback(`exec error: ${error}`, null);
      return;
    }
    if (callback) {

      callback(null, 'Installation Successful')
    }
    api.Toast.success("Installation Successful", packageName + 'Was Successfully Installed', 3);
  });
}
/**
 * @description - This get's the list of packages available to download.
 * @param {function} callback - To be called upon completion
 ******************************************************************************/
function getPackageList(callback) {
  var request = new XMLHttpRequest();
  request.onload = function() {
    var obj;
    try {
      obj = JSON.parse(this.response);
    } catch(error) {
      obj = error;
      console.error('Parse Error');
    } finally {
      callback(obj);
    }
  }
  request.onerror = function() {
    console.error('Connection Error');
  }

  request.open('GET', CENTRAL_REPO);
  request.send();
}
/**
 * @description - This checks for updates on installed packags.
 * @param {function} callback - To be called upon completion
 ******************************************************************************/
function checkForUpdates(callback) {
  getPackageList(function(obj){
    var needToUpdate = [];
    var installedPackages = getLocalList();
    for (var packages in installedPackages) {
      var currentPackage = installedPackages[packages]
      var localVersion = require(pathex.join(PACKAGE_SAVE_LOCATION, currentPackage, 'package.json')).version;
      var remoteVersion = obj[currentPackage].version;
      if (remoteVersion > localVersion) needToUpdate.push(currentPackage);
    }
    callback(needToUpdate);
  });
}
/**
 * @description - This updates a package to the newest version.
 * @param {String} packageName - The name of the package to be installed.
 * @param {function} callback - To be called upon completion
 ******************************************************************************/
function update(packageName, callback) {
  downloadPackage(packageName, callback);
}
/**
 * @description - This returns a list of installed packages.
 * @return {array} installedPackages - An array of installed packages.
 ******************************************************************************/
function getLocalList() {
  fs.ensureDirSync(PACKAGE_COMPILE_LOCATION);
  var installedPackages = fs.readdirSync(PACKAGE_COMPILE_LOCATION);
  return installedPackages;
}
/**
 * @description - This returns a list of installed packages.
 * @param {String} packageName - The name of the package to look for.
 * @return {boolean} isExists - Whether the packae exists locally.
 ******************************************************************************/
function isInstalled(packageName) {
  fs.ensureDirSync(PACKAGE_SAVE_LOCATION);
  fs.ensureDirSync(PACKAGE_COMPILE_LOCATION);
  var manifestLocation = pathex.join(PACKAGE_SAVE_LOCATION, packageName, 'package.json');
  try {
    var manifest = require(manifestLocation);
  } catch(err) {
    return false;
  }
  var dependencies = manifest.include;
  var dependenciesInstalled = true;
  var compiledPackages = fs.readdirSync(PACKAGE_COMPILE_LOCATION);
  for (var i in dependencies) {
    if (!compiledPackages.includes(dependencies[i])) {
      dependenciesInstalled = false;
    }
  }
  return compiledPackages.includes(packageName) && dependenciesInstalled;
}
/**
 * @description - This get's the version number of the package.
 * @param {String} packageName - The name of the package.
 * @return {String} version - The version of the package.
 ******************************************************************************/
function getVersion(packageName) {
  var manifestLocation = pathex.join(PACKAGE_COMPILE_LOCATION, packageName, 'package.json');
  try {
    var manifest = require(manifestLocation);
  } catch(err) {
    return null;
  }
  var version = manifest.version;
  return version;
}
/**
 * @description - This get's the version number of the package.
 * @param {String} query - The package to search for.
 * @param {String} callback - Function to be called on complete.
 ******************************************************************************/
function search(query, callback) {
  getPackageList((data) => {
    var packageNames = Object.getOwnPropertyNames(data);
    var results = [];
    for (var i in packageNames) {
      if (~packageNames[i].indexOf(query)) {
        results.push(data[packageNames[i]]);
      }
    }
    callback(results);
  });
}
/**
 * @description Uninstalls a package.
 * @param {String} packageName - The name of the package to uninstall.
 ******************************************************************************/
function uninstall(packageName) {
  var packageLocation = pathex.join(PACKAGE_SAVE_LOCATION, packageName);
  var compiledLocation = pathex.join(PACKAGE_COMPILE_LOCATION, packageName);
  fs.emptyDirSync(packageLocation);
  fs.emptyDirSync(compiledLocation);
  fs.removeSync(packageLocation);
  fs.removeSync(compiledLocation);
  api.Toast.success("Uninstallation Successful", packageName + 'Was Successfully Uninstalled', 3);
}
/**
 * @description Installs a packages dependencies.
 * @param The package to install dependencies for.
 ******************************************************************************/
function installDependencies(packageName) {
  var manifestLocation = pathex.join(PACKAGE_SAVE_LOCATION, packageName, 'package.json');
  try {
    var manifest = require(manifestLocation);
  } catch(err) {
    return;
  }
  var dependencies = manifest.include;
  for (var i in dependencies) {
    var dependencyLocation = pathex.join(PACKAGE_SAVE_LOCATION, dependencies[i]);
    fs.emptyDirSync(dependencyLocation);
    fs.removeSync(dependencyLocation);
    downloadPackage(dependencies[i]);
  }
}

exports.download = downloadPackage;
exports.list = getPackageList;
exports.compile = compilePackage;
exports.checkForUpdates = checkForUpdates;
exports.update = update;
exports.getLocalList = getLocalList;
exports.isInstalled = isInstalled;
exports.search = search;
exports.getVersion = getVersion;
exports.uninstall = uninstall;
