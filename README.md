# Gitlab Raw Files URL Rewritter

Gitlab up to version 13, does not support serving raw files **without query strings**, [see issue 19189](https://gitlab.com/gitlab-org/gitlab/-/issues/19189).

Serving raw files without query strings is necessary to use Gitlab as a [Source Server](https://docs.microsoft.com/en-us/windows/win32/debug/source-server-and-source-indexing)  for Microsoft Debugging Tools.

This small express application acts as a proxy, receiving raw file requests *without query strings* and converting them to Gitlab API request (that use query strings).