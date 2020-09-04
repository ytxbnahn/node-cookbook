'use strict';

const fs = require('fs');
const path = require('path');

const Tiny = require('tiny');
const app = new Tiny();

const Todo = require('./app/model/todo')
const db = new Todo();

app.use((req,res,next)=>{
    const start = Date.now();
    const originFn = res.writeHead;

    res.writeHead = (...args)=>{
        const cost = Date.now() - start;
        res.setHeader('X-Respone-Time',`${cost}ms`);
        console.log(`[Visit] ${req.meethod}${req.url}${res.statusCode}(${cose}ms)`);
        return originFn.call(res,...args);

    };
    next()
})

app.get('/',(req,res)=>{
    res.status(200);
    res.setHeader('Content-Type','text/html');
    const filePath = path.join(__dirname,'app/view/index.html');
    fs.readFile(filePath,(err,content)=>{
        if(err) return errorHandler(err,req,res);
        res.end(content.toString());
    })
})

app.get('/api/todo',(req,res)=>{
    let {completed} = req.query;
    if(req.query.completed!==undefined)completed=completed==='true';

    db.list({completed},(err,data)=>{
        if(err) return errorHandler(err,req,res);
        res.status(200);
        res.json(data);
    })
})

app.use((req,res,next)=>{
    if(req.method !=='POST'&&req.method!=='PUT')return next();

    const buffer = [];

    req.on('data',chunk=>{
        buffer.push(chunk);
    })
    req.on('end',()=>{
        req.body = JSON.parse(Buffer.concat(buffer).toString());
        next();
    })
})

app.post('/api/todo',(req,res)=>{
    db.create(req.body,(err,data)=>{
        if(err)return errorHandler(err,req,res);
        res.status(201);
        res.json(data)
    })
})

app.put(/^\/api\/todo\/(\d+)$/,(req,res)=>{
    const id = req.params[0];

    db.update(id,req.body,err=>{
        if(err)return errorHandler(err,req,res);

        res.status(204);
        res.setHeader('Content-Type','application/json');
        res.end();
    })
})

app.delete(/^\/api\/todo\/(\d+)$/,(req,res)=>{
    db.destroy(req.params[0],err=>{
        if(err) return errorHandler(err,req,res);

        res.status(204);
        res.setHeader('Content-Type','application/json');
        res.end();
    })
})

function errorHandler(err,req,res){
    console.error(`[Error]${req.method}${req.url}got${err.message}`);
    res.status(500);
    res.statusMessage = err.message;
    res.end();
}

app.use((req,res)=>{
    const msg = `[Error]${req.method}${req.url} not found`;
    console.warn(msg);
    res.status(404);
    res.end(msg);

})

if(require.main === module){
    app.listen(3000,()=>{
        console.log('Server running at http://127.0.0.1:3000/')
    })
}

module.exports = app.handle.bind(app)