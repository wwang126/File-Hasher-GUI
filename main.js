const {app, BrowserWindow} = require('electron');
const path = require('path');
const { dialog } = require('electron');
const { remote } = require('electron');
const fs = require('fs');
const readline = require('readline');
const { crc } = require('crc');
const crc32 = require('js-crc').crc32;

async function readSFVFile(filePath){
    const fileStream = fs.createReadStream(filePath);
    
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await(const line of rl){
        if(line.substring(0,1) != ';'){
            var hash = line.substring(line.length-8, line.length);
            var hashPath = line.substring(0, line.length-9);
            //TO DO: Make sure this works with POSIX
            var absPath = filePath +'\\..\\' +hashPath;
            console.log(`Absolute Path: ${absPath}`);
            await compareCRC(hash, absPath);
            }
    }
}
let compareCRC = (hash, absPath) => {
    return new Promise((resolve, reject) => {
        var crcN = crc32(fs.readFileSync(absPath));
        if(crcN != undefined){
            console.log(crcN);
            resolve(crcN);
        } else{
            reject(Error("It broke!"))
        }
    })
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
    return mainWindow;
}

app.whenReady().then(() => {
    console.log("App Started");
    mainWindow = createWindow();
    mainWindow.send("fileInputPath", "testInput");

    app.on('activate', function() {
        if(BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    let dialogOptions = {
        properties: ['openFile']
    };
    dialog.showOpenDialog(dialogOptions)
    .then((fileNames)=>{
        if (fileNames === undefined) {
          console.log("No file selected");
        } else {
          console.log('file:', fileNames);
          var filePath = fileNames.filePaths[0];
          readSFVFile(filePath);
        }
  }).catch(err=>console.log('Handle Error',err))
});

//Close app on window closing regardless of os
app.on('window-all-closed', function() {
    app.quit();
})