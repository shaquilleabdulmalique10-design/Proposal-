const express = require("express");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const PROPOSALS_FILE = path.join(DATA_DIR, "proposals.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(PROPOSALS_FILE)) {
  fs.writeFileSync(PROPOSALS_FILE, JSON.stringify({}, null, 2));
}

function readProposals() {
  try {
    return JSON.parse(fs.readFileSync(PROPOSALS_FILE, "utf8"));
  } catch (error) {
    return {};
  }
}

function writeProposals(data) {
  fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(data, null, 2));
}

function normalizeProposal(payload) {
  return {
    token:
      payload.token ||
      `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    gender: payload.gender || "female",
    prompt: payload.prompt || "Will you go out with me?",
    song: payload.song || "Perfect - Ed Sheeran",
    songUrl: payload.songUrl || "",
    image: payload.image || "love1.jpeg",
    design: payload.design || "love1",
    createdAt: payload.createdAt || new Date().toISOString(),
  };
}

async function notifySender(proposal, response) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailTo = process.env.EMAIL_TO;
  const emailFrom = process.env.EMAIL_FROM || emailUser;

  if (emailUser && emailPass && emailTo) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      await transporter.sendMail({
        from: emailFrom,
        to: emailTo,
        subject: "Your proposal got a sweet answer",
        text: `Your proposal received a response.\n\nDate: ${response.date}\nTime: ${response.time}\nVibe: ${response.preference}\nMessage: ${proposal.prompt}`,
      });
    } catch (error) {
      console.warn("Email notification failed:", error.message);
    }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;
  const twilioTo = process.env.TWILIO_WHATSAPP_TO;

  if (accountSid && authToken && twilioFrom && twilioTo) {
    try {
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        from: `whatsapp:${twilioFrom}`,
        to: `whatsapp:${twilioTo}`,
        body: `💌 Your proposal has a reply! ${response.preference} on ${response.date} at ${response.time}.`,
      });
    } catch (error) {
      console.warn("WhatsApp notification failed:", error.message);
    }
  }
}

app.use(express.json({ limit: "50mb" }));
app.use(express.static(__dirname));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Proposal backend is live." });
});

app.post("/api/proposal", (req, res) => {
  const payload = normalizeProposal(req.body || {});
  // allow ownerToken from client or generate one for the sender
  const ownerToken =
    req.body.ownerToken ||
    `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const proposals = readProposals();
  proposals[payload.token] = { ...payload, ownerToken };
  writeProposals(proposals);

  res.json({
    token: payload.token,
    ownerToken,
    url: `${req.protocol}://${req.get("host")}/?token=${payload.token}`,
    proposal: { ...payload, ownerToken },
  });
});

app.get("/api/proposal/:token", (req, res) => {
  const proposals = readProposals();
  const proposal = proposals[req.params.token];

  if (!proposal) {
    return res.status(404).json({ error: "Proposal not found" });
  }

  return res.json(proposal);
});

app.post("/api/proposal/:token/response", async (req, res) => {
  const proposals = readProposals();
  const proposal = proposals[req.params.token];

  if (!proposal) {
    return res.status(404).json({ error: "Proposal not found" });
  }

  const response = {
    date: req.body.date,
    time: req.body.time,
    preference: req.body.preference,
    song: req.body.song || proposal.song,
    songUrl: req.body.songUrl || proposal.songUrl,
    image: req.body.image || proposal.image,
    prompt: req.body.prompt || proposal.prompt,
    submittedAt: new Date().toISOString(),
  };

  proposal.response = response;
  // lock the proposal so receiver cannot reopen to change response
  proposal.locked = true;
  writeProposals(proposals);

  await notifySender(proposal, response);

  return res.json({ ok: true, proposal });
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  return res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Proposal app running on http://localhost:${PORT}`);
});
