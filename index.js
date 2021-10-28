const express = require('express');
const port = 3000
const app = express();
const fs = require('fs')
const Parser = require("csv-parse");
const puppeteer = require('puppeteer');
const IP = require("ip");

const ip = IP.address();

let parser = Parser({ columns: true }, (err, res) => {
    if (err) {
        console.log(err);
    }
    else {
        //console.log(res);
        condense(res);
    }
});

let questions = JSON.parse(fs.readFileSync(__dirname + '/questions.json'));
const fileName = questions.fileName;
delete questions.fileName;
let quest = Object.values(questions);
function passCSV(res) {
    let out = [];
    let keys = Object.keys(res);
    for (let key in keys) {
        let obj = res[key];
        //console.log(obj);
        let entries = Object.entries(obj);
        for (let entire in entries) {
            out.push(entries[entire]);
        }

    }
    return out;
}

let values = [];
let questionTypes = [];

function condense(res) {
    let answers = passCSV(res);

    for (let key in Object.keys(quest)) {
        values[quest[key].name] = [];
        questionTypes.push(quest[key].type);
    }

    //console.log(Object.entries(quest));

    //console.log(quest);
    for (let key in answers) {
        let current = answers[key];
        //console.log(current);
        let cQuest = getQuestion(current[0]);
        if (cQuest != null) {
            if (cQuest.split != null && cQuest.split != "") {
                let splitted = current[1].split(cQuest.split);
                for (let cSplit in splitted) {
                    addString(current[0], splitted[cSplit]);
                }
            }
            else {
                addString(current[0], current[1]);
            }
        }
    }

    console.log(values);
}

function addString(category, value) {
    if (values[category][value] != null) {
        values[category][value] += 1;
    }
    else {
        values[category][value] = 1;
    }
}

function getQuestion(name) {
    for (let key in Object.keys(quest)) {
        let cQuest = quest[key];
        if (cQuest.name == name)
            return cQuest;
    }
    return null;
}


function flattenArray(array) {
    let out = [];
    for (let key in array) {
        //console.log(key);
        out.push(key);
        if (Array.isArray(array[key]))
            out.push(flattenArray(array[key]));
        else
            out.push(array[key]);
    }
    return out;
}

fs.createReadStream(__dirname + "/" + fileName).pipe(parser);


//let values = ["A", ["1", 2], "B", ["1", 1, "2", 1]];

//Render image
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://' + ip + ":" + port, {
        waitUntil: 'networkidle2',
    });

    await page.waitForFunction('window.status === "ready"');

    let to_remove = "delete";
    await page.evaluate((sel) => {
        var element = document.getElementById(sel);
        element.parentNode.removeChild(element);
    }, to_remove)

    await page.screenshot({ path: './public/charts.png', fullPage: true });

    await browser.close();

    console.log("Took image");
})();


app.set('view engine', 'ejs');

app.get("/", (req, res) => {
    //console.log(JSON.stringify(questionTypes));
    let array = flattenArray(values);
    res.render('index', {
        chart: {
            length: array.length,
            data: JSON.stringify(array),
            types: JSON.stringify(questionTypes)
        }
    });
})

app.use(express.static('./public'))

app.listen(port, () => {
    console.log("App listening at http://localhost:" + port)
})