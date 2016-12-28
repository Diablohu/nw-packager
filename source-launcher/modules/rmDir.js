// Empty directory
// code from https://gist.github.com/liangzan/807712

const fs = require('fs')
const path = require('path')

const rmDir = (dirPath, removeSelf) => {
    if (removeSelf === undefined)
        removeSelf = true;
    try { var files = fs.readdirSync(dirPath); }
    catch (e) { return; }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            //var filePath = dirPath + '/' + files[i];
            var filePath = path.join(dirPath, files[i]);
            if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
            else
                rmDir(filePath);
        }
    if (removeSelf)
        fs.rmdirSync(dirPath);
};

export default rmDir;