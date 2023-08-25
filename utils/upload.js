const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");
const { uid } = require("uid");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://reserve-et.appspot.com",
});

const bucket = admin.storage().bucket();

async function uploadFile(filePath, fileName, fileType) {
  try {
    const destination = `/images/${uid(6)}${fileName}`;

    await bucket.upload(filePath, {
      destination: destination,
      metadata: {
        contentType: fileType,
      },
    });

    const file = bucket.file(destination);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-17-2030",
    });
    return { status: "success", url: url };
  } catch (error) {
    console.log(error);
    return { status: "error", error: error };
  }
}

module.exports = uploadFile;
