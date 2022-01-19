let http = require('http')
let fs = require('fs')
let url = require('url')
const pathFiles = require('path');
let port = process.argv[2]

if(!port){
    console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}

let server = http.createServer(function(request, response){
    let parsedUrl = url.parse(request.url, true)
    let pathWithQuery = request.url
    let queryString = ''
    if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    let path = parsedUrl.pathname
    let query = parsedUrl.query
    let method = request.method

    /******** 从这里开始看，上面不要看 ************/

    console.log('是谁发请求过来啦！路径（带查询参数）为：' + pathWithQuery)


    if (path === '/signIn' && method === 'POST') {
        response.setHeader('Content-Type','text/html; charset=utf-8');
        const userArray = JSON.parse(fs.readFileSync('./db/users.json').toString());
        const array = [];
        // data 上传事件
        request.on('data', (chunk)=>{
            array.push(chunk);
        })
        request.on('end', ()=>{
            const string = Buffer.concat(array).toString();
            const obj = JSON.parse(string);
            // id 为最后一个用户的id+1
            const user = userArray.find((user)=>
                user.name === obj.name && user.password === obj.password
            )
            if (user === undefined) {
                response.statusCode = 400;
                response.setHeader('Content-Type','text/json; charset=utf-8');
                response.end(`{"errorCode" : 531}`);
            }else {
                response.statusCode = 200;
                const random = Math.random();
                const session = JSON.parse(fs.readFileSync('public/session.json').toString());
                session[random] = {user_id: user.id};
                fs.writeFileSync('public/session.json',JSON.stringify(session));
                response.setHeader('Set-Cookie',`session_id=${random}; HttpOnly;`)
                response.end()
            }
            response.end();
        })
    } else if (path === '/home.html') {
        const cookie = request.headers['cookie'];
        let sessionId;
        try {
            sessionId = cookie.split(';').filter(string => string.indexOf('session_id=')>=0)[0].split('=')[1];
        }catch (err) {

        }
        console.log(sessionId)
        const session = JSON.parse(fs.readFileSync('public/session.json').toString());
        if (sessionId && session[sessionId]) {
            const userId = session[sessionId].user_id;
            console.log(userId)
            const userArray = JSON.parse(fs.readFileSync('./db/users.json').toString());
            const user = userArray.find(user => user.id === userId);
            const homeHtml = fs.readFileSync('./public/home.html').toString();
            let string;
            console.log(user);
            if (user) {
                string = homeHtml.replace('{{loginStatus}}','已登录')
                    .replace('{{user.name}}',user.name);
            } else {
                string = homeHtml.replace('{{loginStatus}}','未登录')
                    .replace('{{user.name}}','');
            }
            response.write(string);
            response.end()
        } else {
            const homeHtml = fs.readFileSync('./public/home.html').toString();
            const string = homeHtml.replace('{{loginStatus}}','未登录')
                .replace('{{user.name}}','');
            response.write(string);
            response.end()

        }
    } else if (path === '/register' && method === 'POST') {
        response.setHeader('Content-Type','text/html; charset=utf-8');
        const userArray = JSON.parse(fs.readFileSync('./db/users.json').toString());
        const array = [];
        // data 上传事件
        request.on('data', (chunk)=>{
            array.push(chunk);
        })
        request.on('end', ()=>{
            const string = Buffer.concat(array).toString();
            const obj = JSON.parse(string);
            const lastUser = userArray[userArray.length-1];
             // id 为最后一个用户的id+1
            const newUser = {
                id:lastUser ? lastUser.id + 1 : 1,
                name: obj.name,
                password: obj.password
            }
            userArray.push(newUser);
            fs.writeFileSync('db/users.json',JSON.stringify(userArray));
            response.end();
        })
    } else {
        response.statusCode = 200
        // 默认首页
        const filePath = path === '/' ? '/index.html' : path;
        const indexFile = pathFiles.extname(filePath);
        const fileTypes = {
            '.html':'text/html',
            '.css' :'text/css',
            '.js'  :'text/javascript',
            '.png' :'image/png',
            '.jpg' :'image/jpeg'
        }
        response.setHeader('Content-Type', `${fileTypes[indexFile] || 'text/html'};charset=utf-8`)
        let content;
        try {
            content = fs.readFileSync(`./public/${filePath}`);
        }catch (err) {
            content = '文件不存在';
            response.statusCode = 404;
        }

        response.write(content)
        response.end()
    }

    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)


