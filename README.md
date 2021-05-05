# GReWritter

Gitlab Raw Files URL Rewritter

Gitlab up to version 13, does not support serving raw files **without query strings**, [see issue 19189](https://gitlab.com/gitlab-org/gitlab/-/issues/19189).

Serving raw files without query strings is necessary to use Gitlab as a [Source Server](https://docs.microsoft.com/en-us/windows/win32/debug/source-server-and-source-indexing)  for Microsoft Debugging Tools.

This small express application acts as a proxy, receiving raw file requests *without query strings* and converting them to Gitlab API request (that use query strings).

The target Gitlab instance URL is specified by setting the environmental viriable `GITLAB_URL` before runing the server.

As an example, if grewritter is ran with the `example.com` domain and the target Gitlab instance URL is `gitlab.com`, then the request:

```
https://example.com/token/${gitlab_pa_token}/proj/${project_name}/commit/${commit_hash}/path/${file_path}/file/${file_name}
```

Is rewritten as:

```
https://gitlab.com/api/v4/projects/${project_name}/repository/files/${file_path}%2F${file_name}/raw?ref=${commit_hash}&private_token=${gitlab_pa_token}
```

Where:

* `gitlab_pa_token` : Is the Gitlab [Personal Access Token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) which **must have read permissions**.

* `project_name` : Is the combination of user name and repository name, separated by a percent encoded forward slash, e.g. `username%2Freponame`.

* `commit_hash` : Is the **full** commit hash of the requested target file version.

* `file_path` : Is the percent encoded relative directory of the target file (without the file name). Relative to the repository root.

* `file_name` : Is the percent encoded target file name.

**IMPORTANT** : the `project_name`, `file_path` and `file_name` must be percent encoded, i.e. all forward slashes `/` must be converted to `%2F`.

## Run with Node

```bash
npm install
export GITLAB_URL="https://my_gitlab.com"
node grewritter.js
```

## Run with Docker

```bash
docker run --name grewritter --privileged \
--env GITLAB_URL="https://my_gitlab.com" \
-p 3000:3000 \
juangburgos/grewritter
```

## Run behind Proxy

When running behind a reverse proxy, add the `nocanon` keyword to avoid double encoding of urls.

An example apache config is:

```apache
<VirtualHost *:443>

#   General setup for the virtual host
ServerName my_gitlab.com
ServerAdmin admin@my_gitlab.com

#   SSL Engine Switch:
SSLEngine on
SSLCertificateFile "/etc/letsencrypt/live/my_gitlab.com/fullchain.pem"
SSLCertificateKeyFile "/etc/letsencrypt/live/my_gitlab.com/privkey.pem"

AllowEncodedSlashes NoDecode
ProxyPreserveHost On
RewriteEngine On
ProxyPass / http://grewritter:3000/ nocanon
ProxyPassReverse / http://grewritter:3000/
RequestHeader set X-Forwarded-Ssl on

<FilesMatch "\.(cgi|shtml|phtml|php)$">
    SSLOptions +StdEnvVars
</FilesMatch>
<Directory "/usr/local/apache2/cgi-bin">
    SSLOptions +StdEnvVars
</Directory>

BrowserMatch "MSIE [2-5]" \
         nokeepalive ssl-unclean-shutdown \
         downgrade-1.0 force-response-1.0

CustomLog "/usr/local/apache2/logs/ssl_request_log" \
          "%t %h %{SSL_PROTOCOL}x %{SSL_CIPHER}x \"%r\" %b"

</VirtualHost>  
```