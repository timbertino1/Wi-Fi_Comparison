# Hosting the Explainer Securely

The site is a folder of static files (`dist/`). It needs no server-side code, database, cookies or
write access, and it makes no network requests of its own. It already ships a strict
Content-Security-Policy as a `<meta>` tag, so it works safely when opened from disk. When you host
it, also send the headers below — some protections (such as blocking framing) can only be set as
HTTP headers.

## Recommended response headers

| Header | Value | Why |
|--------|-------|-----|
| `Content-Security-Policy` | see below | Same policy as the page's meta tag, plus `frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` | Stops browsers from guessing file types |
| `Referrer-Policy` | `no-referrer` | Reference links never leak the page address |
| `X-Frame-Options` | `DENY` | Blocks framing in older browsers (clickjacking) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=()` | The site uses none of these features |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the page from windows it opens |
| `Strict-Transport-Security` | `max-age=31536000` | Only when served over HTTPS |

Content-Security-Policy value (one line):

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

This is the policy from `specs/001-wifi7-healthcare-explainer/research.md` (R12) with
`frame-ancestors 'none'` added (a meta tag cannot set it). It was verified with zero violations in
Chromium, Firefox and WebKit, from both `file://` and HTTP (`tests/e2e/security.spec.js`).

## IIS (`web.config` in the site folder)

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <add name="Content-Security-Policy" value="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="Referrer-Policy" value="no-referrer" />
        <add name="X-Frame-Options" value="DENY" />
        <add name="Permissions-Policy" value="camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=()" />
        <add name="Cross-Origin-Opener-Policy" value="same-origin" />
      </customHeaders>
    </httpProtocol>
    <staticContent>
      <remove fileExtension=".map" />
      <mimeMap fileExtension=".map" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

## nginx

```nginx
location / {
    root /var/www/wifi7-explainer;
    add_header Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header X-Frame-Options "DENY" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
}
```

## Apache (`.htaccess` or virtual host)

```apache
Header always set Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "no-referrer"
Header always set X-Frame-Options "DENY"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=()"
Header always set Cross-Origin-Opener-Policy "same-origin"
```

## Notes

- Serve the folder read-only. Nothing on the site writes to the server.
- The only data stored in the browser is the viewer's theme, motion and audience preferences
  (`localStorage`, one key). No cookies, analytics or tracking.
- `app.js.map` and `app.js.LEGAL.txt` are optional: the source map helps debugging, and the legal
  file carries third-party licence notices. Keep the legal file if you remove the map.
