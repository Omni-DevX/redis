const net = require("net");
const storage = {}

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
  // Handle connection
  connection.on('data',(data)=>{
    const commands = data.toString().split('\r\n');
    if(commands[2].toLowerCase() === 'echo'){
        return connection.write('$'+commands[4].length+'\r\n'+commands[4]+'\r\n');
    }
    if(commands[2].toLowerCase() === 'set'){
        storage[commands[4]] = commands[6];
        return connection.write('+OK\r\n');
    }
    if(commands[2].toLowerCase() === get){
        if(storage[commands[4]].length){
        return connection.write('$'+storage[commands[4]].length+'\r\n'+storage[commands[4]]+'\r\n');
        }
        return connection.write('$-1\r\n');
    }
    connection.write('+PONG\r\n');
  })
});


server.listen(6379, "127.0.0.1");
