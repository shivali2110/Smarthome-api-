const WebSocket = require("ws");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// In-memory list of all connected clients (mobile, dashboard, sh_device).
let deviceList = [];

// Two in-memory maps bridging space_id <-> node_id <-> ws clients.
//   spaceToRootNode : Map<space_id (string) -> root node_id (string)>
//   nodeToSpaceId   : Map<node_id  (string) -> space_id     (string)>
const spaceToRootNode = new Map();
const nodeToSpaceId = new Map();

function printlog(data) {
  console.log(data);
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// Find the nodeId registered for a given ws socket (matched by remote port).

function getNodeIdOfSocket(ws) {
  for (const entry of deviceList) {
    if (
      entry.client.readyState === WebSocket.OPEN &&
      entry.client._socket.remotePort === ws._socket.remotePort
    ) {
      return entry.nodeId;
    }
  }
  return undefined;
}

// Send a payload to the sh_device currently registered under nodeId.
function sendToDevice(nodeId, dataStr) {
  deviceList.forEach(function (entry) {
    if (
      entry.client.readyState === WebSocket.OPEN &&
      entry.nodeId === nodeId &&
      entry.type === "sh_device"
    ) {
      entry.client.send(dataStr);
    }
  });
}

// Send a payload to all dashboard clients registered under this nodeId.
function sendToDashboards(nodeId, dataStr) {
  deviceList.forEach(function (entry) {
    if (
      entry.client.readyState === WebSocket.OPEN &&
      entry.type === "dashboard" &&
      entry.nodeId === nodeId
    ) {
      entry.client.send(dataStr);
    }
  });
}

// Send a payload to the mobile client registered under this spaceId.
function sendToMobileBySpaceId(spaceId, dataStr) {
  let sent = false;
  deviceList.forEach(function (entry) {
    if (
      entry.client.readyState === WebSocket.OPEN &&
      entry.type === "mobile" &&
      entry.nodeId === spaceId
    ) {
      entry.client.send(dataStr);
      sent = true;
    }
  });
  if (!sent) {
    printlog("sendToMobileBySpaceId: no mobile client found for spaceId: " + spaceId);
  }
}

// Resolve a node_id to its space_id, using the cache first and falling
// back to a DB lookup (populating the cache) if not cached yet.
async function resolveNodeIdToSpaceId(nodeId) {
  const cached = nodeToSpaceId.get(nodeId);
  if (cached) {
    return cached;
  }

  const device = await prisma.device_list.findFirst({
    where: { node_id: nodeId },
    select: { space_id: true },
  });

  if (device && device.space_id) {
    const spaceId = String(device.space_id);
    nodeToSpaceId.set(nodeId, spaceId);
    return spaceId;
  }

  return undefined;
}

// Query the DB for a node_id under this space_id that currently has a live,
// connected sh_device socket in deviceList. Returns undefined if no device
// for that space is currently connected.
async function findConnectedNodeForSpace(spaceId) {
  const devices = await prisma.device_list.findMany({
    where: { space_id: Number(spaceId) },
    select: { node_id: true },
  });

  if (!devices || devices.length === 0) {
    return undefined;
  }

  const nodeIds = devices.map((d) => String(d.node_id));
  const connected = deviceList.find(
    (d) =>
      d.type === "sh_device" &&
      d.client.readyState === WebSocket.OPEN &&
      nodeIds.includes(d.nodeId)
  );

  return connected ? connected.nodeId : undefined;
}

// Resolve an incoming id from a "toNodeId" message to a real node_id.
//
// The incoming id can be EITHER:
//   - a space_id (mobile client sends this)
//   - a node_id  (dashboard client sends this directly)
//
// Resolution order:
//   1. spaceToRootNode cache (incomingId is a known space_id)
//   2. nodeToSpaceId cache   (incomingId is already a known node_id)
//   3. Live lookup: find a node_id under this space_id that is CURRENTLY
//      connected (findConnectedNodeForSpace) - preferred over any stale DB
//      column, since a space can have multiple node_ids and only one (or
//      none) may actually be online.
//   4. DB lookup by space_id OR node_id as a last-resort best guess, used
//      only to report a resolved id - NOT cached, since it may not
//      correspond to a live device.
async function resolveSpaceIdToNodeId(incomingId) {
  const cachedFromSpace = spaceToRootNode.get(incomingId);
  if (cachedFromSpace) {
    return cachedFromSpace;
  }

  if (nodeToSpaceId.has(incomingId)) {
    // incomingId is already a real, known node_id
    return incomingId;
  }

  printlog("resolveSpaceIdToNodeId: no cached mapping for: " + incomingId + " - checking for a connected device");
  const liveNode = await findConnectedNodeForSpace(incomingId);
  if (liveNode) {
    spaceToRootNode.set(incomingId, liveNode);
    nodeToSpaceId.set(liveNode, incomingId);
    printlog("resolveSpaceIdToNodeId: resolved via live connection: " + liveNode + " for: " + incomingId);
    return liveNode;
  }

  // No device for this space is currently connected. Fall back to a DB
  // guess so a node_id sent directly still resolves, but do NOT cache a
  // guess for a space_id lookup - caching a wrong/offline node would lock
  // it in until server restart.
  printlog("resolveSpaceIdToNodeId: no connected device for: " + incomingId + " - trying DB as last resort");

  const numericId = Number(incomingId);
  const row = await prisma.device_list.findFirst({
    where: {
      OR: [
        ...(Number.isNaN(numericId) ? [] : [{ space_id: numericId }]),
        { node_id: incomingId },
      ],
    },
  });

  if (!row) {
    printlog("resolveSpaceIdToNodeId: DB lookup failed for: " + incomingId);
    return undefined;
  }

  if (String(row.space_id) === incomingId) {
    const resolvedNode = String(row.root_node || row.node_id);
    printlog("resolveSpaceIdToNodeId: DB best-guess (uncached, likely offline): " + resolvedNode + " for space: " + incomingId);
    return resolvedNode;
  }

  // incomingId was already a node_id
  nodeToSpaceId.set(incomingId, String(row.space_id));
  return incomingId;
}

// Strip an accidental double-wrapped envelope coming from the mobile client
// (e.g. {"type":"send","nodeId":"<spaceId>","msg":{...actualCommand}}) down
function sanitizeDevicePayload(rawMsg) {
  let payload = rawMsg;
  let guard = 0;

  while (
    payload &&
    typeof payload === "object" &&
    payload.type === "send" &&
    payload.msg &&
    typeof payload.msg === "object" &&
    guard < 5
  ) {
    printlog("sanitizeDevicePayload: stripping nested 'send' envelope: " + JSON.stringify(payload));
    payload = payload.msg;
    guard++;
  }

  return payload;
}

// Remove a client from deviceList on disconnect, and mark the device
// offline in the DB if it was a hardware device (sh_device).
async function removeDevice(ws) {
  for (let i = 0; i < deviceList.length; i++) {
    const entry = deviceList[i];
    if (entry.client._socket.remotePort === ws._socket.remotePort) {
      const nodeId = entry.nodeId;
      deviceList.splice(i, 1);

      if (entry.type === "sh_device") {
        nodeToSpaceId.delete(String(nodeId));

        try {
          // status = 1 means offline 
          await prisma.device_list.updateMany({
            where: { node_id: String(nodeId) },
            data: { status: 1 },
          });
          printlog(`Device ${nodeId} marked offline`);
        } catch (err) {
          console.error("[prisma error] removeDevice:", err);
        }
      }
      break;
    }
  }
}

// Handles a "device_init" message. Registers mobile / dashboard / sh_device
// clients into deviceList and updates the space_id <-> node_id maps.
async function handleDeviceInit(ws, json_data) {
  printlog(json_data);

  // ── MOBILE connects ──────────────────────────────────────────────────
  // Mobile sends: {"type":"device_init","device_type":"mobile","nodeId":"<space_id>"}
  if (json_data.device_type === "mobile") {
    const spaceId = String(json_data.nodeId);
    console.log("Mobile connected for spaceId:", spaceId);

    for (let i = deviceList.length - 1; i >= 0; i--) {
      const d = deviceList[i];
      if (d.type === "mobile" && d.nodeId === spaceId) {
        deviceList.splice(i, 1);
      }
    }

    deviceList.push({
      nodeId: spaceId,
      client: ws,
      type: "mobile",
    });

    console.log("Mobile registered with spaceId:", spaceId);
    return;
  }

  // ── DASHBOARD connects ───────────────────────────────────────────────
  // Dashboard sends: {"type":"device_init","device_type":"dashboard","nodeId":"<nodeId>"}
  if (json_data.device_type === "dashboard") {
    const dashNodeId = String(json_data.nodeId || "");

    if (!dashNodeId) {
      console.log("Dashboard connected with empty nodeId - skipping registration");
      return;
    }

    for (let i = deviceList.length - 1; i >= 0; i--) {
      const d = deviceList[i];
      if (d.type === "dashboard" && d.client._socket.remotePort === ws._socket.remotePort) {
        deviceList.splice(i, 1);
      }
    }

    deviceList.push({
      nodeId: dashNodeId,
      client: ws,
      type: "dashboard",
    });

    console.log("Dashboard registered with nodeId:", dashNodeId);

    if (!nodeToSpaceId.has(dashNodeId)) {
      try {
        const device = await prisma.device_list.findFirst({
          where: { node_id: dashNodeId },
          select: { space_id: true },
        });

        if (device && device.space_id) {
          const dbSpaceId = String(device.space_id);
          nodeToSpaceId.set(dashNodeId, dbSpaceId);
          spaceToRootNode.set(dbSpaceId, dashNodeId);
          console.log(`Maps updated -> spaceId:${dbSpaceId} rootNode:${dashNodeId}`);

          await prisma.device_list.updateMany({
            where: {
              space_id: device.space_id,
              node_id: { not: dashNodeId },
            },
            data: { root_node: dashNodeId },
          });
          console.log("root_node updated for sibling devices");
        } else {
          console.warn("No DB record found for nodeId:", dashNodeId);
        }
      } catch (err) {
        console.error("[prisma error] dashboard device_init:", err);
      }
    } else {
      console.log(`Maps already populated -> spaceId:${nodeToSpaceId.get(dashNodeId)} rootNode:${dashNodeId}`);
    }
    return;
  }

  // ── HARDWARE DEVICE (sh_device) connects ─────────────────────────────
  // Device sends: {"type":"device_init","nodeId":"<root_node_id>"} (no device_type)
  {
    const rootNode = String(json_data.nodeId);

    deviceList.push({
      nodeId: rootNode,
      client: ws,
      type: "sh_device",
    });

    try {
      const device = await prisma.device_list.findFirst({
        where: { node_id: rootNode },
      });

      if (device && device.space_id) {
        const spaceId = String(device.space_id);

        spaceToRootNode.set(spaceId, rootNode);
        nodeToSpaceId.set(rootNode, spaceId);
        console.log(`Maps updated -> spaceId:${spaceId} rootNode:${rootNode}`);

        await prisma.device_list.updateMany({
          where: {
            space_id: device.space_id,
            node_id: { not: rootNode },
          },
          data: { root_node: rootNode },
        });
        console.log("root_node updated for sibling devices");

        // Mark this device online (status = 0)
        await prisma.device_list.update({
          where: { device_id: device.device_id },
          data: { status: 0 },
        });
      } else {
        console.warn("No DB record found for nodeId:", rootNode);
      }
    } catch (err) {
      console.error("[prisma error] sh_device device_init:", err);
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "device_auth_success" }));
    }
  }
}

// Handles a "toNodeId" message (mobile/dashboard -> device command).
// Resolves space_id to a live root node_id and forwards the msg as-is
// the contents of msg).
async function handleToNodeId(ws, json_data) {
  printlog("toNodeId requested.");
  printlog("Requested spaceId/nodeId: " + json_data.nodeId);
  printlog("Message: " + JSON.stringify(json_data.msg));

  const incomingId = String(json_data.nodeId);

  const resolvedNode = await resolveSpaceIdToNodeId(incomingId);
  if (!resolvedNode) {
    printlog("toNodeId: could not resolve nodeId for spaceId: " + incomingId + " - dropping command");
    return;
  }

  const payload = sanitizeDevicePayload(json_data.msg);
  if (!payload) {
    printlog("toNodeId: empty/invalid payload after sanitize, dropping. raw was: " + JSON.stringify(json_data.msg));
    return;
  }

  // resolvedNode (root node) is ONLY used to pick the right websocket to
  // send to. The payload itself is forwarded exactly as the client sent it.
  printlog(`toNodeId: routing via rootNode=${resolvedNode} (from incoming=${incomingId})`);
  printlog(`toNodeId: sending to device ${resolvedNode}: ${JSON.stringify(payload)}`);
  sendToDevice(resolvedNode, JSON.stringify(payload));
}

// Handles a "boards" message (device -> server status update).
//   [{ "type": "boards", "nodeId": "<node_id>", "output": [{ "od": <switch_id>, "os": <0|1> }] }]
//
// Flow:
//   1. Forward the raw board data to dashboards subscribed to this nodeId
//   2. Resolve nodeId -> space_id and forward to the mobile client for that space
//   3. Update switches.current_status in the DB for each entry in output
//   4. Create an activity_logs entry per switch change (user_id left NULL for now)
async function handleBoards(ws, boardData) {
  const senderNodeId = String(boardData.nodeId || getNodeIdOfSocket(ws) || "");

  if (!senderNodeId) {
    printlog("boards: could not determine nodeId, dropping message");
    return;
  }

  const dataStr = JSON.stringify(boardData);

  // 1. Forward to dashboards
  sendToDashboards(senderNodeId, dataStr);

  // 2. Forward to mobile (resolve nodeId -> space_id first)
  const spaceId = await resolveNodeIdToSpaceId(senderNodeId);
  if (spaceId) {
    sendToMobileBySpaceId(spaceId, dataStr);
  } else {
    printlog("boards: no space_id found for nodeId: " + senderNodeId);
  }

  // 3 & 4. Update switch status + write activity log, per output entry
  const output = Array.isArray(boardData.output) ? boardData.output : [];

  for (const item of output) {
    const switchId = Number(item.od);
    const isOn = Number(item.os) === 1;

    if (Number.isNaN(switchId)) {
      printlog("boards: skipping invalid switch id in output entry: " + JSON.stringify(item));
      continue;
    }

    try {
      await prisma.switches.update({
        where: { switch_id: switchId },
        data: { current_status: isOn },
      });

      await prisma.activity_logs.create({
        data: {
          user_id: null, // TODO: fill in once device/app auth is wired up
          switch_id: switchId,
          action: isOn ? "ON" : "OFF",
        },
      });

      printlog(`boards: switch_id=${switchId} updated to ${isOn ? "ON" : "OFF"}`);
    } catch (err) {
      console.error("[prisma error] boards update for switch_id=" + switchId, err);
    }
  }
}

// Handles an "ACK" or "NACK" message (device -> server command confirmation).
// Expected shape (array, same convention as "boards"):
//   [{ "type": "ACK",  "nodeId": "<node_id>", "od": <switch_id> }]
//   [{ "type": "NACK", "nodeId": "<node_id>", "od": <switch_id>, "reason": "..." }]
//
// This is a simple pass-through: no DB writes here (the "boards" message
// already handles persisting switch status). ACK/NACK just lets the
// mobile/dashboard UI show immediate command feedback (success/failure).
async function handleAckNack(ws, ackData) {
  const senderNodeId = String(ackData.nodeId || getNodeIdOfSocket(ws) || "");

  if (!senderNodeId) {
    printlog(`${ackData.type}: could not determine nodeId, dropping message`);
    return;
  }

  const dataStr = JSON.stringify(ackData);

  // Forward to dashboards
  sendToDashboards(senderNodeId, dataStr);

  // Forward to mobile (resolve nodeId -> space_id first)
  const spaceId = await resolveNodeIdToSpaceId(senderNodeId);
  if (spaceId) {
    sendToMobileBySpaceId(spaceId, dataStr);
  } else {
    printlog(`${ackData.type}: no space_id found for nodeId: ` + senderNodeId);
  }

  printlog(`${ackData.type} forwarded for nodeId=${senderNodeId}: ${dataStr}`);
}

// Main handler for a single incoming message on a connection.
async function handleMessage(ws, message) {
  const raw = message.toString("utf8");
  printlog("message received: " + raw);

  if (!isJsonString(raw)) {
    return;
  }

  const json_data = JSON.parse(raw);

  // Array messages (e.g. "boards") vs single-object messages (device_init,
  // toNodeId, etc.) 
  if (Array.isArray(json_data)) {
    const first = json_data[0];
    if (!first) return;

    switch (first.type) {
      case "boards":
        await handleBoards(ws, first);
        break;

      case "ACK":
      case "NACK":
        await handleAckNack(ws, first);
        break;

      default:
        printlog("Unhandled array message type (not implemented yet): " + first.type);
        break;
    }
    return;
  }

  switch (json_data.type) {
    case "device_init":
      await handleDeviceInit(ws, json_data);
      break;

    case "toNodeId":
      await handleToNodeId(ws, json_data);
      break;

    default:
      // Other message types (ACK/NACK, etc.) will be added later.
      printlog("Unhandled message type (not implemented yet): " + json_data.type);
      break;
  }
}

// Sets up connection handling (message routing, heartbeat, disconnect
// cleanup) on a given WebSocket.Server instance.
function attachConnectionHandlers(wss) {
  wss.on("connection", function (ws) {
    ws.on("message", function (message) {
      handleMessage(ws, message).catch((err) => {
        console.error("Error handling message:", err);
      });
    });

    const heartbeatInterval = setInterval(function () {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);

    ws.on("pong", function () {});

    ws.on("close", function () {
      clearInterval(heartbeatInterval);
      removeDevice(ws).catch((err) => {
        console.error("Error removing device:", err);
      });
    });
  });
}

module.exports = { attachConnectionHandlers };