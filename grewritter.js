// dependencies
const express    = require('express');
const https      = require('https');
let   app        = express();

// environment variables
let gitlab_url      = process.env.GITLAB_URL || 'https://gitlab.com';
let grewritter_port = process.env.GREWRITTER_PORT || 3000;
grewritter_port     = parseInt(grewritter_port);

// setup the body parser
app.use(express.urlencoded({ extended: true }));

// handle root
app.get('/', function(req, res, next){
    res.send(`try url ${req.headers.host}/token/:token/proj/:proj/commit/:commit/path/:path/file/:file`);
    next();
});

// url encode params
let encoder = (req, res, next, param, name) => {
    param = encodeURIComponent(param);
    // windbg encodes again when making a request, converting %2F into %252F, so we need to undo it
    param = param.split('%252F').join('%2F');
    req.params[name] = param;
    next();
};
app.param('token' , (req, res, next, param) => { encoder(req, res, next, param, 'token' ) } );
app.param('proj'  , (req, res, next, param) => { encoder(req, res, next, param, 'proj'  ) } );
app.param('commit', (req, res, next, param) => { encoder(req, res, next, param, 'commit') } );
app.param('path'  , (req, res, next, param) => { encoder(req, res, next, param, 'path'  ) } );
app.param('file'  , (req, res, next, param) => { encoder(req, res, next, param, 'file'  ) } );

// rewritter
app.get('/token/:token/proj/:proj/commit/:commit/path/:path/file/:file', function(req, res) {
    let gitlab_req_url = `${gitlab_url}/api/v4/projects/${req.params.proj}/repository/files/${req.params.path}%2F${req.params.file}/raw?ref=${req.params.commit}&private_token=${req.params.token}`;
    let gitlab_req = https.get(gitlab_req_url, (gitlab_res) => { 
        let data = '';
        gitlab_res.on('data', (chunk) => {
          data += chunk;
        });
        gitlab_res.on('close', () => {
            res.setHeader('content-type', 'text/plain');
            res.send(data); 
        });
    });
    gitlab_req.on('error', (gitlab_err) => {
        res.send(`Encountered an error trying to make a request: ${gitlab_err.message}`); 
    });
});

// listen
console.log(`Listening on: ${grewritter_port}`);
console.log(`Redirecting to: ${gitlab_url}`);

app.listen(grewritter_port);
