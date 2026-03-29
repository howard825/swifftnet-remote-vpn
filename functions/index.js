const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.updateVpnStatus = functions.https.onRequest(async (req, res) => {
  const {username, status} = req.query; // Now taking username instead of ID
  const appId = "swifftnet-remote-v3";

  if (!username || !status) {
    return res.status(400).send("Missing parameters");
  }

  try {
    const isOnline = status === "up";
    
    // 1. Find the assignment document where the "user" field matches the username
    const assignmentsRef = admin.firestore()
        .collection("artifacts").doc(appId)
        .collection("public").doc("data")
        .collection("assignments");

    const snapshot = await assignmentsRef.where("user", "==", username).get();

    if (snapshot.empty) {
      console.log(`No assignment found for user: ${username}`);
      return res.status(404).send("User not found in database");
    }

    // 2. Update all matching documents (usually just one)
    const batch = admin.firestore().batch();
    snapshot.forEach((doc) => {
      batch.update(doc.ref, {isOnline: isOnline});
    });
    
    await batch.commit();

    return res.status(200).send(`User ${username} is now ${status}`);
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).send("Internal Error");
  }
});