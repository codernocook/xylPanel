# How to use xylPanel

<h></h>

- Check out release page: https://github.com/codernocook/xylPanel/releases

- Server Configuration:
    + Clone the github repo, by typing: "https://github.com/codernocook/xylPanel". Make sure you have `git` installed on your system
    + Go to `env.json`, and edit file. The file has explanation, just fill it outm
    + Type `npm i` or `npm install` (make sure you have npm installed), and wait until it install all dependencies
    + To start the server, type: `node index.js
    + Get server websocket ip
      - If you **CAN** port forwarding:
        + Get the host computer public IP (the IP is accessable by public, can be connected from the outside)
        + In the `env.json`, there's a property named `port`, try to port forwarding that port (TCP)
        + Make sure to note the **IP** and **PORT** out, so you can fill it out in the client panel
      - If you **CAN'T** port forwarding:
        + Get the host computer local IP (The IP that has header `196.192`, like: "192.168.x.x"). You can get it by typing `ifconfig` or `ipconfig`
        + In the `env.json`, there's a property for `port`, try to port forwarding that port (TCP)
        + Make sure to note the **IP** and **PORT** out, so you can fill it out in the client panel (Make sure you're in the same network, Because you can't access the panel outside a network without port forwarding)
    + If you can't get it, then just check the `env.json.sample` to see an example of the file, you can copy all of it to `env.json`, make sure it fill it again.

- Client login:
  + You have to download the file "xylPanelFrontend.html" from the release page (choose latest release to download it)
  + After download, open file with browser or drag it in.
  + Websocket IP: It's the IP that you host on your server, If your server don't have Port forwarding then use local address (like: 196.192.x.x, The `Server Configuration`)
  + Websocket PORT: The port that you put in `env.json`, the property is named: `port`
  + Websocket authToken: The password (key) that you set in `env.json`, the property is named: `authToken`

# User JSON (The user json data will send to server)
```json
{
    "authToken": "this is the key login into server",
    "action": "we have 5 type, stop, start, restart, login, get_log, cmd (this is for command) ; if you want to 'stop' then just type put 'stop' in the 'action' of the user json",
    "command": "if action you want is send command, then make sure the action is 'cmd'; and this line will use to send the command and execute ; if you don't want to execute and just do action, this line should be an empty string"
}
```


# Server response (Server respond back to user)
```json
{
    "success": "true/false typeof boolean",
    "serverMessage": "this maybe an error if server return back, but if server message return is 'logged_in' or 'get_log' mean it's the message and not the error",
    "message": "The message return back, if nothing then undefined"
}
```

# Now, how to stop the panel backend, if someone restart

- It's now running in background, so to stop. I recommend to stop all the nodejs instance, by typing:
```bash
sudo killall node
```

Also the `env.json` explained it all, if you still not then:

- authToken: the password access to the backend server and do task
- machineId: This is the name of machine, you can ignore it. But I recommend you to fill, like "root@arch" or like "root@kali"; it's your
- startDirectory: The directory you want to access after connected to the backend
- port: the port you want to open on, make sure it's a number, like you want it to be, 443:
```json
"port": 443
```
- log_maximum: If the log file contain more character than you want, like: 100000; and you want to clear it; by just replace the explain string with the maximum number
- log_min: If you want to clear all the text in the log file, just type as same as `log_maximum`, if you want clear first 10 character or whatever you want, just replace the string with the number you want
