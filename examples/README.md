# Hermes example

To test this out, open a terminal window and write:

```
npm install mqtt -g
```

Navigate to the example directory and write:

```
npm install hermes-mqtt hermes-socketio
```

Start the server:

```
sudo npm run test
```

It needs `sudo` to listen on port 80.

You can now try sending a message to the broker the example is connected to:

```
mqtt pub -t 'hello/world' -h 'test.mosquitto.org' -m 'Hola'
```

**Note this is an echo server**.

Open a web browser, navigate to `http://localhost` and open the console.

Try sending messages from terminal as we did before:

```
mqtt pub -t 'hello/world' -h 'test.mosquitto.org' -m 'Hola'
```

You should now see messages being logged on your browser console.

If you want to send messages from client to broker, try clicking the button that says "Say Hello".
Have a look at your terminal after clicking.

Feel free to play around.
