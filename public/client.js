// client-side js
// run by the browser each time your view template referencing it is loaded

let externalids = [];

// define variables that reference elements on our page
const dreamsList = document.getElementById('externalids');
const dreamsForm = document.forms[0];
const dreamInput = dreamsForm.elements['dream'];

// a helper function to call when our request for dreams is done
const getDreamsListener = function() {
  // parse our response to convert to JSON
  externalids = JSON.parse(this.responseText);

  // iterate through every dream and add it to our page
  externalids.forEach( function(row) {
    if (row.input === undefined)
      row.input = "UNKNOWN";
    appendNewDream(row);
  });
}

// request the dreams from our app's sqlite database
const dreamRequest = new XMLHttpRequest();
dreamRequest.onload = getDreamsListener;
dreamRequest.open('get', '/list');
dreamRequest.send();

// a helper function that creates a list item for a given dream
const appendNewDream = function(dream) {
  const newListItem = document.createElement('li');
  newListItem.innerHTML = "input: " + dream.input + " === " + dream.digest + " -> " + dream.externalid;
  dreamsList.appendChild(newListItem);
}

const submitNewInput= (input) => {
   fetch("/externalid?q=" + input).then((res) => {
     return res.json();
   }).then((data) => {
     data.input = input;
     appendNewDream(data);
   });  
}

// listen for the form to be submitted and add a new dream when it is
dreamsForm.onsubmit = function(event) {
  // stop our form submission from refreshing the page
  event.preventDefault();

  // get dream value and add it to the list
  //externalids.push(dreamInput.value);
  submitNewInput(dreamInput.value);

  // reset form 
  dreamInput.value = '';
  dreamInput.focus();
};

const uuidPair = () => {
  fetch("/uuid").then((res) => {
    return res.json();
  }).then((data) => {
    appendNewDream(data);
  });
}