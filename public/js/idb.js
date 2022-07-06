// create variable to hold db connection
let db
// establish a connection to IndexedDb database caled "budget" and set it to version 1
const request = indexedDB.open('budget', 1)

// This event will emit if the database version changes (nonexistant to version 1, 2, etc)
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result
    // create an object store (table) called 'new_pizza', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('budget', {autoIncrement: true})
}

// upon successful
request.onsuccess = function(event) {
    // when db is successfully created with its objet store or simply established
    // a connection, save reference to db in a global variable
    db = event.target.result

    // check if app is online, if yes run uploadData() function to send all local db data to api
    if(navigator.onLine) {
        uploadData()
    }
}

request.onerror = function(event) {
    console.log(event.target.errorCode)
}

// This function will be executed if we attempt to submit new data and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['budget'], 'readwrite');
  
    // access the object store for `new_pizza`
    const dataObjectStore = transaction.objectStore('budget');
  
    // add record to your store with add method
    dataObjectStore.add(record);
  }

  function uploadData() {
    // open a transaction on your db
    const transaction = db.transaction(['budget'], 'readwrite')

    // access your object store
    const dataObjectStore = transaction.objectStore('budget')

    // get all records from store and set to a variable
    const getAll = dataObjectStore.getAll()
    
    getAll.onsuccess = function() {
        // if there was data in indexedDbs store, let's send it to the api server
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse)
                }
                // open one more transaction
                const transaction = db.transaction(['budget'], 'readwrite')
                // access the new_pizza object store
                const dataObjectStore = transaction.objectStore('budget')
                // clear all items in your store
                dataObjectStore.clear()

                alert(`All saved items have been submitted!`)
            })
            .catch(err => {
                console.log(err)
            })
        }
    }
  }

  window.addEventListener('online', uploadData)

