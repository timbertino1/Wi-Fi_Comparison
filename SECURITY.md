# Security Policy

## Supported versions

Only the latest version on the `main` branch is supported. Fixes are not backported.

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's
[private vulnerability reporting](https://github.com/timbertino1/Wi-Fi_Comparison/security/advisories/new)
rather than opening a public issue.

Include:

- what you found and where (file, tab, or URL fragment),
- steps to reproduce, and the browser and operating system you used,
- the impact you believe it has.

Do **not** include patient information, protected health information, or details that identify a
real facility or its network in your report. This site uses fictional scenarios only.

You can expect an acknowledgement within 7 days. Accepted issues are fixed on `main` and credited
in the release notes unless you ask otherwise.

## Scope

The site is a static, offline-capable page with no backend, accounts, or network requests. Reports
about its Content-Security-Policy, content rendering, dependencies, or the repository's CI
configuration are in scope. Guidance for hosting it securely is in
[docs/hosting-security.md](docs/hosting-security.md).
