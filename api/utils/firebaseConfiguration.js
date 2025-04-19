//This file is to configure bucket in firebase and we can export bucket and use it in any file across the application
const { Storage } = require('@google-cloud/storage');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
serviceAccount.client_email = serviceAccount.client_email.replace(/\\n/g, '\n');

const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

const bucket = storage.bucket('delivery-app-5e621.appspot.com');

module.exports = {
  bucket,
};
