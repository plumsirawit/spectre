const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
let db = admin.firestore();
exports.registerUser = functions.region('asia-northeast1').https.onRequest((req, res) => {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for(var i = 0; i < 16; i++){
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	if(!req.query.name){
		res.send('No name found');
	}else{
		var name = req.query.name;
		return db.collection('users').add({
			uid: result,
			name: name,
			role: -1
		}).then(ref => {
			res.send(result);
		});
	}
});

// The following function is copied from the firebase guide
function deleteCollection(db, collectionPath, batchSize) {
  let collectionRef = db.collection(collectionPath);
  let query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, batchSize, resolve, reject);
  });
}
function deleteQueryBatch(db, query, batchSize, resolve, reject) {
  query.get()
    .then((snapshot) => {
      // When there are no documents left, we are done
      if (snapshot.size == 0) {
        return 0;
      }

      // Delete documents in a batch
      let batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      return batch.commit().then(() => {
        return snapshot.size;
      });
    }).then((numDeleted) => {
      if (numDeleted === 0) {
        resolve();
        return;
      }

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        deleteQueryBatch(db, query, batchSize, resolve, reject);
      });
    })
    .catch(reject);
}
exports.resetUsers = functions.region('asia-northeast1').https.onRequest((req, res) => {
	if(req.query.pass == 'shitshitshit'){
		return deleteCollection(db, 'users', 32).then(() => {
			res.send('OK');
		});
	}else{
		res.send('Unauthorized');
	}
});
