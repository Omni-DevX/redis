const net = require("net");
const fs = require("fs");
const { join } = require('path');
const storage = {}
const config = new Map();
const dataStorage = new Map();



// You can use print statements as follows for debugging, they'll be visible when running tests.
const argument = process.argv.slice(2);
const [fileDir,fileName] = [argument[1]??null, argument[3]??null];

function getAllKeys() {
    const keys = [...dataStorage.keys()] 
    allKeys = '*'+keys.length;
    for(const key of keys){
        allKeys+= '\r\n$'+key.length+'\r\n'+key+'\r\n';
    }   
    return allKeys; 
}

if(fileDir && fileName){
    config.set('dir',fileDir);
    config.set('dbfilename', fileName);
}
console.log(config.get('dir'));

fs.readFile(join(config.get('dir'),config.get('dbfilename')), (err, data)=>{
    if(err){
        console.log(err);
        return;
    }
    console.log(data);
})

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
        return connection.write(getAllKeys());
    }

    connection.write('+PONG\r\n');
  })
});


server.listen(6379, "127.0.0.1");
