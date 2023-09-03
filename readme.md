# How to use xyl panel

<h></h>

- User JSON send to server => process

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