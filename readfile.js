
const fs = require('fs');
const config = require('./config.js');

function convert(file) {
    fs.readFile(file, function (err, data) {
        if (err) throw err;
        const  convertDailtyStatementDataArray = data.toString().split("\n");
        const arrayOfActualReportDataArray = pushActualReportDataToArray(convertDailtyStatementDataArray);
        
        const resultObjecToConevrtJson = convertReportRowToJsonOject(arrayOfActualReportDataArray);
        const tempJsonObjArrWithAllReporData = resultObjecToConevrtJson.jsonObjectArrayForEveryRowofREport;
        const trackIndexRowWithDateArr = resultObjecToConevrtJson.trackIndexForRowWithDate
        const dateWiseFinaleJsonArrdataForCSV = mergedObjectForCSV(trackIndexRowWithDateArr,tempJsonObjArrWithAllReporData);
        const debitData = funcForDebit(dateWiseFinaleJsonArrdataForCSV);
        console.log(debitData);
        console.log('*******************');
        const creditData = funcForCredit(dateWiseFinaleJsonArrdataForCSV);
        console.log(creditData);
       
    });
}
function convertReportRowToJsonOject(reportDataArray) {
    let jsonObjectArrayForEveryRowofREport = [];
    let trackIndexForRowWithDate = [];
    for (let i = 0; i < reportDataArray.length; i++) {
        let singleRowData = reportDataArray[i].split(/\s{2,}/);
        let rowWithDateCounter = 0;
        const everyRowOfReportDataAsObject = {
            'Date': '',
            'VoucherNo': [],
            'DebitChart': [],
            'DebitAmount': [],
            'CreditChart': [],
            'CreditAmount': []
        }
        for(let j = 0; j<singleRowData.length;j++){
            if(singleRowData[j] !=''){                   
                if(isValidDate(singleRowData[j]))
                {
                    everyRowOfReportDataAsObject.Date = singleRowData[j];
                    trackIndexForRowWithDate.push(i);
                    rowWithDateCounter++;
                }else if(!isNaN(singleRowData[j])){
                    if(rowWithDateCounter==1){
                        everyRowOfReportDataAsObject.VoucherNo = singleRowData[j];
                        rowWithDateCounter++;
                    }else if(rowWithDateCounter>1){
                        everyRowOfReportDataAsObject.DebitAmount.push(singleRowData[j]);
                        rowWithDateCounter++;
                    }else if(rowWithDateCounter==0){
                        everyRowOfReportDataAsObject.CreditAmount.push(singleRowData[j]);
                    }
                }else{
                    if(rowWithDateCounter>0){
                        everyRowOfReportDataAsObject.DebitChart.push(singleRowData[j]);
                        rowWithDateCounter++;
                    }else{
                        everyRowOfReportDataAsObject.CreditChart.push(singleRowData[j]);
                    }
                }
            }
           
        } 
        rowWithDateCounter = 0;
        jsonObjectArrayForEveryRowofREport.push(everyRowOfReportDataAsObject);    
    }
    const objectWIthJsonRowArrAndTrackIndex = {
        jsonObjectArrayForEveryRowofREport,trackIndexForRowWithDate
    };
    return objectWIthJsonRowArrAndTrackIndex;
}
function pushActualReportDataToArray(arrayOfDataReadFromStatement) {
    let actualReportDataStartingCount = 0;
    //config.linBreakAciiCode 
    console.log(config );
    let arrayOfReportDataOnly = [];
    for (i in arrayOfDataReadFromStatement) {
        if (arrayOfDataReadFromStatement[i].charCodeAt(0) === config.linBreakAciiCode ) {
            actualReportDataStartingCount = 0;
        }
        actualReportDataStartingCount++;
        if (actualReportDataStartingCount > config.reportDataStartingLine) {
            arrayOfReportDataOnly.push(arrayOfDataReadFromStatement[i]);
        }
    }
    return arrayOfReportDataOnly;
}
function mergedObjectForCSV(indextrackingArr, jsonObjArrEveryRow){
        const singleDateObjectArrForCsv = [];
        for(let k=0; k<indextrackingArr.length ; k++){
            let index = indextrackingArr[k];
            const dateWithObj = jsonObjArrEveryRow[index];
            for(let l=indextrackingArr[k];l<indextrackingArr[k+1];l++){
                if(l===index) continue;
                
                const withOutDateObj = jsonObjArrEveryRow[l];
                
                dateWithObj.DebitChart = mergedArray(dateWithObj.DebitChart,withOutDateObj.DebitChart);
                dateWithObj.CreditChart = mergedArray(dateWithObj.CreditChart,withOutDateObj.CreditChart);
                dateWithObj.CreditAmount = mergedArray(dateWithObj.CreditAmount,withOutDateObj.CreditAmount);
                dateWithObj.DebitAmount = mergedArray(dateWithObj.DebitAmount,withOutDateObj.DebitAmount);
                

            }
            singleDateObjectArrForCsv.push(dateWithObj);
        }
        return singleDateObjectArrForCsv;
}
function mergedArray(mergedWithArr,toBeMergedArr) {
    return mergedWithArr.concat(toBeMergedArr);
}
function funcForDebit(debitData){
    let outputDataForCSV = ['Date','VoucherNO','Amount','TransType'];
    for(let k=0; k<debitData.length ; k++){
        const curObjTobeInserted = debitData[k];
        const curDebitAmnt = curObjTobeInserted.DebitAmount;
        let row = [];
        for(let l=0;l<curDebitAmnt.length;l++){
            row = [curObjTobeInserted.Date,curObjTobeInserted.VoucherNo,curDebitAmnt[l],'DR'];
        }
        outputDataForCSV.push(row);
    }
    return outputDataForCSV;
}
function funcForCredit(creditData){
    let outputDataForCSV = ['Date','VoucherNO','Amount','TransType'];
    for(let k=0; k<creditData.length ; k++){
        const curObjTobeInserted = creditData[k];
        const curDebitAmnt = curObjTobeInserted.CreditAmount;
        let row = [];
        for(let l=0;l<curDebitAmnt.length;l++){
            row = [curObjTobeInserted.Date,curObjTobeInserted.VoucherNo,curDebitAmnt[l],'CR'];
        }
        outputDataForCSV.push(row);
    }
    return outputDataForCSV;
}
function isValidDate(s) {
    // format D(D)/M(M)/(YY)YY
    var dateFormat = /^\d{1,4}[\.|\/|-]\d{1,2}[\.|\/|-]\d{1,4}$/;

    if (dateFormat.test(s)) {
        // remove any leading zeros from date values
        s = s.replace(/0*(\d*)/gi,"$1");
        var dateArray = s.split(/[\.|\/|-]/);
      
              // correct month value
        dateArray[1] = dateArray[1]-1;

        // correct year value
        if (dateArray[2].length<4) {
            // correct year value
            dateArray[2] = (parseInt(dateArray[2]) < 50) ? 2000 + parseInt(dateArray[2]) : 1900 + parseInt(dateArray[2]);
        }

        var testDate = new Date(dateArray[2], dateArray[1], dateArray[0]);
        if (testDate.getDate()!=dateArray[0] || testDate.getMonth()!=dateArray[1] || testDate.getFullYear()!=dateArray[2]) {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
}
convert('DailyStatement.txt');