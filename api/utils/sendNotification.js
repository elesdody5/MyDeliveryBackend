const admin = require("firebase-admin");


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


//This function takes notification token and payload and it sends notification to a proper device
exports.sendNotification = async (registrationToken, message) => {
  var options = {
    priority: "high",
    timeToLive: 60 * 60 * 24,
  };
  console.log("before notification", message);

  admin
    .messaging()
    .sendMulticast(message)
    .then((response1) => {
      console.log(response1.responses);
    })
    .catch((err) => console.log("Error in sending message", err));
};
exports.sendMultipleNotification = async (
  registrationTokens,
  message,
  topic,
  res
) => {
  // await admin
  //   .messaging()
  //   .subscribeToTopic(registrationTokens, topic)
  //   .then((response) => {
  //     console.log("subbed");
  //     // See the MessagingTopicManagementResponse reference documentation
  //     // for the contents of response.
  //     console.log("Successfully subscribed to topic:", response);
  //   })
  //   .catch((error) => {
  //     console.log("Error subscribing to topic:", error);
  //   });

  // Send a message to devices subscribed to the provided topic.
  let messageClone = {
    ...message,
    tokens: registrationTokens,
  };


  admin
    .messaging()
    .sendMulticast(messageClone)
    .then((response) => {
      // Response is a message ID string.

      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
      res.json(error);
    });
};


exports.sendSingleNotificationUsingFCM = async (token, data) => {
  let message = {
    token: String(token),
    data: data,
    notification: {},
  };
  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  };

};

exports.notifyDeliveryUsers = async (userType) => {
  const deliveryUsers = await User.find({ userType: "delivery" });
  const uniqueTokens = [...new Set(
    deliveryUsers
      .map((user) => user.notificationToken)
      .filter(Boolean)
  )];

  if (uniqueTokens.length > 0) {
    await Promise.all(
      uniqueTokens.map((token) =>
        sendSingleNotificationUsingFCM(token, {
          userType: String(userType),
          type: "quickOrder",
        })
      )
    );
  }
};
