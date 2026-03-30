const functions = require("firebase-functions");
const admin = require("firebase-admin");
const busboy = require("busboy"); // Used to parse the incoming POST data

admin.initializeApp();
const db = admin.firestore();

exports.inboundEmail = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const bb = busboy({ headers: req.headers });
  let emailData = {};

  bb.on("field", (fieldname, val) => {
    emailData[fieldname] = val;
  });

  bb.on("finish", async () => {
    try {
      // 1. Extract Ticket ID from the "To" or "Subject" 
      // (Depends on how you formatted your Reply-To in EmailJS)
      const toEmail = emailData.to || "";
      const ticketIdMatch = toEmail.match(/reply\+(.*)@/);
      const ticketId = ticketIdMatch ? ticketIdMatch[1] : null;

      if (!ticketId) {
        console.error("No Ticket ID found in email");
        return res.status(400).send("No Ticket ID");
      }

      // 2. Extract Message Body
      const sender = emailData.from; // e.g. "client@gmail.com"
      const text = emailData.text || "No content";

      // 3. Update Firestore
      const messageRef = db
        .collection("artifacts")
        .doc("swifftnet-remote-v3") // Your appId
        .collection("public")
        .doc("data")
        .collection("tickets")
        .doc(ticketId)
        .collection("messages");

      await messageRef.add({
        sender: sender,
        text: text.split("\n")[0], // Get only the first line to avoid email signatures
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update the ticket's last update timestamp
      await db
        .collection("artifacts")
        .doc("swifftnet-remote-v3")
        .collection("public")
        .doc("data")
        .collection("tickets")
        .doc(ticketId)
        .update({
          lastUpdate: new Date().toISOString(),
        });

      res.status(200).send("Success");
    } catch (error) {
      console.error("Error processing email:", error);
      res.status(500).send("Internal Error");
    }
  });

  bb.end(req.rawBody);
});