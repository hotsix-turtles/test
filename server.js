const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');

const SERVER_PORT = 3000;

app.use(cors());

global.users = [];
global.chats = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

io.on('connection', (sock) => {
    const join_data = { users: users, chats: chats };
    io.sockets.emit('join', join_data);

    sock.on('heartbeat', (data) => {
        for (let i = 0; i < users.length; i++)
            if (users[i].nickname == data.sender) users[i].heartbeat = 10;
    });

    sock.on('join', (data) => {
        users.push({ nickname: data.sender, timestamp: Date.now(), heartbeat: 10 });

        const chat_data = {};
        chat_data.id = chats.length;
        chat_data.timestamp = Date.now();
        chat_data.sender = 'system';
        chat_data.message = data.sender + '님이 들어왔습니다.'
        io.sockets.emit('chat', chat_data);

        const join_data = { users: users, chats: chats };
        io.sockets.emit('join', join_data);
    });

    sock.on('msg', (data) => {
        if (!users.filter((v,i,a) => v.nickname == data.sender).length) return;

        data.id = chats.length;
        data.timestamp = Date.now();
        chats.push(data);

        io.sockets.emit('chat', data);
    });

    sock.on('exit', (data) => {
        users = users.filter((v,i,a) => v.nickname != data.sender);

        const chat_data = {};
        chat_data.id = chats.length;
        chat_data.timestamp = Date.now();
        chat_data.sender = 'system';
        chat_data.message = data.sender + '님이 나갔습니다.'

        io.sockets.emit('chat', chat_data);
    });
});

http.listen(SERVER_PORT, () => {
    console.log('server listening @ %d', SERVER_PORT);
});

function heartbeat() {
    if (users)
    {
        for (let i = 0; i < users.length; i++)
            users[i].heartbeat = users[i].heartbeat - 1;

        users = users.filter((v,i,a) => v.heartbeat > 0)
    }

    const join_data = { users: users, chats: chats };
    io.sockets.emit('join', join_data);

    setTimeout(heartbeat, 1000);
}

setTimeout(heartbeat, 1000);