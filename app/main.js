const net = require("net");
const fs = require("fs");
const { join } = require('path');
const storage = {}
const config = new Map();
const dataStorage = new Map();
const opcodes = {
    resizeDb : 'fb'
}



// You can use print statements as follows for debugging, they'll be visible when running tests.
const argument = process.argv.slice(2);
const [fileDir,fileName] = [argument[1]??null, argument[3]??null];

function getAllKeys() {
    const keys = Object.keys(dataStorage);
    let response = "";
    for (let key of keys) {
      response += `$${key.length}\r\n${key}\r\n`;
    }
    return connection.write(`*${keys.length}\r\n` + response);
}

if(fileDir && fileName){
    config.set('dir',fileDir);
    config.set('dbfilename', fileName);
}

const data = fs.readFileSync(join(config.get('dir'),config.get('dbfilename')), (err, data)=>{
    if(err){
        console.log(err);
        return;
    }
    return data;
})

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

hashTable = ()=>{
    const length = getKeyLength();
    const bytes = getNextBytesWithLength(length);
}

expiryHashTable = ()=>{
    const length = getKeyLength();
    const bytes = getNextBytesWithLength(length);
}

while(i < data.length){
    const currentByte = data[i].toString(16);
    if(currentByte === opcodes.resizeDb){
        console.log('Inside while loop');
        i++;
        hashTable();
        expiryHashTable();
        const keyLength = getKeyLength();
        const key = getNextBytesWithLength(keyLength);
        const valueLength = getKeyLength();
        const value = getNextBytesWithLength(valueLength);
        console.log('key',key.toString(),'value',value.toString());
        dataStorage[key] = value;
    }
    i++;
}

// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
  // Handle connection
  connection.on('data',(data)=>{
    const commands = data.toString().split('\r\n');
    if(commands[2].toLowerCase() === 'echo'){
        return connection.write('$'+commands[4].length+'\r\n'+commands[4]+'\r\n');
    }
    if(commands[2].toLowerCase() === 'set'){
        //storage[commands[4]] = commands[6];
        dataStorage.set(commands[4], commands[6]);
        if(commands[10]){
            setTimeout(()=>{
                dataStorage.delete(commands[4]);
            }, commands[10]);
        }
        return connection.write('+OK\r\n');
    }
    if(commands[2].toLowerCase() === 'get'){
        if(storage[commands[4]]){
        return connection.write('$'+dataStorage.get(commands[4]).length+'\r\n'+dataStorage.get(commands[4])+'\r\n');
        }
        return connection.write('$-1\r\n');
    }
    if(commands[2].toLowerCase() === 'config'){
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
    if(commands[4].toLowerCase() === 'keys'){
        getAllKeys();
    }

    connection.write('+PONG\r\n');
  })
});


server.listen(6379, "127.0.0.1");
