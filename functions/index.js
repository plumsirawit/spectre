const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const cors = require('cors')({
  origin: true
});
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
let db = admin.firestore();
exports.registerUser = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, () => {
    db.collection('users').get().then((querySnapshot) => {
      var cnt = 0;
      querySnapshot.forEach((doc) => {
        if(cnt != -1) cnt++;
        if(doc.data().name == req.query.name){
          cnt = -1;
        }
      });
      return cnt;
    }).then((cnt) => {
      if(cnt == 11){
        return Promise.resolve('__error2');
      }else if(cnt == -1){
        return Promise.resolve('__error3');  
      }else{
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for(var i = 0; i < 16; i++){
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        if(!req.query.name){
          return Promise.resolve('__error1');
        }else{
          var name = req.query.name;
          return db.collection('users').add({
            uid: result,
            name: name,
            role: -1
          }).then(ref => {
            return result;
          });
        }
      }
    }).then((result) => {
      res.send(result);
    });
  });
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
  return cors(req, res, () => {
    if(req.query.pass == 'shitshitshit'){
      return deleteCollection(db, 'users', 32).then(() => {
        db.collection('settings').doc('settings').update({gameReady: false});
      }).then(() => {
        res.send('OK');
      });
    }else{
      res.send('Unauthorized');
    }
  });
});
const shuffle = (array) => {
	var currentIndex = array.length;
	var temporaryValue, randomIndex;
	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
};
exports.startGame = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.query.pass == 'shitshitshit'){
      // Random periods first, then 'select-permute' roles.
      return db.collection('periods').get().then((querySnapshot) => {
        var periods = [];
        querySnapshot.forEach((doc) => {
          periods.push(doc.data());
        });
        return Promise.resolve(periods);
      }).then((periods) => {
        var item = periods[Math.floor(Math.random()*periods.length)];
        return db.collection('settings').doc('settings').update({currentPeriod: item.name});
      }).then(() => {
        return db.collection('users').get();
      }).then((querySnapshot) => {
        var baseArr = [];
        for(var i = 1; i <= 10; i++){
          baseArr.push(i);
        }
        var shufArr = [0].concat(shuffle(baseArr));
        var idx = 0;
        var promises = [];
        querySnapshot.forEach((doc) => {
          promises.push(db.collection('users').doc(doc.id).update({role: shufArr[idx]}));
          idx++;
        });
        return Promise.all(promises);
      }).then(() => {
        return db.collection('settings').doc('settings').update({gameReady: true});
      }).then(() => {
        return Promise.resolve(res.send('OK'));
      });
    }else{
      res.send('Unauthorized');
    }
  });
});
exports.getUserRole = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(!req.query.uid){
      return res.send('__error1');
    }else{
      var uid = req.query.uid;
      return db.collection('users').where('uid','==',uid).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          return res.send(doc.data().role.toString());
        });
        return res.send('__error2');
      });
    }
  });
});
exports.getUsers = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, () => {
    return db.collection('users').get().then((querySnapshot) => {
      var arr = [];
      querySnapshot.forEach((doc) => {
        arr.push(doc.data().name);
      });
      return Promise.resolve(arr);
    }).then((arr) => {
      return res.send(JSON.stringify({resArr: arr}));
    });
  });
});
exports.deleteUser = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(!req.query.name){
      return res.send('__error1');
    }else if(req.query.pass != 'shitshitshit'){
      return res.send('__error2');
    }else{
      var name = req.query.name;
      return db.collection('users').where('name','==',name).get().then((querySnapshot) => {
        var sel = undefined;
        querySnapshot.forEach((doc) => {
          sel = doc;
        });
        if(sel){
          return sel.ref.delete();
        }
      }).then(() => {
        res.send('OK');
      })
    }
  })
});
exports.addPeriod = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, () => {
    var name = req.query.name;
    var roles = JSON.parse(req.query.roles);
    return db.collection('periods').add({name: name}).then((ref) => {
      roles.forEach((role) => {
        ref.collection('roles').add(role);
      });
    }).then(() => {
      res.send('OK');
    });
  });
});