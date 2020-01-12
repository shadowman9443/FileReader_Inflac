const config = require('./config');
const Utility = require('./Utility');
const fs = require('fs');
class FileReader {
    constructor(filename) {
        this.filename = filename;
        this.trackIndexForRowWithDate = [];
    }
    convert() {
        const readDataFromDailyStatement = fs.readFileSync(this.filename).toString();
        const convertDailtyStatementDataArray = readDataFromDailyStatement.toString().split("\n");
        const arrayOfActualReportDataArray = this.pushActualReportDataToArray(convertDailtyStatementDataArray);
        const tempJsonObjArrWithAllReporData = this.convertReportRowToJsonOject(arrayOfActualReportDataArray);
        const dateWiseFinaleJsonArrdataForCSV = this.mergedObjectForCSV(this.trackIndexForRowWithDate, tempJsonObjArrWithAllReporData);
        const debitData = this.funcForDebit(dateWiseFinaleJsonArrdataForCSV);
        console.log(debitData);
        console.log('*******************');
        const creditData = this.funcForCredit(dateWiseFinaleJsonArrdataForCSV);
        console.log(creditData);
    }
    convertReportRowToJsonOject(reportDataArray) {
        let jsonObjectArrayForEveryRowofREport = [];
        for (let i = 0; i < reportDataArray.length; i++) {
            let singleRowData = reportDataArray[i].split(/\s{2,}/);
            this.trackIndexForDateRow(singleRowData, i);
            const everyRowOfReportDataAsObject = this.convertRowDataToJsonObject(singleRowData,i);
            jsonObjectArrayForEveryRowofREport.push(everyRowOfReportDataAsObject);
        }
        return jsonObjectArrayForEveryRowofREport;
    }
    trackIndexForDateRow(singlerowDataOfReport, indexOfDateRow){
        for (let j = 0; j < singlerowDataOfReport.length; j++) {
            if (singlerowDataOfReport[j] != '') {
                if (Utility.isValidDate(singlerowDataOfReport[j])) {
                    this.trackIndexForRowWithDate.push(indexOfDateRow);
                } 
            }

        }
    }
    convertRowDataToJsonObject(singlerowDataOfReport){
        let rowWithDateCounter = 0;
        const everyRowOfReportDataAsObject = {
            'Date': '',
            'VoucherNo':'',
            'DebitChart': [],
            'DebitAmount': [],
            'CreditChart': [],
            'CreditAmount': []
        }
        for (let j = 0; j < singlerowDataOfReport.length; j++) {
            if (singlerowDataOfReport[j] != '') {
                if (Utility.isValidDate(singlerowDataOfReport[j])) {
                    everyRowOfReportDataAsObject.Date = singlerowDataOfReport[j];
                    rowWithDateCounter++;
                } else if (!isNaN(singlerowDataOfReport[j])) {
                    if (rowWithDateCounter == 1) {
                        everyRowOfReportDataAsObject.VoucherNo = singlerowDataOfReport[j];
                        rowWithDateCounter++;
                    } else if (rowWithDateCounter > 1) {
                        everyRowOfReportDataAsObject.DebitAmount.push(singlerowDataOfReport[j]);
                        rowWithDateCounter++;
                    } else if (rowWithDateCounter == 0) {
                        everyRowOfReportDataAsObject.CreditAmount.push(singlerowDataOfReport[j]);
                    }
                } else {
                    if (rowWithDateCounter > 0) {
                        everyRowOfReportDataAsObject.DebitChart.push(singlerowDataOfReport[j]);
                        rowWithDateCounter++;
                    } else {
                        everyRowOfReportDataAsObject.CreditChart.push(singlerowDataOfReport[j]);
                    }
                }
            }

        }
        rowWithDateCounter = 0;
        return everyRowOfReportDataAsObject;
    }
    pushActualReportDataToArray(arrayOfDataReadFromStatement) {
        let actualReportDataStartingCount = 0;
        let arrayOfReportDataOnly = [];
        for (let i in arrayOfDataReadFromStatement) {
            if (arrayOfDataReadFromStatement[i].charCodeAt(0) === config.linBreakAciiCode) {
                actualReportDataStartingCount = 0;
            }
            actualReportDataStartingCount++;
            if (actualReportDataStartingCount > config.reportDataStartingLine) {
                arrayOfReportDataOnly.push(arrayOfDataReadFromStatement[i]);
            }
        }
        return arrayOfReportDataOnly;
    }
    mergedObjectForCSV(indextrackingArr, jsonObjArrEveryRow) {
        const singleDateObjectArrForCsv = [];
        for (let k = 0; k < indextrackingArr.length; k++) {
            let index = indextrackingArr[k];
            const dateWithObj = jsonObjArrEveryRow[index];
            for (let l = indextrackingArr[k]; l < indextrackingArr[k + 1]; l++) {
                if (l === index) continue;

                const withOutDateObj = jsonObjArrEveryRow[l];
                dateWithObj.DebitChart = Utility.mergedArray(dateWithObj.DebitChart, withOutDateObj.DebitChart);
                dateWithObj.CreditChart = Utility.mergedArray(dateWithObj.CreditChart, withOutDateObj.CreditChart);
                dateWithObj.CreditAmount = Utility.mergedArray(dateWithObj.CreditAmount, withOutDateObj.CreditAmount);
                dateWithObj.DebitAmount = Utility.mergedArray(dateWithObj.DebitAmount, withOutDateObj.DebitAmount);


            }
            singleDateObjectArrForCsv.push(dateWithObj);
        }
        return singleDateObjectArrForCsv;
    }
    funcForDebit(debitData) {
        let outputDataForCSV = [['Date', 'VoucherNO', 'Amount', 'TransType']];
        for (let k = 0; k < debitData.length; k++) {
            const curObjTobeInserted = debitData[k];
            const curDebitAmnt = curObjTobeInserted.DebitAmount;
            let row = [];
            for (let l = 0; l < curDebitAmnt.length; l++) {
                row = [curObjTobeInserted.Date, curObjTobeInserted.VoucherNo, curDebitAmnt[l], 'DR'];
            }
            outputDataForCSV.push(row);
        }
        return outputDataForCSV;
    }
    funcForCredit(creditData) {
        let outputDataForCSV = [['Date', 'VoucherNO', 'Amount', 'TransType']];
        for (let k = 0; k < creditData.length; k++) {
            const curObjTobeInserted = creditData[k];
            const curDebitAmnt = curObjTobeInserted.CreditAmount;
            let row = [];
            for (let l = 0; l < curDebitAmnt.length; l++) {
                row = [curObjTobeInserted.Date, curObjTobeInserted.VoucherNo, curDebitAmnt[l], 'CR'];
            }
            outputDataForCSV.push(row);
        }
        return outputDataForCSV;
    }
}
module.exports = FileReader;
