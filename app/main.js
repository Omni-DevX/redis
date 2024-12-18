const net = require("net");
const fs = require("fs");
const { join } = require('path');
const storage = {}
const config = new Map();
var dataStorage = new Map();
const opcodes = {
    resizeDb : 'fb'
}



// You can use print statements as follows for debugging, they'll be visible when running tests.
const argument = process.argv.slice(2);
const [fileDir,fileName] = [argument[1]??null, argument[3]??null];

function getAllKeys() {
    let response = "";
    for (let [key, value] of dataStorage) {
      response += `$${key.length}\r\n${key}\r\n`;
    }
    console.log(response, dataStorage.size);
    return `*${dataStorage.size}\r\n` + response;
}

if(fileDir && fileName){
    config.set('dir',fileDir);
    config.set('dbfilename', fileName);
}
let data;

let i = 0;
const getKeyLength = ()=>{
    const firsByte = data[i];
    const whatTypeOfLengthEncoding = firsByte >> 6;
    let length = 0;
    switch(whatTypeOfLengthEncoding){
        case 0b00:
            length = firsByte ^ 0b00000000;
            i++;
            break;
    }
        return length;
}

const getNextBytesWithLength = (length)=>{
    let nextBytes = Buffer.alloc(length);
    for(let k = 0; k<length ; k++){
        nextBytes[k] = data[i];
        i++;
    }
    return nextBytes;
}
let hashTableLength = 0;
hashTable = ()=>{
    const length = getKeyLength();
    hashTableLength = length
    const bytes = getNextBytesWithLength(length);
}
let expiryHashTableLength = 0;
expiryHashTable = ()=>{
    const length = getKeyLength();
    expiryHashTableLength = length;
    const bytes = getNextBytesWithLength(length);
}

function getFileData(){
    data = fs.readFileSync(join(config.get('dir'),config.get('dbfilename')), (err, data)=>{
       if(err){
           console.log(err);
           return;
       }
       return data;
   })
   while(i < data.length){
       const currentByte = data[i].toString(16);
       if(currentByte === opcodes.resizeDb){
           const n = getKeyLength()
           for(let i=0; i<n; i++){
           const keyLength = getKeyLength();
           const key = getNextBytesWithLength(keyLength);
           const valueLength = getKeyLength();
           const value = getNextBytesWithLength(valueLength);
           console.log('key',key.toString(),'value',value.toString());
           dataStorage.set(key.toString(), value.toString());
           }
           i++;
       }
       i++;
   }
   console.log(dataStorage);
   }

   if (config.get('dir') && config.get('dbfilename')) {
    const dbPath = join(config.get('dir'), config.get('dbfilename'));
    const isDbExists = fs.existsSync(dbPath);
    if(isDbExists){
    getFileData();
    }
   }

// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
 
  // Handle connection
  connection.on('data',(data)=>{
    const commands = data.toString().split('\r\n');
    if(commands[2].toLowerCase() === 'echo'){
        return connection.write('$'+commands[4].length+'\r\n'+commands[4]+'\r\n');
    }
    else if(commands[2].toLowerCase() === 'set'){
        //storage[commands[4]] = commands[6];
        dataStorage.set(commands[4], commands[6]);
        if(commands[10]){
            setTimeout(()=>{
                dataStorage.delete(commands[4]);
            }, commands[10]);
        }

        return connection.write('+OK\r\n');
    }
    else if(commands[2].toLowerCase() === 'get'){
        if(dataStorage.get(commands[4])){
        return connection.write('$'+dataStorage.get(commands[4]).length+'\r\n'+dataStorage.get(commands[4])+'\r\n');
        }
        return connection.write('$-1\r\n');
    }
    else if(commands[2].toLowerCase() === 'config'){
        if(commands[4].toLowerCase() === 'get'){
            if(commands[6].toLowerCase() === 'dir'){
                console.log(config.get('dir').length);
                return connection.write('*2\r\n$3\r\ndir\r\n$'+config.get('dir').length+'\r\n'+config.get('dir')+'\r\n');
            }
            if(commands[6].toLowerCase() === 'dbfilename'){
                return connection.write('*2\r\n$10\r\ndbfilename\r\n$'+config.get('dbfilename').length+'\r\n'+config.get('dbfilename')+'\r\n');
            }
        }
    }
    else if(commands[2].toLowerCase() === 'keys'){
        return connection.write(getAllKeys());
    }
    return connection.write('+PONG\r\n')
  })
});


server.listen(6379, "127.0.0.1");
