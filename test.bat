for /f "delims=" %%i in ('rclone obscure "fcic."') do set OBSCURED_PASS=%%i
start "cloud.fcic.cc" rclone mount :webdav: V: --webdav-url="https://cloud.fcic.cc/webdav" --webdav-vendor="other" --webdav-user="fcic" --webdav-pass="%OBSCURED_PASS%" --vfs-cache-mode=full --vfs-links --volname="cloud.fcic.cc"

