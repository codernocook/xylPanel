/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Access
const authToken = require("./env.json")["authToken"];
const machineId = require("./env.json")["machineId"] || "root@xyl";

// require
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { exec } = require('child_process');
const pty = require('node-pty');
const fs = require("fs-extra");
const os = require("os");

// Error handler
process.on("uncaughtException", () => {});

// Time
const before_runTime = Date.now();

// Start express server
const app = express();

// initialize a simple http server
const server = http.createServer(app);

// initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

// Log file
if (!fs.existsSync("./xyl_exec.log")) {
    fs.createFileSync("./xyl_exec.log");
}

// Connections
const connections = new Map();

// Create terminal session
let term = pty.spawn(os.platform() === 'win32' ? 'powershell.exe' : 'bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: require("./env.json")["startDirectory"] || "./",
    env: process.env
});

term.on("data", (data) => {
    connections.forEach((user) => {
        try {
            // Save log
            writeLog(null, data?.toString(), Date.now(), "natural", 0);

            // Send
            ws_send(user["userid"], user["ws"], JSON.stringify({ "success": true, "serverMessage": undefined, "message": data?.toString()}), 0)
        } catch {}
    })
})

// Write log file
const writeLog = (cmd, res, time, logType, failedCounter) => {
    if (failedCounter >= 5) return;

    try {
        if (!fs.existsSync("./xyl_exec.log")) {
            fs.createFileSync("./xyl_exec.log");
        }
    
        if (fs.existsSync("./xyl_exec.log")) {
            // Limit
            if (fs.readFileSync("./xyl_exec.log", "utf-8")?.toString().length > Number(require("./env.json")["log_maximum"]) || 500000) {
                fs.writeFileSync("./xyl_exec.log", `${fs.readFileSync("./xyl_exec.log", "utf-8")?.toString().slice(Number(require("./env.json")["log_min"]) || 100000)}`);
            }

            // Write
            if (logType === "natural") {
                fs.writeFileSync("./xyl_exec.log", `${fs.readFileSync("./xyl_exec.log", "utf-8")?.toString() || ""}\n${res?.toString()}`);
            } else if (logType === "steroid") {
                fs.writeFileSync("./xyl_exec.log", `${fs.readFileSync("./xyl_exec.log", "utf-8")?.toString() || ""}\n${machineId || "root@xyl"}: ${cmd}\n> [${time}]: ${res}\n`);
            }
        }
    } catch {
        setTimeout(() => {
            writeLog(cmd, res, time, logType, failedCounter + 1 || 0);
        }, 250);
    }
}

// Custom websocket send (disconnect if fail more than 10 times)
const ws_send = (user, ws, msg, attempt) => {
    if (attempt >= 10) {
        // Disconnect
        if (connections.get(user?.toString())) {
            connections.delete(user?.toString());
        }
    }

    try {
        ws.send(msg);
    } catch {
        ws_send(user, ws, msg, attempt ? attempt + 1 : 0);
    }
}

wss.on("connection", (ws) => {
    // websocket connection key
    let ws_connectionKey = undefined;

    // connection is up, let"s add a simple simple event
    ws.on("message", (msg) => {
        // log the received message and send it back to the client
    
        // Owner access
        try {
            if (JSON.parse(msg)) {
                const json_msg = JSON.parse(msg);

                if (json_msg["authToken"] !== undefined && json_msg["authToken"] !== null && json_msg["userid"]) {
                    if ((json_msg["authToken"] === authToken) && (authToken === json_msg["authToken"])) {
                        // Logged in (add to connections)
                        if (!connections.get(json_msg["userid"])) {
                            connections.set(json_msg["userid"], {"userid": json_msg["userid"], "ws": ws});
                            ws_connectionKey = json_msg["userid"];
                        }
                        
                        if (json_msg["action"] !== undefined && json_msg["action"] !== null) {
                            const execTime = Date.now();

                            if (json_msg["action"] === "stop") {
                                exec(os.platform() === "win32" ? "shutdown -s -t 0" : "shutdown -h now", (err, stdout, stderr) => {
                                    if (err) {
                                        writeLog("machine.shutdown()", stderr, execTime, "steroid", 0);
                                        return ws_send(json_msg["userid"], ws, JSON.stringify({ "success": true, "serverMessage": undefined, "message": `${machineId || "root@xyl"}: machine.shutdown()\n> [${execTime}]: ${stderr}` }), 0);
                                    }

                                    // No error when execute found
                                    writeLog("machine.shutdown()", stdout, execTime, "steroid", 0);
                                    return ws_send(json_msg["userid"], ws, JSON.stringify({ "success": true, "serverMessage": undefined, "message": `${machineId || "root@xyl"}: machine.shutdown()\n> [${execTime}]: ${stdout}` }), 0);
                                })

                                // Prevent another exectute
                                return;
                            } else if (json_msg["action"] === "restart") {
                                exec(os.platform() === "win32" ? "shutdown -r -t 0" : "reboot", (err, stdout, stderr) => {
                                    if (err) {
                                        writeLog("machine.reboot()", stderr, execTime, "steroid", 0);
                                        return ws_send(json_msg["userid"], ws, JSON.stringify({ "success": true, "serverMessage": undefined, "message": `${machineId || "root@xyl"}: machine.reboot()\n> [${execTime}]: ${stderr}` }), 0);
                                    }

                                    // No error when execute found
                                    writeLog("machine.reboot()", stdout, execTime, "steroid", 0);
                                    return ws_send(json_msg["userid"], ws, JSON.stringify({ "success": true, "serverMessage": undefined, "message": `${machineId || "root@xyl"}: machine.reboot()\n> [${execTime}]: ${stdout}` }), 0);
                                })

                                // Prevent another exectute
                                return;
                            } else if (json_msg["action"] === "cmd") {
                                term.write(json_msg["command"]?.toString() + "\n")

                                // Prevent another exectute
                                return;
                            } else if (json_msg["action"] === "login") {
                                return ws_send(json_msg["userid"], ws, JSON.stringify({ "success": false, "serverMessage": "logged_in", "message": undefined }), 0);
                            } else if (json_msg["action"] === "restart_terminal") {
                                term.kill();

                                require("child_process").spawn(process.argv.shift(), process.argv, {
                                    cwd: process.cwd(),
                                    detached : true,
                                    stdio: "inherit"
                                });

                                writeLog("machine.terminalRestart()", "Restarting", Date.now(), "steroid", 0);
                                ws_send(json_msg["userid"], ws, JSON.stringify({ "success": true, "serverMessage": undefined, "message": `${machineId || "root@xyl"}: machine.terminalRestart()\n> Restarting` }), 0);

                                process.exit(0);
                            } else if (json_msg["action"] === "get_log") {
                                try {
                                    return ws_send(json_msg["userid"], ws, JSON.stringify({ "success": true, "serverMessage": "get_log", "message": `${fs.readFileSync("./xyl_exec.log", "utf-8")?.toString() || ""}` }), 0);
                                } catch {}
                            }

                            // Not match any? meaning it's not vaild
                            return ws_send(json_msg["userid"], ws, JSON.stringify({ "success": false, "serverMessage": "invaild_action", "message": undefined }), 0);
                        } else {
                            ws_send(json_msg["userid"], ws, JSON.stringify({ "success": false, "serverMessage": "missing_action", "message": undefined }), 0)
                        }
                    } else {
                        ws_send(json_msg["userid"], ws, JSON.stringify({ "success": false, "serverMessage": "invaild_authToken", "message": undefined }), 0)
                    }
                } else {
                    ws_send(json_msg["userid"], ws, JSON.stringify({ "success": false, "serverMessage": "missing_authToken", "message": undefined }), 0)
                }
            }
        } catch {}
    });

    // Remove user if websocket connection disconnected
    ws.on("close", () => {
        if (ws_connectionKey) {
            if (connections.get(ws_connectionKey)) {
                connections.delete(ws_connectionKey);
            }
        }
    })

    // send immediatly a feedback to the incoming connection    
    ws.send(JSON.stringify({ "success": false, "serverMessage": "no_data_sent", "message": undefined }));
});

// start our server
server.listen(Number(require("./env.json")["port"]) || 80, () => {
    console.log(`[xylPanel]: Server started on port ${server.address().port} | Took ${Date.now() - before_runTime}ms to run`);
});
