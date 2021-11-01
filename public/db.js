let db;

// create a db request for the client side database
const request = window.indexedDB.open("BudgetDB", 1)

request.onupgradeneeded = function (event) {
  // create object store called "BudgetStore" and set autoIncrement to true
  db = event.target.result
  const budgetStore = db.createObjectStore("BudgetStore", { 
      autoIncrement: true
    });
};

request.onsuccess = function () {
  db = request.result;

  // upon successful connection to indexdb database, check if the broswer is online, if online invoke the checkDatabase function
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  
  console.log(event.target)

};

//transactions that fail to be posted will end up here (this function is invoked by the catch statement in index.js)
function saveRecord(record) {
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  const budgetStore = transaction.objectStore("BudgetStore")
  budgetStore.add(record)

}

//get all transaction on the client side/indexeddb database and post to /api/transaction/bulk
function checkDatabase() {
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  const budgetStore = transaction.objectStore("BudgetStore")
  const getAllRequest = budgetStore.getAll()
  getAllRequest.onsuccess = function () {
    if (getAllRequest.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAllRequest.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((results) => {
          const newTransaction = db.transaction(["BudgetStore"], "readwrite");
          const newBudgetStore = newTransaction.objectStore("BudgetStore");
          // this will clear the client side database if records currently exist
          if(results.length > 0){
                       
            newBudgetStore.clear();
          }
        });
    }
  };
}

// listen for the event that will indicate the browser has come online and then invoke the checkDatabase function
window.addEventListener('online', checkDatabase);

