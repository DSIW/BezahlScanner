var configuration = {},
    matchers = [{
        property: 'iban',
        text: ['IBAN'],
        required: true
    }, {
        property: 'name',
        text: ['BEGÜNSTIGTER', 'EMPFÄNGER'],
        required: true
    }, {
        property: 'iban',
        text: ['IBAN'],
        required: true
    }, {
        property: 'bic',
        text: ['BIC'],
        required: false
    }, {
        property: 'amount',
        text: ['BETRAG'],
        required: true
    }, {
        property: 'reason',
        text: ['VERWENDUNG'],
        required: true
    }],
    isComplete = function () {
        var missingMatcher = !matchers.find(function (m) {
            return !!m.required && !configuration[m.property];
        });
        return !!missingMatcher;
    },
    padLeft = function (value, padChar, targetSize) {
        var out = value + "";
        while (out.length < targetSize) {
            out = padChar + out;
        }
        return out;
    },
    dateToString = function (date) {
        var day = padLeft(date.getDate(), "0", 2),
            month = padLeft(date.getMonth() + 1, "0", 2),
            hours = padLeft(date.getHours(), "0", 2),
            minutes = padLeft(date.getMinutes(), "0", 2),
            seconds = padLeft(date.getSeconds(), "0", 2);
        return day + "." + month + "." + date.getFullYear() + " " + hours + ":" + minutes + ":" + seconds;
    },
    getDriveDocumentId = function (fct) {
        chrome.storage.sync.get("driveDocumentId", function (items) {
            fct(items.driveDocumentId);
        });
    },
    loadData = function (fct) {
        getDriveDocumentId(function (docId) {
            if (!docId) {
                return;
            }
            $.get("https://drive.google.com/uc?id=" + docId, function (result) {
                var data = $.csv2Array(result);
                if (data && data.length > 0) {
                    fct(data
                        .slice(1, data.length)
                        .map(function (el) {
                            return {
                                "date": dateToString(new Date(el[0])),
                                "name": el[1],
                                "bic": el[2],
                                "iban": el[3],
                                "amount": el[4],
                                "reason": el[5]
                            }
                        }));
                }
            });
        });

    },
    setTextField = function (id, value) {
        $("#" + id).val(value);
    },
    fillFormWith = function (data) {
        setTextField(configuration.name, data.name);
        setTextField(configuration.iban, data.iban);
        setTextField(configuration.bic, data.bic);
        setTextField(configuration.amount, data.amount);
        setTextField(configuration.reason, data.reason);
    },
    columnWithContent = function (content) {
        var col = $("<td style='white-space: nowrap;padding:1px'/>");
        col.html(content);
        return col;
    },
    createContentTable = function (data) {
        var arrowImage = chrome.extension.getURL("right_arrow.png");
        var table = $("<table/>");
        data.map(function (el) {
            var row = $("<tr/>"),
                image = $("<img style='width:15px;height:15px' width='15px' height='15px' src='" + arrowImage + "'/>"),
                imageCol = $("<td/>");

            imageCol.append(image);

            row.append(columnWithContent(el.date));
            row.append(columnWithContent(el.name));
            row.append(columnWithContent(el.amount));
            row.append(columnWithContent(el.reason));
            row.append(imageCol);

            imageCol.click(function () {
                fillFormWith(el);
            });

            return row;
        }).forEach(function (el) {
            table.append(el);
        });
        return table;

    },
    createContent = function (data) {
        if (data.length == 0) {
            return;
        }
        var content = $("<div id='bezahlScanner'/>"),
            table = createContentTable(data),
            header = $("<a href='#'>BezahlScanner</a>");

        content.append(header);
        content.append(table);

        table.hide();
        header.click(function () {
            table.toggle(1000);
        });

        $(".if5_schrittfolge,.content-header,#f1-messages,#moneyTransfer_transferDataForm_accountDetails").after(content);
    };

$("label").each(function () {
    var obj = $(this);
    var text = obj.text().toUpperCase();

    matchers.forEach(function (m) {
        m.text.forEach(function (t) {
            if (text.indexOf(t) != -1) {
                var labelForId = obj.attr("for");
                if (labelForId) {
                    configuration[m.property] = labelForId;
                } else {
                    var input = $(obj.parent()).find("input[type!=hidden],textarea:visible");
                    if (input) {
                        configuration[m.property] = input.attr("id");
                    }
                }
            }
        })

    });
});

if (isComplete()) {
    loadData(function (data) {
        createContent(data);
    });
}

