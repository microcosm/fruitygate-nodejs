Serial Gateway / Node
==
One half of an http gateway for [fruitymesh](https://github.com/mwaylabs/fruitymesh/wiki)-based bluetooth mesh networks.

Say that again?
--
The code in this repo works alongside [serial-gateway-fruitymesh](https://github.com/microcosm/serial-gateway-fruitymesh). The nodejs code from `serial-gateway-node` runs on any internet-enabled computer, and the code from `serial-gateway-fruitymesh` runs on an [NRF51 device](https://www.nordicsemi.com/eng/Products/nRF51-Series-SoC) plugged into that computer.

To have them work together, plug the nRF51 device into the USB port of the computer. For simplicity, it's easiest to use an nRF51 PCA10031 dongle as your gateway device:

![An nRF51 dongle](/img/nRF51_PCA10031.jpg)

When launched, the nodejs app will find the nRF51 device. They work together to form a gateway so that nodes on the local mesh can find nodes on remote meshes which also have http gateways.

The meshes can be in the same building or on the other side of the world.

Your node version
--
Note that this app relies on [serialport](https://github.com/voodootikigod/node-serialport), which as of this writing [does not support](https://github.com/voodootikigod/node-serialport/issues/578) v4.0 releases of nodejs. The code in this repo has been tested against `v0.10.40` - you may find [nvm](https://github.com/creationix/nvm) helpful here.

What you need to get started
--
OK, let's be frank. You want to get started *fast*. There are 9 steps below, and I think these are the best 9 steps to understand this as quickly as possible.

Instead of having you actually set up two meshes in different locations, we'll walk through how to get started with your local gateway. And we will only *simulate* the remote mesh, so you can see how everything will work when you are ready to put more time to it.

Equipment
--
What you need:

1. An nRF51 device flashed with [serial-gateway-fruitymesh](https://github.com/microcosm/serial-gateway-fruitymesh) - this will be your *gateway* device
2. One computer on which you are about to follow these instructions (a laptop is fine, but note you will need 2 free USB ports)
3. At least one other nRF51 device which is *programmed* to talk to the gateway

On that last point - you need another node on the network, otherwise you don't have a mesh network. This other device is not going to *be* a gateway, it's going to be whatever custom program you want to write, but it will have to know how to *talk to* a gateway. To do this, you can look over the instructions for making gateway-compatible apps over on [serial-gateway-fruitymesh](https://github.com/microcosm/serial-gateway-fruitymesh). 

But, again, let's get started quickly and just flash both your nRF51 devices with the gateway code. In order to make the second nRF51 act as a custom app instead of a gateway, toggle the `boolean` switch in `GatewayModule.cpp`. It's near the bottom - you can't miss it! Once you toggle it to `false`, compile and flash the second nRF51 device.

From this point forward we'll call the device which is toggled to *be* a gateway the 'gateway device'. We'll call the other one the 'non-gateway device'.

1. Node it up
--
Clone this repo and install the dependencies:

```
git clone https://github.com/microcosm/serial-gateway-node.git
cd serial-gateway-node
npm install
```

2. Connect the CLI
--
Let's open up a Command Line Interface (CLI) to the gateway device.

- Plug the gateway device into your USB port, unplugging any other nRF51 devices
- In the console, run `node cli`

The device should be discovered automatically, since you only have one plugged in. If it isn't, you will be prompted to run `node list` to find your USB port name. You should give this a whirl anyway so you know how to do it.

- If you are in the CLI, use ctrl-X to close out of it
- Use `node list` to get a list of available USB ports
- Find the USB port name listed alongside the manufacturer 'SEGGER'
- Fire up the CLI again, this time specifying the USB port name:

```
node cli /dev/cu.usbmodemfa131
```

- You should see this:

![The CLI is running](/img/node-cli.png)

It may be followed by a bunch of 'mhTerm' console output - that's fine. This 'mhTerm' thing is the fruitymesh terminal. The CLI will spit out whatever it says, as well as send it whatever you type.

3. Get the gateway node ID
--
- Type the command `status` into the CLI and hit enter.
- Look through the output for a line that says `This is Node XXXXX`.
- Make a note of this node ID - we will refer back to it later as the `GATEWAY_NODE_ID`
- Make sure also that it tells you this is a gateway device

![This is a gateway device](/img/this-is-a-gateway-device.png)

- Use ctrl-X to close the CLI session

4. Boot the 'local' gateway
--
- Run `node gateway 3001`
- You should now see the gateway app fire up and start making connections:

![The local gateway firing up](/img/node-gateway.png)

This is the gateway instance for our 'local' mesh, the one we actually *are* going to run right now. All this gateway instance is doing now is talking to the 'mhTerm' on the gateway device on our behalf.

5. Check out the browser clients
--
- Open a web browser and go to [0.0.0.0:3001](http://0.0.0.0:3001)
- Type in any random number there for target node ID, type some random characters as a message, and hit send

Note that the message is logged at the top of the browser window:

![Browser messages in action](/img/browser-messages.png)

In fact, while you are at it open another browser tab and go to [0.0.0.0:3001](http://0.0.0.0:3001) in that one too. In this new tab, go ahead and type more random target node IDs and messages. You can flip back between the two tabs and see that the commands are being shared in realtime between the two browser tabs.

The messages are actually going via the gateway instance, using two client/server websocket connections. You can verify this by going back to the console and reviewing the gateway logs:

![The gateway is logging activity](/img/gateway-activity.png)

This is great!! We're halfway there. However, right now all this activity is taking place on our local gateway's websockets. As the log shows the gateway is 'pushing' to the serial (where the gateway device is) and other gateways, but we haven't fired them up yet.

6. Fake up a 'remote' gateway
--
It's time to launch the gateway for our pretend 'remote' mesh.

- Open a new console tab and run `node gateway 3002 noserial`.

The `noserial` command tells the app to do everything short of attempting to communicate with any serial ports. It will still make and serve websocket connections, and it will still do the main thing these gateways are designed to do: share messages with other known gateways.

In a 'real' application, this 'remote' gateway might be in San Francisco while the local one might be in New York. The two gateway apps will communicate by making websocket connections between each other.

![Clients are connecting to the gateway](/img/clients-connecting.png)

You can verify the gateways are talking to each other by looking at the gateway logs. You will see entries like the screengrab of [0.0.0.0:3001](http://0.0.0.0:3001) above. It shows that both a browser client and a gateway client connected to it recently.

If they aren't finding each other, make sure you are using the port numbers specified, that is `3001` and `3002`. For the time being this is a proof-of-concept only, until we implement a remote gateway lookup system.

7. Get a head on your custom node
--
Let's add a second node to the local mesh:

- Plug in the non-gateway nRF51 device to another USB port on your computer
- The two devices should start flashing blue to show they have connected
- Open one more console tab and fire up a CLI to the non-gateway device

![This is not a gateway device](/img/this-is-not-a-gateway-device.png)

- This one should tell you here it is *not* a gateway device (because you set the flag to `false` when you flashed it)

Remember the job of this device - in 'real' situations this will be a node that you have custom-coded. Your custom code will send messages to the gateway device destined for the 'remote' mesh. The only reason we are plugging it into the USB port is so you can interact with the CLI.

- Run `status` as before, and make a note of this node's ID
- We will refer to this one later as `NON_GATEWAY_NODE_ID`

8. Let's try...
--
Let's send a message from this node, the one deep in our local mesh. Let's target the message at a (theoretical, non-existent) node on the 'remote' mesh. We will then verify the 'remote' gateway received the message and sent it to any connected web browser clients.

- Open up a couple of web browser tabs for [0.0.0.0:3001](http://0.0.0.0:3001), and a couple more for [0.0.0.0:3002](http://0.0.0.0:3002)
- Position them on the screen so that you can see them all at once
- Head over to the non non-gateway CLI, and type:

```
action GATEWAY_NODE_ID gateway 12345 mymessage
```

A couple of limitations:

1. Your message can be only up to 10 characters, the rest will be truncated
2. Don't use spaces in your message. They would be interpreted by 'mhTerm' as separate arguments

These limitations will likely be lifted in future gateway versions.

Note that the 12345 can be any 5-digit number. Since we are sending this to a non-existent node, we will simply be verifying that the correct ID and message appear in the web browser windows for both [0.0.0.0:3001](http://0.0.0.0:3001) and [0.0.0.0:3002](http://0.0.0.0:3002), in other words that the gateways did their jobs and shared the messages to all interested parties currently around.

- Cover your eyes and press enter

9. OMG. It works!
--
I know, it's exciting. Review the logs in browser and console tabs. You should see a chain of interactions, the upshot of which is that the message from your 'local' non-gateway mesh device was broadcast to a 'remote' web browser client.

If there *were* a remote mesh, the targeted node would receive the message too. Let's prove that by reversing the process - let's send a message from a 'remote' client web browser back to our non-gateway device on the local mesh.

- Type your `NON_GATEWAY_NODE_ID` into the [0.0.0.0:3002](http://0.0.0.0:3002) browser window, enter a short message and send

Reviewing the logs, you should see a chain of interactions, and crucially you should see a message like this on the non-gateway CLI:

![Messages go both ways](/img/inbound.png)

Looks like we're done.

OMG. It didn't work.
--
Yeah, that happens. Just generally in life. Open an issue, I'll try to help.