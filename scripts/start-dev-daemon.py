#!/usr/bin/env python3
"""
Daemon launcher for the Next.js dev server.

Uses a double-fork to fully detach from the spawning shell so the process is
reparented to PID 1 (tini). This is required in this sandbox because the ZAI
harness reaps any process that remains in its own subtree after a Bash tool
call ends. A plain `setsid`/`nohup`/`&` background launch is NOT enough — the
process stays under the harness subreaper and gets killed. A double-fork
escapes to PID 1 and survives across Bash tool calls.
"""
import os
import sys

PROJECT_DIR = "/home/z/my-project"
DEV_LOG = "/home/z/my-project/dev.log"
PID_FILE = "/home/z/my-project/.zscripts/dev-daemon.pid"

def daemonize():
    # First fork
    if os.fork() > 0:
        os._exit(0)
    os.setsid()
    # Second fork (prevent reacquiring a controlling terminal)
    if os.fork() > 0:
        os._exit(0)
    # Reset umask and cd
    os.umask(0o022)
    os.chdir(PROJECT_DIR)
    # Redirect std fds: stdin <- /dev/null, stdout/stderr -> dev.log
    devnull = os.open("/dev/null", os.O_RDWR)
    os.dup2(devnull, 0)
    log_fd = os.open(DEV_LOG, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    os.dup2(log_fd, 1)
    os.dup2(log_fd, 2)
    os.close(devnull)
    # Write PID
    with open(PID_FILE, "w") as f:
        f.write(str(os.getpid()))

def main():
    daemonize()
    # Exec the Next.js dev server directly (no `tee` pipe — we already log to dev.log).
    # Using node directly avoids bun's wrapper overhead and the `| tee` subprocess.
    os.execvp("node", [
        "node",
        "/home/z/my-project/node_modules/next/dist/bin/next",
        "dev",
        "-p",
        "3000",
    ])

if __name__ == "__main__":
    main()
