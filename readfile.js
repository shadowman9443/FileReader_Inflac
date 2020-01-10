const fs = require('fs');
const readline = require('readline');
function convert(file) {
    fs.readFile(file, function (err, data) {
        if (err) throw err;
        var array = data.toString().split("\n");
        let beforedatapushcount = 0;
        let convertedTxTdataArr = [];
        for (i in array) {
            if (array[i].charCodeAt(0) === 12) {
                beforedatapushcount = 0;
            }
            beforedatapushcount++;
            if (beforedatapushcount > 7) {
                convertedTxTdataArr.push(array[i]);
            }

        }
        let tempJsonObjArr = [];
        let trackIndexForNotNullDateArr = [];
        for (let i = 0; i < convertedTxTdataArr.length; i++) {
            let singleDateData = convertedTxTdataArr[i].split(/\s{2,}/);
            let datewithdatacounter = 0;
            const convertedObjectdata = {
                'Date': '',
                'VoucherNo': [],
                'DebitChart': [],
                'DebitAmount': [],
                'CreditChart': [],
                'CreditAmount': []
            }
            for(let j = 0; j<singleDateData.length;j++){
                if(singleDateData[j] !=''){                   
                    if(isValidDate(singleDateData[j]))
	                {
                        convertedObjectdata.Date = singleDateData[j];
                        trackIndexForNotNullDateArr.push(i);
                        datewithdatacounter++;
	                }else if(!isNaN(singleDateData[j])){
                        if(datewithdatacounter==1){
                            convertedObjectdata.VoucherNo = singleDateData[j];
                            datewithdatacounter++;
                        }else if(datewithdatacounter>1){
                            convertedObjectdata.DebitAmount.push(singleDateData[j]);
                            datewithdatacounter++;
                        }else if(datewithdatacounter==0){
                            convertedObjectdata.CreditAmount.push(singleDateData[j]);
                        }
                    }else{
                        if(datewithdatacounter>0){
                            convertedObjectdata.DebitChart.push(singleDateData[j]);
                            datewithdatacounter++;
                        }else{
                            convertedObjectdata.CreditChart.push(singleDateData[j]);
                        }
                    }
                }
               
            } 
            datewithdatacounter = 0;
            tempJsonObjArr.push(convertedObjectdata);    
        }
        let dataForCSV = [];
        dataForCSV = mergedObjectForCSV(trackIndexForNotNullDateArr,tempJsonObjArr);
        const debitData = funcForDebit(dataForCSV);
        console.log(debitData);
        console.log('*******************');
        const creditData = funcForCredit(dataForCSV);
        console.log(creditData);
       
    });
}
function mergedObjectForCSV(indextrackingArr, jsonObjArr){
        const outPutArrForCSV = [];
        for(let k=0; k<indextrackingArr.length ; k++){
            let index = indextrackingArr[k];
            const dateWithObj = jsonObjArr[index];
            for(let l=indextrackingArr[k];l<indextrackingArr[k+1];l++){
                if(l===index) continue;
                
                const mergedObj = jsonObjArr[l];
                
                dateWithObj.DebitChart = dateWithObj.DebitChart.concat(mergedObj.DebitChart);
                dateWithObj.CreditChart = dateWithObj.CreditChart.concat(mergedObj.CreditChart);
                dateWithObj.CreditAmount = dateWithObj.CreditAmount.concat(mergedObj.CreditAmount);
                dateWithObj.DebitAmount = dateWithObj.DebitAmount.concat(mergedObj.DebitAmount);
                

            }
            outPutArrForCSV.push(dateWithObj);
        }
        return outPutArrForCSV;
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