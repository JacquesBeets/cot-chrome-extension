<template>
  <div id="transparentfxCOT" :class="{open: open}">
    <div @click="openCloseTable" v-show="!open && !loading" class="logo">
      <div>TRANSPARENT FX</div>
      <span class="bottom">COMMITMENT OF TRADERS</span>
    </div>
    <div id="mainApp" v-show="open">
      <div class="header">
        <div class="compName">
          <div>TRANSPARENT FX -</div>
        </div>
        <select name="financialsShort" id="financialsShort" v-model="selectedFinancial">
          <option v-for="item in quickCurrencySelect" :value="item.id" :key="item.id">{{item.value}}</option>
        </select>
        <span class="close" @click="openCloseTable">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 13" width="13" height="13">
            <path
              fill="currentColor"
              d="M5.18 6.6L1.3 2.7.6 2 2 .59l.7.7 3.9 3.9 3.89-3.9.7-.7L12.61 2l-.71.7L8 6.6l3.89 3.89.7.7-1.4 1.42-.71-.71L6.58 8 2.72 11.9l-.71.7-1.41-1.4.7-.71 3.9-3.9z"
            />
          </svg>
        </span>
      </div>
      <table style="width:99.99%">
        <tr>
          <th width="10%" class="date">Date</th>
          <th width="10%" class="long">Long</th>
          <th width="10%" class="short">Short</th>
          <th width="10%" class="changeHead">Change Long</th>
          <th width="10%" class="changeHead">Change Short</th>
          <th width="10%" class="changeHead">Long %</th>
          <th width="10%" class="changeHead">Short %</th>
          <th width="13%" class="net">Net Position</th>
        </tr>
        <tbody class="tableBody">
          <tr
            v-for="(item, index) in tableObject"
            :key="item.as_of_date_in_form_yymmdd"
            style="background-color:#f5f5f5;"
          >
            <td class="date">{{formatDate(item.report_date_as_mm_dd_yyyy)}}</td>
            <td
              class="long"
              :style="item.longColor"
            >{{formatNumber(item.noncomm_positions_long_all)}}</td>
            <td
              class="short"
              :style="item.shortColor"
            >{{formatNumber(item.noncomm_positions_short_all)}}</td>
            <td class="change">{{ formatNumber(prevLong(index)) }}</td>
            <td class="change" >{{ formatNumber(prevShort(index)) }}</td>
            <td class="change">{{item.pct_of_oi_noncomm_long_all}}</td>
            <td class="change" >{{item.pct_of_oi_noncomm_short_all}}</td>
            <td class="net" :style="item.netColor">{{ formatNumber(item.netPosition) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  mounted() {
    this.loading = true;
    this.fetchData();
    let mainAppContainer = document.getElementById("mainApp");

    let rightScroll = document.querySelector(".price-axis");
    let cotContainer = document.getElementById("transparentfxCOT");

    function outputSize() {
      cotContainer.style.right = rightScroll.offsetWidth + 5 + "px";
    }

    new ResizeObserver(outputSize).observe(rightScroll);
  },
  data() {
    return {
      loading: false,
      open: false,
      scrollEventAdded: false,
      apiUrl: "https://cot.jacquesbeets.a2hosted.com/api/data",
      // apiUrl: 'http://localhost:9080/api/data/',
      rawData: [],
      quickCurrencySelect: [
        { id: "098662", value: "USD" },
        { id: "232741", value: "AUD" },
        { id: "099741", value: "EUR" },
        { id: "097741", value: "JPY" },
        { id: "096742", value: "GBP" },
        { id: "092741", value: "CHF" },
        { id: "090741", value: "CAD" },
        { id: "095741", value: "MXN" },
        { id: "088691", value: "XAU" },
        { id: "084691", value: "XAG" },
        { id: "089741", value: "RUB" },
        { id: "133741", value: "BTC" },
        { id: "112741", value: "NZD" },
        { id: "122741", value: "ZAR" },
        { id: "102741", value: "BRL" }
      ],
      loading: false,
      financialsData: [],
      commodetyData: [],
      financialDataSorted: {},
      selectedFinancial: "098662"
    };
  },
  computed: {
    tableObject() {
      if (this.selectedFinancial == null) {
        return "";
      }
      return this.financialDataSorted[this.selectedFinancial];
    }
  },
  methods: {
    openCloseTable() {
      this.open = !this.open;
    },
    fetchData() {
      this.loading = true;
      axios.get(this.apiUrl).then(response => {
        this.financialsData = response.data.financialData;
        this.sortFinancialData();
        this.loading = false;
      });
    },
    async downloadData() {
      this.loading = true;
      const data = await this.$axios.$get(
        "https://cot.jacquesbeets.a2hosted.com/api/download"
      );
      this.fetchData();
    },
    sortFinancialData() {
      let finanCopy = this.financialsData;
      let newFinObj = {};

      this.financialsData.forEach(obj => {
        let objectNameChange = this.splitName(obj);

        // check if key exist and push to key array
        if (obj.cftc_contract_market_code in newFinObj) {
          newFinObj[obj.cftc_contract_market_code].push(objectNameChange);
        } else {
          // else push object into new array with same object key
          newFinObj[obj.cftc_contract_market_code] = [];
          newFinObj[obj.cftc_contract_market_code].push(objectNameChange);
        }
      });

      let entries = Object.entries(newFinObj);

      // ADD NET POSITIONS
      for (let [currencyKey, currencyArr] of entries) {
        let arr = currencyArr.reverse();
        // NET POSITION
        arr.forEach(week => {
          week.netPosition = this.netPositionColor(
            week.noncomm_positions_long_all,
            week.noncomm_positions_short_all
          );
        });
      }

      // Flip all arrays back
      for (let [currencyKey, currencyArr] of entries) {
        let arr = currencyArr.reverse();
      }

      this.financialDataSorted = newFinObj;
      this.addColors();
      this.addDatesObjects();
      this.financialDataSortByDate();
    },
    addDatesObjects() {
      let dataSorted = this.financialDataSorted;
      let entries = Object.entries(dataSorted);

      for (let [currencyKey, currencyArr] of entries) {
        let arr = currencyArr;
        arr.forEach(week => {
          let splitDate = week.report_date_as_mm_dd_yyyy.split("/");
          // week.report_date_as_mm_dd_yyyy = new Date(`${splitDate[2]}-${splitDate[0]}-${splitDate[1]}`)
          week.report_date_as_mm_dd_yyyy = new Date(
            week.report_date_as_mm_dd_yyyy
          );
        });
      }
    },
    financialDataSortByDate() {
      let entries = Object.entries(this.financialDataSorted);
      for (let [currencyKey, currencyArr] of entries) {
        let arr = currencyArr;
        arr.sort(
          (a, b) => b.report_date_as_mm_dd_yyyy - a.report_date_as_mm_dd_yyyy
        );
      }
    },
    formatDate(date) {
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    },
    splitName(obj) {
      let objChanged = obj;
      let splitArr = obj.market_and_exchange_names.split(" - ");
      objChanged.market_and_exchange_names = splitArr[0];
      return objChanged;
    },
    prevLong(index) {
      return (
        parseInt(this.tableObject[index].noncomm_positions_long_all) -
        parseInt(
          this.tableObject[index + 1] == undefined
            ? 0
            : this.tableObject[index + 1].noncomm_positions_long_all
        )
      );
    },
    prevShort(index) {
      return (
        parseInt(this.tableObject[index].noncomm_positions_short_all) -
        parseInt(
          this.tableObject[index + 1] == undefined
            ? 0
            : this.tableObject[index + 1].noncomm_positions_short_all
        )
      );
    },
    netPosition(index) {
      return (
        parseInt(this.tableObject[index].noncomm_positions_long_all) -
        parseInt(this.tableObject[index].noncomm_positions_short_all)
      );
    },
    netPositionColor(long, short) {
      return parseInt(long) - parseInt(short);
    },
    addColors() {
      // find the highest value and create and assign its color according to intensity
      let currencies = JSON.parse(
        JSON.stringify(Object.entries(this.financialDataSorted))
      );
      let longColorObj = {};
      // console.log("sortedArr", longColorObj)
      for (let [currencyKey, currencyArr] of currencies) {
        let arr = currencyArr;
        let sortedLong = arr
          .sort(function(a, b) {
            return (
              parseInt(a.noncomm_positions_long_all) -
              parseInt(b.noncomm_positions_long_all)
            );
          })
          .reverse();

        let count = 56;
        let firstloop = true;

        sortedLong.forEach((date, index) => {
          if (index < sortedLong.length / 2) {
            if (index == 0) {
              date.longColor = `background-color:hsl(151, 42%, ${50}%); color: #222;font-weight: bold;`;
            } else {
              date.longColor = `background-color:hsl(151, 58%, ${count}%); color: #222;`;
            }
            if (index != 0) {
              count = count + 6;
            }
          } else {
            if (firstloop) {
              count = (sortedLong.length / 2) * 4 + 60;
              firstloop = false;
            }
            if (index == sortedLong.length - 1) {
              date.longColor = `background-color:hsl(5, 70%, ${60}%);color: #222;font-weight: bold;`;
            } else {
              date.longColor = `background-color:hsl(5, 80%, ${count}%);color: #222;`;
            }
            if (index != sortedLong.length - 1) {
              count = count - 4;
            }
          }
        });

        count = 56;
        firstloop = true;
        let sortedShort = sortedLong
          .sort(function(a, b) {
            return (
              parseInt(a.noncomm_positions_short_all) -
              parseInt(b.noncomm_positions_short_all)
            );
          })
          .reverse();
        sortedShort.forEach((date, index) => {
          if (index < sortedShort.length / 2) {
            if (index == 0) {
              date.shortColor = `background-color:hsl(151, 42%, ${50}%); color: #222;font-weight: bold;`;
            } else {
              date.shortColor = `background-color:hsl(151, 58%, ${count}%); color: #222;`;
            }
            if (index != 0) {
              count = count + 6;
            }
          } else {
            if (firstloop) {
              count = (sortedShort.length / 2) * 4 + 60;
              firstloop = false;
            }
            if (index == sortedShort.length - 1) {
              date.shortColor = `background-color:hsl(5, 70%, ${60}%);color: #222;font-weight: bold;`;
            } else {
              date.shortColor = `background-color:hsl(5, 80%, ${count}%);color: #222;`;
            }
            if (index != sortedShort.length - 1) {
              count = count - 4;
            }
          }
        });

        count = 56;
        firstloop = true;
        let sortedNet = sortedLong
          .sort(function(a, b) {
            return parseInt(a.netPosition) - parseInt(b.netPosition);
          })
          .reverse();
        sortedNet.forEach((date, index) => {
          if (index < sortedNet.length / 2) {
            if (index == 0) {
              date.netColor = `background-color:hsl(151, 42%, ${50}%); color: #222;font-weight: bold;`;
            } else {
              date.netColor = `background-color:hsl(151, 58%, ${count}%); color: #222;`;
            }

            if (index != 0) {
              count = count + 6;
            }
          } else {
            if (firstloop) {
              count = (sortedNet.length / 2) * 4 + 60;
              firstloop = false;
            }
            if (index == sortedNet.length - 1) {
              date.netColor = `background-color:hsl(5, 70%, ${60}%);color: #222;font-weight: bold;`;
            } else {
              date.netColor = `background-color:hsl(5, 80%, ${count}%);color: #222;`;
            }
            if (index != sortedNet.length - 1) {
              count = count - 4;
            }
          }
        });

        longColorObj[currencyKey] = sortedLong;
      }
      this.financialDataSorted = longColorObj;
    },
    formatNumber(nStr) {
      nStr += "";
      var x = nStr.split(".");
      var x1 = x[0];
      var x2 = x.length > 1 ? "." + x[1] : "";
      var rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, "$1" + "," + "$2");
      }
      return x1 + x2;
    }
  }
};
</script>

<style>
</style>
