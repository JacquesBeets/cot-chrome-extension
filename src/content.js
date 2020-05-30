import Vue from 'vue'
import App from './popup/App'

function elementReady(selector) {
    return new Promise((resolve, reject) => {
      let el = document.querySelector(selector);
      if (el) {resolve(el);}
      new MutationObserver((mutationRecords, observer) => {
        // Query for elements matching the specified selector
        Array.from(document.querySelectorAll(selector)).forEach((element) => {
          resolve(element);
          //Once we have resolved we don't need the observer anymore.
          observer.disconnect();
        });
      })
        .observe(document.documentElement, {
          childList: true,
          subtree: true
        });
    });
  }
  
  
  elementReady(".chart-widget")
      .then(element => {  
          // Create Div containter for vue to control
          let mainDiv = document.createElement("div")
          mainDiv.id = "transparentFXtable"
        //   mainDiv.style.position = "absolute"
        //   mainDiv.style.bottom = '5%'
        //   mainDiv.style.right = '10%'
          element.insertAdjacentElement('afterend',mainDiv)
  
  
          // INIT VUE.js
          new Vue({
            el: '#transparentFXtable', // This should be the same as your <div id=""> from earlier.
            // components: {
            //   'navbar': Navbar
            // },
            render: h => h(App)
          })
  
      })
      .catch(err => console.error(err))


let chartWidget = document.getElementsByClassName("chart-widget")
console.log("Chrome Extension Ready to Go", chartWidget)