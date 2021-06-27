var host = "localhost:8777";

function testUi(useConsole) {
    this.controls = new uiControls();
    this.console = $("#console");

    this.useConsole = (useConsole === undefined) ? false : useConsole;

    var header = '<div class="group_header ui-widget-header ui-corner-all"></div>';
    var codeBlock = '<div id="code"><button id="code-button" class="example button test-element">Показать код</button>' + '<div id="code-view"><pre class="brush: js"></pre></div></div>';
    var runButton = '<button id="test-run" class="execute button test-element">Запустить</button>';

    $(".group").each(function (index) {
        if (!TestSuite[$(this).attr("id")]) return;
        var test = TestSuite[$(this).attr("id")];
        test.container = $(this);
        test.section = $(this).parent();

        $(this).html(header + $(this).html() + runButton);
        $(this).find(".group_header").text(test.description);

        $(this).find("#code-view > pre").text(test.runTest.toString());
        $(this).find("#test-run").click($.proxy(test.run, test));

        var code = $(this).find("#code");
        code.find("#code-button").toggle(function () {
            code.find("#code-view").show("Blind");
        }, function () {
            code.find("#code-view").hide("Blind");
        });
    });

    $("#add-custom-extension").click($.proxy(this.newCustomExtension, this));
    $("#add-new-recipient").click($.proxy(this.newCmsEncryptRecipient, this));
    $("#verify-add-signer").click($.proxy(this.newVerifySigner, this));


    for (let j = 0; j<=5; j++) {
      $(`#refresh-ca-list-from-db-${j}`).click($.proxy(function () {
          try {
            fetch(`http://${host}/ca/names`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json;charset=utf-8',
              },
            }).then((res) => {
            if (res.status >= 200 && res.status < 300) {
                return res;
            } else {
                let error = new Error(res.statusText);
                error.response = res;
                throw error
            }
          }).then(response => response.json()).then(data => {
              document.getElementById(`ca-list-from-db-${j}`).innerHTML = "";
              if (j == 1) {
                document.getElementById(`ca-list-from-db-${j}`).innerHTML +='<option value="">Сгенерировать корневой</option>';
              }
              for (let i in data) {
                document.getElementById(`ca-list-from-db-${j}`).innerHTML +='<option value="'+data[i].id+'">'+data[i].display_name+' | '+data[i].cn+'</option>';
              }
            }).catch(err => {
                ui.printResult("Не удалось выполнить запрос.")
            })
          } catch (error) {
              this.writeln(error.toString());
              ui.printResult("Не удалось выполнить запрос.")
          }
      }, this));
    }

    for (let j = 0; j<=4; j++) {
      $(`#refresh-user-cert-list-from-db-${j}`).click($.proxy(function () {
          try {
            fetch(`http://${host}/user/cert/names`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json;charset=utf-8',
              },
            }).then(response => response.json()).then(data => {
              document.getElementById(`user-cert-list-from-db-${j}`).innerHTML = "";
              for (let i in data) {
                if (j != 0 && j!= 4) {
                  document.getElementById(`user-cert-list-from-db-${j}`).innerHTML +='<option value="'+data[i].id+'">'+data[i].display_name+' | '+data[i].cn+'</option>';
                } else {
                   if (!data[i].issued) {
                     if (data[i].type == "token" && j == 0) {
                       document.getElementById(`user-cert-list-from-db-${j}`).innerHTML +='<option value="'+data[i].id+'">'+data[i].display_name+' | '+data[i].cn+' | '+data[i].type+'</option>';
                     }
                     if (data[i].type == "user" && j == 4) {
                       document.getElementById(`user-cert-list-from-db-${j}`).innerHTML +='<option value="'+data[i].id+'">'+data[i].display_name+' | '+data[i].cn+' | '+data[i].type+'</option>';
                     }
                   }
                }
              }
            }).catch(err => {
                ui.printResult("Не удалось выполнить запрос.")
            })
          } catch (error) {
              this.writeln(error.toString());
              ui.printResult("Не удалось выполнить запрос.")
          }
      }, this));
    }

    $("#refresh-ca-chain-list-from-db").click($.proxy(function () {
      var coll = document.getElementsByClassName("group-ca");
      for (let i = coll.length-1; i>=0 ; i--) {
        coll[i].remove();
      }
        try {
          fetch(`http://${host}/ca/names`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
            },
          }).then(response => response.json()).then(data => {
            but = document.getElementById('refresh-ca-chain-list-from-db');
            group = document.createElement("div")
            group.className = `group-ca`;
            for (let i in data) {
              d = document.createElement("div")
              d.className = `group-ca-elem`;
              b = document.createElement("div");
              b.className = "ca-chain-list";
              b.value = data[i].id;
              b.innerHTML = `Display name: ${data[i].display_name} | CN: ${data[i].cn} | Type: ${data[i].type}`;
              d.append(b)
              chain = document.createElement("div")
              chain.className = `chain-list`;
              var space = "------";
              for (let j in data[i].chain) {
                p = document.createElement("p")
                p.innerHTML = `${space} ${data[i].chain[j].display_name} | ${data[i].chain[j].cn}`;
                space = space + "------";
                chain.append(p);
              }
              d.append(chain);
              group.append(d)
            }
            but.after(group);
            coll = document.getElementsByClassName("ca-chain-list");
            for (i = 0; i < coll.length; i++) {
              coll[i].addEventListener("click", function() {
                this.classList.toggle("active");
                var content = this.nextElementSibling;
                if (content.style.maxHeight){
                  content.style.maxHeight = null;
                } else {
                  content.style.maxHeight = content.scrollHeight + "px";
                }
              });
            }
          }).catch(err => {
              ui.printResult("Не удалось выполнить запрос.")
          })
        } catch (error) {
            this.writeln(error.toString());
            ui.printResult("Не удалось выполнить запрос.")
        }
    }, this));

    $("#refresh-user-cert-chain-list-from-db").click($.proxy(function () {
      var coll = document.getElementsByClassName("group-cert");
      for (let i = coll.length-1; i>=0 ; i--) {
        coll[i].remove();
      }
        try {
          fetch(`http://${host}/user/cert/names`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
            },
          }).then(response => response.json()).then(data => {
            but = document.getElementById('refresh-user-cert-chain-list-from-db');
            group = document.createElement("div")
            group.className = `group-cert`;
            for (let i in data) {
              d = document.createElement("div")
              d.className = `group-cert-elem`;
              b = document.createElement("div");
              b.className = "cert-chain-list";
              b.value = data[i].id;
              b.innerHTML = `Display name: ${data[i].display_name} | issued: ${data[i].issued}`;
              d.append(b)
              chain = document.createElement("div")
              chain.className = `chain-list-for-cert`;
              var space = "------";
              for (let j in data[i].chain) {
                p = document.createElement("p")
                p.innerHTML = `${space} ${data[i].chain[j].display_name} | ${data[i].chain[j].cn}`;
                space = space + "------";
                chain.append(p);
              }
              d.append(chain);
              group.append(d)
            }
            but.after(group);
            coll = document.getElementsByClassName("cert-chain-list");
            for (i = 0; i < coll.length; i++) {
              coll[i].addEventListener("click", function() {
                this.classList.toggle("active");
                var content = this.nextElementSibling;
                if (content.style.maxHeight){
                  content.style.maxHeight = null;
                } else {
                  content.style.maxHeight = content.scrollHeight + "px";
                }
              });
            }
          }).catch(err => {
              ui.printResult("Не удалось выполнить запрос.")
          })
        } catch (error) {
            this.writeln(error.toString());
            ui.printResult("Не удалось выполнить запрос.")
        }
    }, this));

    var coll = document.getElementsByClassName("ca-chain-list");
    var i;

    for (i = 0; i < coll.length; i++) {
      coll[i].addEventListener("click", function() {
          this.classList.toggle("active");
          var content = this.nextElementSibling;
          if (content.style.display === "block") {
              content.style.display = "none";
            } else {
              content.style.display = "block";
            }
          });
    }

    $(".button").button();
    SyntaxHighlighter.highlight();

    $("#section").tabs({
        select: function () {
            ui.console.empty();
        }
    });



    $(document).on('change', '.public-key-algorithm', function(e) {
        if (this.options[e.target.selectedIndex].text != "RSA")
            document.getElementById("rsa-keygen-size").disabled = true;
        else
            document.getElementById("rsa-keygen-size").disabled = false;
    });

}

function uiControls() {
    this.deviceList = $("#device-list");
    this.keyList = $("#key-list");
    this.certificateList = $("#cert-list");
    this.systemStoreCertificateList = $("#system-store-cert-list");

    this.refreshDeviceListButton = $("#refresh-dev");
    this.refreshKeyListButton = $("#refresh-keys");
    this.refreshCertificateListButton = $("#refresh-certs");
    this.refreshSystemStoreCertificateListButton = $("#refresh-system-store-certs");

    this.loginButton = $("#login");
    this.logoutButton = $("#logout");

    this.savePinButton = $("#save-pin");
    this.removePinButton = $("#remove-pin");

    this.pinInput = $("#device-pin");
}

uiControls.prototype = {
    deviceList: null,
    keyList: null,
    certificateList: null,
    systemStoreCertificateList: null,

    refreshDeviceListButton: null,
    refreshKeyListButton: null,
    refreshCertificateListButton: null,
    refreshSystemStoreCertificateListButton: null,
    loginButton: null,
    logoutButton: null,
    savePinButton: null,
    removePinButton: null,

    pinInput: null
};

testUi.prototype = {
    controls: null,
    console: null,
    useConsole: null,

    clear: function () {
        this.console.empty();
    },
    write: function (text) {
        var str = text.replace(/\n/g, "<br>");
        this.console.html(this.console.html() + str);
        this.console.scrollTop(this.console[0].scrollHeight);
    },
    writeln: function (text) {
        this.write(text + "\n");
    },

    pin: function () {
        return this.controls.pinInput.val();
    },

    device: function () {
        var deviceId = Number(this.controls.deviceList.val());
        if (isNaN(deviceId)) throw "Нет доступных устройств";
        return deviceId;
    },

    key: function () {
        return this.controls.keyList.val();
    },

    certificate: function () {
        if (this.controls.certificateList.val() == null) throw "Сертификат не выбран";
        return this.controls.certificateList.val();
    },

    systemStoreCertificate: function () {
        if (this.controls.systemStoreCertificateList.val() == null) throw "Сертификат не выбран";
        return this.controls.systemStoreCertificateList.val();
    },

    addDevice: function (deviceId, label, selected) {
        selected = (selected === undefined) ? false : selected;
        ui.controls.deviceList.append($("<option>", {
            'value': deviceId,
            'selected': selected,
        }).text(label));
    },

    removeDevice: function (deviceId) {
        this.controls.deviceList.find("option[value='" + deviceId + "']").remove();
        if (!this.controls.deviceList.has('option').length) this.controls.deviceList.append($("<option>").text("Нет доступных устройств"));
    },

    removeInfoInDeviceList: function () {
        this.controls.deviceList.find('option:not([value])').remove();
    },

    clearDeviceList: function (message) {
        this.controls.deviceList.empty();
        if (message) this.controls.deviceList.append($("<option>").text(message));
    },

    addKey: function (keyId, label) {
        this.controls.keyList.append($("<option>", {
            'value': keyId
        }).text(label));
    },

    refreshKeyList: function (keys) {
        this.clearKeyList();
        if (keys.length != 0)
            for (var d in keys) this.addKey(keys[d]);
        else this.controls.keyList.append($("<option>").text("Ключи на устройстве отсутствуют"));
    },

    clearKeyList: function (message) {
        this.controls.keyList.empty();
        if (message) this.controls.keyList.append($("<option>").text(message));
    },

    addCertificate: function (handle, certificate, category) {
        var description = "";
        switch (category) {
        case plugin.CERT_CATEGORY_USER:
            description = "Пользовательский| ";
            break;
        case plugin.CERT_CATEGORY_CA:
            description = "Корневой| ";
            break;
        case plugin.CERT_CATEGORY_OTHER:
            description = "Другой| ";
            break;
        case plugin.CERT_CATEGORY_UNSPEC:
            description = "Не задана| ";
            break;
        }

        var subjectDNs = certificate.subject;
        var noSubject = true;
        for (c in subjectDNs) {
            if (subjectDNs[c]["rdn"] == "commonName" || subjectDNs[c]["rdn"] == "emailAddress") {
                noSubject = false;
                description += subjectDNs[c]["rdn"] + "=" + subjectDNs[c]["value"] + "|";
            }
        }
        if (noSubject) description += certificate.serialNumber;

        var title = "Serial number: " + certificate.serialNumber + "\n\nIssuer:\n\t";
        var issuerDNs = certificate.issuer;
        for (c in issuerDNs) {
            title += issuerDNs[c]["rdn"] + "=" + issuerDNs[c]["value"] + "\n\t";
        }

        this.controls.certificateList.append($("<option>", {
            'value': handle,
            'title': $.trim(title).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;")
        }).text(noSubject ? certificate.serialNumber : description));
    },

    addSystemStoreCertificate: function (certificate) {
        this.controls.systemStoreCertificateList.append($("<option>", {
            'value': certificate,
            'title': "Store certificate"}).text(certificate));
    },

    clearCertificateList: function (message) {
        this.controls.certificateList.empty();
        if (message) this.controls.certificateList.append($("<option>").text(message));
    },

    clearSystemStoreCertificateList: function (message) {
        this.controls.systemStoreCertificateList.empty();
        if (message) this.controls.systemStoreCertificateList.append($("<option>").text(message));
    },

    getContent: function (container, index) {
        if (index === undefined)
            index = 0;
        var elements = container.find(".text-input, .input");
        return elements[index].value;
    },

    setContent: function (container, text) {
        return container.find(".text-output").val(text);
    },

    infoType: function () {
        var value = $(".radio-input:radio[name=device-info]:checked").val();
        switch (value) {
        case "model":
            return plugin.TOKEN_INFO_MODEL;
        case "reader":
            return plugin.TOKEN_INFO_READER;
        case "label":
            return plugin.TOKEN_INFO_LABEL;
        case "type":
            return plugin.TOKEN_INFO_DEVICE_TYPE;
        case "serial":
            return plugin.TOKEN_INFO_SERIAL;
        case "logged":
            return plugin.TOKEN_INFO_IS_LOGGED_IN;
        case "formats":
            return plugin.TOKEN_INFO_FORMATS;
        case "features":
            return plugin.TOKEN_INFO_FEATURES;
        case "mechanisms":
            return plugin.TOKEN_INFO_SUPPORTED_MECHANISMS;
        case "speed":
            return plugin.TOKEN_INFO_SPEED;
        case "free memory":
            return plugin.TOKEN_INFO_FREE_MEMORY;
        case "pins":
            return plugin.TOKEN_INFO_PINS_INFO;
        case "fkn":
            return plugin.TOKEN_INFO_FKN_SUPPORTED;
        }
    },

    keyInfoType: function () {
        var value = $(".radio-input:radio[name=key-info]:checked").val();
        switch (value) {
        case "algorithm":
            return plugin.KEY_INFO_ALGORITHM;
        }
    },

    certificateType: function () {
        var value = $(".radio-input:radio[name=certificate-category]:checked").val();
        switch (value) {
        case "user":
            return plugin.CERT_CATEGORY_USER;
        case "ca":
            return plugin.CERT_CATEGORY_CA;
        case "other":
            return plugin.CERT_CATEGORY_OTHER;
        }
    },

    certificateInfoType: function () {
        var value = $(".radio-input:radio[name=certificate-info]:checked").val();
        switch (value) {
        case "serial number":
            return plugin.CERT_INFO_SERIAL_NUMBER;
        }
    },

    hashType: function () {
        var value = $(".radio-input:radio[name=hash-type]:checked").val();
        switch (value) {
        case "3411_94":
            return plugin.HASH_TYPE_GOST3411_94;
        }
    },

    checkboxState: function (container, name) {
        return container.find("input:checkbox[name=" + name + "]:checked").val();
    },

    registerEvents: function () {
        this.controls.refreshDeviceListButton.click($.proxy(function () {
            try {
                plugin.enumerateDevices();
            } catch (error) {
                this.writeln(error.toString());
                this.clearDeviceList(error.toString());
            }
        }, this));



        this.controls.refreshKeyListButton.click($.proxy(function () {
            try {
                plugin.enumerateKeys();
            } catch (error) {
                this.writeln(error.toString());
                this.clearKeyList(error.toString());
            }
        }, this));

        this.controls.refreshCertificateListButton.click($.proxy(function () {
            try {
                plugin.enumerateCertificates();
            } catch (error) {
                this.writeln(error.toString());
                this.clearCertificateList(error.toString());
            }
        }, this));

        this.controls.refreshSystemStoreCertificateListButton.click($.proxy(function () {
            try {
                plugin.enumerateStoreCertificates();
            } catch (error) {
                this.writeln(error.toString());
                this.clearSystemStoreCertificateList(error.toString());
            }
        }, this));

        this.controls.loginButton.click($.proxy(function () {
            try {
                plugin.login();
            } catch (error) {
                this.writeln(error.toString());
            }
        }, this));

        this.controls.logoutButton.click($.proxy(function () {
            try {
                plugin.logout();
            } catch (error) {
                this.writeln(error.toString());
            }
        }, this));

        this.controls.savePinButton.click($.proxy(function () {
            try {
                plugin.savePin();
            } catch (error) {
                this.writeln(error.toString());
            }
        }, this));

        this.controls.removePinButton.click($.proxy(function () {
            try {
                plugin.removePin();
            } catch (error) {
                this.writeln(error.toString());
            }
        }, this));

        this.controls.deviceList.change($.proxy(function () {
            if (plugin.autoRefresh) {
                plugin.enumerateKeys();
                plugin.enumerateCertificates();
            } else {
                this.clearKeyList("Обновите список ключевых пар");
                this.clearCertificateList("Обновите список сертификатов");
            }
        }, this));
    },

    printError: function (error) {
        if (this.useConsole) {
            console.trace();
            console.debug(arguments);
        }
        let errorCode = getErrorCode(error);
        if (plugin.errorDescription[errorCode] === undefined)
        {
            this.writeln("Внутренняя ошибка (Код: " + errorCode + ") \n");
        }
        else
        {
            this.writeln("Ошибка: " + plugin.errorDescription[errorCode] + "\n");
        }
    },

    printResult: function (message) {
        if (this.useConsole) {
            console.trace();
            console.debug(arguments);
        }
        if (undefined === message) {
            this.writeln("Выполнен" + "\n");
            return;
        }
        if ($.isArray(message)) {
            if (message.length) this.writeln("Массив длиной(" + message.length + "): \n" + message.join("\n") + "\n");
            else this.writeln("<Пустой массив>");
            return;
        }
        if (Object.prototype.toString.call(message) === '[object Object]') {
            this.writeln(JSON.stringify(message, null, "\t") + "\n");
            return;
        }
        if (message === "") {
            this.writeln("<Пустая строка>" + "\n");
            return;
        }
        this.writeln(message + "\n");
    },

    getSubject: function () {
        var inputs = $("#cert-subject input");
        var subject = [];
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].value != "") {
                var dn = {
                    "rdn": inputs[i].id,
                    "value": inputs[i].value
                }
                subject.push(dn);
            }
        }
        return subject;
    },

    getExtensions: function () {
        var inputs = $("#cert-extensions input");
        var keyUsage = [];
        var extKeyUsage = [];
        var certificatePolicies = [];

        for (var i = 0; i < inputs.length; i++) {
            var checkbox = inputs[i];
            if (checkbox.checked) switch (checkbox.name) {
            case "cert-exts-keyusage":
                keyUsage.push(checkbox.value);
                break;
            case "cert-exts-extkeyusage":
                extKeyUsage.push(checkbox.value);
                break;
            case "cert-exts-policies":
                certificatePolicies.push(checkbox.value);
                break;
            }
        }

        var extensions = {
            "keyUsage": keyUsage,
            "extKeyUsage": extKeyUsage,
            "certificatePolicies": certificatePolicies
        };
        return extensions;
    },

    getCustomExtensions: function () {
        var inputs = $("#custom-extensions input");
        var customExtensions = [];

        for (var i = 0; i < inputs.length/3; i++) {
            var oid = inputs[i*3].value;
            var asnBase64 = inputs[i*3+1].value;
            var crit = inputs[i*3+2];

            if (oid.length == 0 || asnBase64.length == 0)
                continue;

            customExtensions.push({
                "oid": oid,
                "value": asnBase64,
                "criticality": crit.checked
            });
        }
        return customExtensions;
    },

    readFile: function (container, callback) {
        if (undefined === window.FileReader) {
            throw "Браузер не поддерживает объект FileReader";
        }
        var e = container.find("#sign-file")[0];
        if (e.files.length == 0) throw "Не выбран файл для подписи";
        var f = e.files[0];

        var r = new FileReader();
        r.readAsBinaryString(f);
        r.onloadend = function (event) {
            callback($.base64.encode(event.target.result));
        };
    },

    newVerifySigner: function() {
        var table = document.getElementById("Certificates");

        var row = table.insertRow(table.rows.length - 1);
        var cell = row.insertCell(0);
        cell.colSpan = 2;
        cell.innerHTML = "<hr>";

        row = table.insertRow(table.rows.length - 1);
        cell = row.insertCell(0);
        cell.innerHTML = '<label for="cert">Cертификат</label>\
            <textarea id="cert" class="verify-signer"></textarea>'

        cell = row.insertCell(1);
        cell.innerHTML = '<img src="images/close.png" alt="x" width=24 height=24/>';
        cell.onclick = this.deleteVerifySigner;
    },

    deleteVerifySigner: function() {
        const numberOfRowsToDelete = 2;
        var table = document.getElementById("Certificates");
        var row = $(this).closest("tr");
        var rIndex = row[0].rowIndex;

        for(var i = 0; i < numberOfRowsToDelete; i++)
            table.deleteRow(rIndex-1);
    },

    newCmsEncryptRecipient: function() {
        var table = document.getElementById("Recipients");

        var row = table.insertRow(table.rows.length - 1);
        var cell = row.insertCell(0);
        cell.colSpan = 2;
        cell.innerHTML = "<hr>";

        row = table.insertRow(table.rows.length - 1);
        cell = row.insertCell(0);
        cell.innerHTML = '<label for="encrypt-certificate">Тело сертификата</label>\
            <textarea id="encrypt-certificate" class="recipient" rows="7"></textarea>'

        cell = row.insertCell(1);
        cell.innerHTML = "<img src=\"images/close.png\" alt=\"x\" width=24 height=24/>";
        cell.onclick = this.deleteRecipient;
    },

    deleteRecipient: function() {
        var table = document.getElementById("Recipients");
        var row = $(this).closest("tr");
        var rIndex = row[0].rowIndex;

        for(var i = 0; i < 2; i++)
            table.deleteRow(rIndex-1);
    },

    newCustomExtension: function() {
        var table = document.getElementById("custom-extensions");

        var row = table.insertRow(table.rows.length - 1);
        var cell = row.insertCell(0);
        cell.colSpan = 2;
        cell.innerHTML = "<hr>";

        row = table.insertRow(table.rows.length - 1);
        cell = row.insertCell(0);
        cell.innerHTML = "<label>OID</label>";
        cell = row.insertCell(1);
        cell.innerHTML = "<input type=\"text\" name=\"custom-ext-oid\">";
        cell = row.insertCell(2);
        cell.innerHTML = "<img src=\"images/close.png\" alt=\"x\" width=24 height=24/>";
        cell.onclick = this.deleteCustomExtension;

        row = table.insertRow(table.rows.length - 1);
        cell = row.insertCell(0);
        cell.innerHTML = "<label>value</label>";
        cell = row.insertCell(1);
        cell.innerHTML = "<input type=\"text\" name=\"custom-ext-value\">";

        row = table.insertRow(table.rows.length - 1);
        cell = row.insertCell(0);
        cell.innerHTML = "<label><input class=\"checkbox-input\" type=\"checkbox\" name=\"custom-ext-crit\">Critical</label>";
    },

    deleteCustomExtension: function() {
        var table = document.getElementById("custom-extensions");
        var row = $(this).closest("tr");
        var rIndex = row[0].rowIndex;

        for(var i = 0; i < 4; i++)
            table.deleteRow(rIndex-1);
    }
}

function timedCallbackProxy(func, name) {
    return function() {
        console.timeEnd(name);
        func.apply(this, arguments);
    };
}

function timedProxy(pluginObject, name) {
    return function() {
        console.time(name);
        arguments[arguments.length - 2] = timedCallbackProxy(arguments[arguments.length - 2], name);
        arguments[arguments.length - 1] = timedCallbackProxy(arguments[arguments.length - 1], name);
        pluginObject[name].apply(pluginObject, arguments);
    };
}

function cryptoPlugin(pluginObject, noAutoRefresh) {
    this.autoRefresh = noAutoRefresh ? false : true;

    this.pluginObject = pluginObject;
    if (!this.pluginObject.valid) this.delayedReport("Error: couldn't get CryptopluginObject");

    for (var key in this.pluginObject) {
        if (this[key]) continue;

        if (typeof(this.pluginObject[key]) == "function") this[key] = timedProxy(this.pluginObject, key);
        else this[key] = this.pluginObject[key];
    }

    this.errorCodes = this.pluginObject.errorCodes;
    this.errorDescription[this.errorCodes.UNKNOWN_ERROR] = "Неизвестная ошибка";
    this.errorDescription[this.errorCodes.BAD_PARAMS] = "Неправильные параметры";
    this.errorDescription[this.errorCodes.NOT_ENOUGH_MEMORY] = "Недостаточно памяти";

    this.errorDescription[this.errorCodes.DEVICE_NOT_FOUND] = "Устройство не найдено";
    this.errorDescription[this.errorCodes.DEVICE_ERROR] = "Ошибка устройства";
    this.errorDescription[this.errorCodes.TOKEN_INVALID] = "Ошибка чтения/записи устройства. Возможно, устройство было извлечено. Попробуйте выполнить enumerate";

    this.errorDescription[this.errorCodes.CERTIFICATE_CATEGORY_BAD] = "Недопустимый тип сертификата";
    this.errorDescription[this.errorCodes.CERTIFICATE_EXISTS] = "Сертификат уже существует на устройстве";
    this.errorDescription[this.errorCodes.CERTIFICATE_NOT_FOUND] = "Сертификат не найден";
    this.errorDescription[this.errorCodes.CERTIFICATE_HASH_NOT_UNIQUE] = "Хэш сертификата не уникален";
    this.errorDescription[this.errorCodes.CA_CERTIFICATES_NOT_FOUND] = "Корневые сертификаты не найдены";
    this.errorDescription[this.errorCodes.CERTIFICATE_VERIFICATION_ERROR] = "Ошибка проверки сертификата";

    this.errorDescription[this.errorCodes.PKCS11_LOAD_FAILED] = "Не удалось загрузить PKCS#11 библиотеку";

    this.errorDescription[this.errorCodes.PIN_LENGTH_INVALID] = "Некорректная длина PIN-кода";
    this.errorDescription[this.errorCodes.PIN_INCORRECT] = "Некорректный PIN-код";
    this.errorDescription[this.errorCodes.PIN_LOCKED] = "PIN-код заблокирован";
    this.errorDescription[this.errorCodes.PIN_CHANGED] = "PIN-код был изменен";
    this.errorDescription[this.errorCodes.PIN_INVALID] = "PIN-код содержит недопустимые символы";
    this.errorDescription[this.errorCodes.USER_PIN_NOT_INITIALIZED] = "PIN-код пользователя не инициализирован";

    this.errorDescription[this.errorCodes.SESSION_INVALID] = "Состояние токена изменилось";
    this.errorDescription[this.errorCodes.USER_NOT_LOGGED_IN] = "Выполните вход на устройство";
    this.errorDescription[this.errorCodes.ALREADY_LOGGED_IN] = "Вход на устройство уже был выполнен";

    this.errorDescription[this.errorCodes.ATTRIBUTE_READ_ONLY] = "Свойство не может быть изменено";
    this.errorDescription[this.errorCodes.KEY_NOT_FOUND] = "Соответствующая сертификату ключевая пара не найдена";
    this.errorDescription[this.errorCodes.KEY_ID_NOT_UNIQUE] = "Идентификатор ключевой пары не уникален";
    this.errorDescription[this.errorCodes.CEK_NOT_AUTHENTIC] = "Выбран неправильный ключ";
    this.errorDescription[this.errorCodes.KEY_LABEL_NOT_UNIQUE] = "Метка ключевой пары не уникальна";
    this.errorDescription[this.errorCodes.WRONG_KEY_TYPE] = "Неправильный тип ключа";
    this.errorDescription[this.errorCodes.LICENCE_READ_ONLY] = "Лицензия доступна только для чтения";

    this.errorDescription[this.errorCodes.DATA_INVALID] = "Неверные данные";
    this.errorDescription[this.errorCodes.DATA_LEN_RANGE] = "Некорректный размер данных";
    this.errorDescription[this.errorCodes.UNSUPPORTED_BY_TOKEN] = "Операция не поддерживается токеном";
    this.errorDescription[this.errorCodes.KEY_FUNCTION_NOT_PERMITTED] = "Операция запрещена для данного типа ключа";

    this.errorDescription[this.errorCodes.BASE64_DECODE_FAILED] = "Ошибка декодирования даных из BASE64";
    this.errorDescription[this.errorCodes.PEM_ERROR] = "Ошибка разбора PEM";
    this.errorDescription[this.errorCodes.ASN1_ERROR] = "Ошибка декодирования ASN1 структуры";

    this.errorDescription[this.errorCodes.FUNCTION_REJECTED] = "Операция отклонена пользователем";
    this.errorDescription[this.errorCodes.FUNCTION_FAILED] = "Невозможно выполнить операцию";
    this.errorDescription[this.errorCodes.MECHANISM_INVALID] = "Указан неправильный механизм";
    this.errorDescription[this.errorCodes.ATTRIBUTE_VALUE_INVALID] = "Передан неверный атрибут";

    this.errorDescription[this.errorCodes.X509_UNABLE_TO_GET_ISSUER_CERT] = "Невозможно получить сертификат подписанта";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_GET_CRL] = "Невозможно получить CRL";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_DECRYPT_CERT_SIGNATURE] = "Невозможно расшифровать подпись сертификата";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_DECRYPT_CRL_SIGNATURE] = "Невозможно расшифровать подпись CRL";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY] = "Невозможно раскодировать открытый ключ эмитента";
    this.errorDescription[this.errorCodes.X509_CERT_SIGNATURE_FAILURE] = "Неверная подпись сертификата";
    this.errorDescription[this.errorCodes.X509_CRL_SIGNATURE_FAILURE] = "Неверная подпись CRL";
    this.errorDescription[this.errorCodes.X509_CERT_NOT_YET_VALID] = "Срок действия сертификата еще не начался";
    this.errorDescription[this.errorCodes.X509_CRL_NOT_YET_VALID] = "Срок действия CRL еще не начался";
    this.errorDescription[this.errorCodes.X509_CERT_HAS_EXPIRED] = "Срок действия сертификата истек";
    this.errorDescription[this.errorCodes.X509_CRL_HAS_EXPIRED] = "Срок действия CRL истек";
    this.errorDescription[this.errorCodes.X509_ERROR_IN_CERT_NOT_BEFORE_FIELD] = "Некорректные данные в поле \"notBefore\" у сертификата";
    this.errorDescription[this.errorCodes.X509_ERROR_IN_CERT_NOT_AFTER_FIELD] = "Некорректные данные в поле \"notAfter\" у сертификата";
    this.errorDescription[this.errorCodes.X509_ERROR_IN_CRL_LAST_UPDATE_FIELD] = "Некорректные данные в поле \"lastUpdate\" у CRL";
    this.errorDescription[this.errorCodes.X509_ERROR_IN_CRL_NEXT_UPDATE_FIELD] = "Некорректные данные в поле \"nextUpdate\" у CRL";
    this.errorDescription[this.errorCodes.X509_OUT_OF_MEM] = "Нехватает памяти";
    this.errorDescription[this.errorCodes.X509_DEPTH_ZERO_SELF_SIGNED_CERT] = "Недоверенный самоподписанный сертификат";
    this.errorDescription[this.errorCodes.X509_SELF_SIGNED_CERT_IN_CHAIN] = "В цепочке обнаружен недоверенный самоподписанный сертификат";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_GET_ISSUER_CERT_LOCALLY] = "Невозможно получить локальный сертификат подписанта";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_VERIFY_LEAF_SIGNATURE] = "Невозможно проверить первый сертификат";
    this.errorDescription[this.errorCodes.X509_CERT_CHAIN_TOO_LONG] = "Слишком длинная цепочка сертификатов";
    this.errorDescription[this.errorCodes.X509_CERT_REVOKED] = "Сертификат отозван";
    this.errorDescription[this.errorCodes.X509_INVALID_CA] = "Неверный корневой сертификат";
    this.errorDescription[this.errorCodes.X509_INVALID_NON_CA] = "Неверный некорневой сертфикат, помеченный как корневой";
    this.errorDescription[this.errorCodes.X509_PATH_LENGTH_EXCEEDED] = "Превышена длина пути";
    this.errorDescription[this.errorCodes.X509_PROXY_PATH_LENGTH_EXCEEDED] = "Превышина длина пути прокси";
    this.errorDescription[this.errorCodes.X509_PROXY_CERTIFICATES_NOT_ALLOWED] = "Проксирующие сертификаты недопустимы";
    this.errorDescription[this.errorCodes.X509_INVALID_PURPOSE] = "Неподдерживаемое назначение сертификата";
    this.errorDescription[this.errorCodes.X509_CERT_UNTRUSTED] = "Недоверенный сертификат";
    this.errorDescription[this.errorCodes.X509_CERT_REJECTED] = "Сертифкат отклонен";
    this.errorDescription[this.errorCodes.X509_APPLICATION_VERIFICATION] = "Ошибка проверки приложения";
    this.errorDescription[this.errorCodes.X509_SUBJECT_ISSUER_MISMATCH] = "Несовпадения субьекта и эмитента";
    this.errorDescription[this.errorCodes.X509_AKID_SKID_MISMATCH] = "Несовпадение идентификатора ключа у субьекта и доверенного центра";
    this.errorDescription[this.errorCodes.X509_AKID_ISSUER_SERIAL_MISMATCH] = "Несовпадение серийного номера субьекта и доверенного центра";
    this.errorDescription[this.errorCodes.X509_KEYUSAGE_NO_CERTSIGN] = "Ключ не может быть использован для подписи сертификатов";
    this.errorDescription[this.errorCodes.X509_UNABLE_TO_GET_CRL_ISSUER] = "Невозможно получить CRL подписанта";
    this.errorDescription[this.errorCodes.X509_UNHANDLED_CRITICAL_EXTENSION] = "Неподдерживаемое расширение";
    this.errorDescription[this.errorCodes.X509_KEYUSAGE_NO_CRL_SIGN] = "Ключ не может быть использован для подписи CRL";
    this.errorDescription[this.errorCodes.X509_KEYUSAGE_NO_DIGITAL_SIGNATURE] = "Ключ не может быть использован для цифровой подписи";
    this.errorDescription[this.errorCodes.X509_UNHANDLED_CRITICAL_CRL_EXTENSION] = "Неподдерживаемое расширение CRL";
    this.errorDescription[this.errorCodes.X509_INVALID_EXTENSION] = "Неверное или некорректное расширение сертификата";
    this.errorDescription[this.errorCodes.X509_INVALID_POLICY_EXTENSION] = "Неверное или некорректное расширение политик сертификата";
    this.errorDescription[this.errorCodes.X509_NO_EXPLICIT_POLICY] = "Явные политики отсутствуют";
    this.errorDescription[this.errorCodes.X509_DIFFERENT_CRL_SCOPE] = "Другая область CRL";
    this.errorDescription[this.errorCodes.X509_UNSUPPORTED_EXTENSION_FEATURE] = "Неподдерживаемое расширение возможностей";
    this.errorDescription[this.errorCodes.X509_UNNESTED_RESOURCE] = "RFC 3779 неправильное наследование ресурсов";
    this.errorDescription[this.errorCodes.X509_PERMITTED_VIOLATION] = "Неправильная структура сертифката";
    this.errorDescription[this.errorCodes.X509_EXCLUDED_VIOLATION] = "Неправильная структура сертфиката";
    this.errorDescription[this.errorCodes.X509_SUBTREE_MINMAX] = "Неправильная структура сертифката";
    this.errorDescription[this.errorCodes.X509_UNSUPPORTED_CONSTRAINT_TYPE] = "Неправильная структура сертфиката";
    this.errorDescription[this.errorCodes.X509_UNSUPPORTED_CONSTRAINT_SYNTAX] = "Неправильная структура сертифката";
    this.errorDescription[this.errorCodes.X509_UNSUPPORTED_NAME_SYNTAX] = "Неправильная структура сертфиката";
    this.errorDescription[this.errorCodes.X509_CRL_PATH_VALIDATION_ERROR] = "Неправильный путь CRL";
    this.errorDescription[this.errorCodes.CMS_CERTIFICATE_ALREADY_PRESENT] = "Сертификат уже используется";
    this.errorDescription[this.errorCodes.CANT_HARDWARE_VERIFY_CMS] = "Проверка множественной подписи с вычислением хеша на устройстве не поддерживается";
    this.errorDescription[this.errorCodes.DECRYPT_UNSUCCESSFUL] = "Расшифрование не удалось"

    if (this.autoRefresh) this.enumerateDevices();
}

cryptoPlugin.prototype = {
    pluginObject: null,
    errorCodes: null,
    errorDescription: [],
    methods: null,
    constants: null,
    autoRefresh: null,

    delayedReport: function (message) {
        setTimeout(function () {
            ui.writeln(message + "\n");
        }, 0);
    },

    enumerateDevices: function (update) {
        if (update) {
            var options = {"mode": this.ENUMERATE_DEVICES_EVENTS};

            this.pluginObject.enumerateDevices(options).then($.proxy(function (devices) {
                for (key in devices) {
                    switch (key) {
                        case "connected":
                            for(var d in devices[key]) {
                                var dev = devices[key][d];
                                // To handle fast device reconnect first try to remove it.
                                ui.removeDevice(dev);

                                this.pluginObject.getDeviceInfo(dev, plugin.TOKEN_INFO_LABEL).then($.proxy(function (device) {
                                    return function (label) {
                                        if (label == "Rutoken ECP <no label>") label = "Rutoken ECP #" + device.toString();
                                        ui.removeInfoInDeviceList();
                                        ui.addDevice(device, label, false);

                                        if (ui.device() == device) {
                                            if (this.autoRefresh) this.enumerateKeys(device);
                                            if (this.autoRefresh) this.enumerateCertificates(device);
                                            else ui.clearCertificateList("Обновите список сертификатов");
                                        }
                                    };
                                }(dev), this), $.proxy(ui.printError, ui));
                            }
                            break;
                        case "disconnected":
                            for (var d in devices[key]) {
                                var selectedDevice = ui.device(),
                                    device = devices[key][d];

                                ui.removeDevice(device);

                                if (device == selectedDevice) {
                                    try {
                                        var dev = ui.device();

                                        if (this.autoRefresh) this.enumerateKeys(ui.device());
                                        if (this.autoRefresh) this.enumerateCertificates(ui.device());
                                        else ui.clearCertificateList("Обновите список сертификатов");
                                    } catch (e) {
                                        ui.clearDeviceList("Нет доступных устройств");
                                        ui.clearCertificateList("Нет доступных устройств");
                                        ui.clearKeyList("Нет доступных устройств");
                                    }
                                }
                            }
                            break;
                    }
                }
            }, this), $.proxy(ui.printError, ui));
        } else {
            ui.clearDeviceList("Список устройств обновляется...");

            var options = {"mode": this.ENUMERATE_DEVICES_LIST};

            this.pluginObject.enumerateDevices(options).then($.proxy(function (devices) {
                if (Object.keys(devices).length == 0) {
                    ui.clearDeviceList("Нет доступных устройств");
                    ui.clearCertificateList("Нет доступных устройств");
                    ui.clearKeyList("Нет доступных устройств");
                    return;
                }
                //            ui.clearKeyList("Выполните вход на устройство");
                ui.clearDeviceList();
                if (this.autoRefresh) this.enumerateKeys(devices[0]);
                if (this.autoRefresh) this.enumerateCertificates(devices[0]);
                else ui.clearCertificateList("Обновите список сертификатов");

                for (var d in devices) {
                    this.pluginObject.getDeviceInfo(devices[d], plugin.TOKEN_INFO_LABEL).then($.proxy(function (device) {
                        return function(label) {
                            if (label == "Rutoken ECP <no label>") label = "Rutoken ECP #" + device.toString();
                            ui.addDevice(device, label, false);
                        };
                    }(devices[d]), this), $.proxy(ui.printError, ui));
                }
            }, this), $.proxy(ui.printError, ui));
        }
    },

    enumerateKeys: function (deviceId, marker) {
        ui.clearKeyList("Список ключевых пар обновляется...");
        marker = (marker === undefined) ? "" : marker;
        deviceId = (deviceId === undefined) ? ui.device() : deviceId;
        this.pluginObject.enumerateKeys(deviceId, marker).then($.proxy(function (keys) {
            if (keys.length == 0) {
                ui.clearKeyList("На устройстве отсутствуют ключевые пары");
                return;
            }

            ui.clearKeyList();
            for (var k in keys) {
                this.pluginObject.getKeyLabel(deviceId, keys[k]).then(function (key) {
                    return function (label) {
                        if (label == "") label = "key: " + key.toString();
                        ui.addKey(key, label);
                    };
                }(keys[k]), $.proxy(ui.printError, ui));
            }
        }, this), function (error) {
            let errorCode = getErrorCode(error);
            if (errorCode == plugin.errorCodes.USER_NOT_LOGGED_IN) ui.clearKeyList(plugin.errorDescription[errorCode]);
            else ui.printError(error);
        });
    },

    enumerateCertificates: function (deviceId) {
        ui.clearCertificateList("Список сертификатов обновляется...");
        var device = (deviceId === undefined) ? ui.device() : deviceId;
        try {
            var certs = [];
            this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_USER).then($.proxy(function (certificates) {
                ui.clearCertificateList();
                for (var c in certificates)
                    certs.push({certificate: certificates[c], category: this.CERT_CATEGORY_USER});

                return this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_CA);
            }, this)).then($.proxy(function (certificates) {
                for (var c in certificates)
                    certs.push({certificate: certificates[c], category: this.CERT_CATEGORY_CA});

                return this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_OTHER);
            }, this)).then($.proxy(function (certificates) {
                for (var c in certificates)
                    certs.push({certificate: certificates[c], category: this.CERT_CATEGORY_OTHER});

                return this.pluginObject.enumerateCertificates(device, this.CERT_CATEGORY_UNSPEC);
            }, this)).then($.proxy(function (certificates) {
                for (var c in certificates)
                    certs.push({certificate: certificates[c], category: this.CERT_CATEGORY_UNSPEC});

                var parsedCerts = [];
                for (var c in certs) {
                    parsedCerts.push(this.pluginObject.parseCertificate(device, certs[c].certificate).then(function (handle, category) {
                        return function (parsedCert) {
                            ui.addCertificate(handle, parsedCert, category);
                        };
                    }(certs[c].certificate, certs[c].category), $.proxy(ui.printError, ui)));
                }

                Promise.all(parsedCerts).then(function () {
                    try {
                        ui.certificate();
                    } catch (e) {
                        ui.clearCertificateList("На устройстве отсутствуют сертификаты");
                    }
                });
            }, this), function (error) {
                ui.printError(error);
                ui.clearCertificateList("Произошла ошибка");
            });
        } catch (e) {
            // ui now throws an exception if there is no devices avalable
            console.log(e);
        }
    },

    enumerateStoreCertificates: function () {
        function addSystemStoreCertificates(certificates) {
            for (var c in certificates) {
                ui.addSystemStoreCertificate(certificates[c]);
            }
        }

        ui.clearSystemStoreCertificateList("Список сертификатов обновляется...");
        try {
            var options = {};
            this.pluginObject.enumerateStoreCertificates(options).then($.proxy(function (certificates) {
                ui.clearSystemStoreCertificateList();
                $.proxy(addSystemStoreCertificates, this)(certificates);

                try {
                    var systemStoreCertificate = ui.systemStoreCertificate();
                } catch (e) {
                    ui.clearSystemStoreCertificateList("В хранилище отсутствуют сертификаты");
                }
            }, this), function (error) {
                ui.printError(error);
                ui.clearSystemStoreCertificateList("Произошла ошибка");
            });
        } catch (e) {
            console.log(e);
        }
    },

    login: function () {
        this.pluginObject.login(ui.device(), ui.pin()).then($.proxy(function () {
            ui.writeln("Вход выполнен\n");
            if (this.autoRefresh) this.enumerateKeys();
            else ui.clearKeyList("Обновите список ключевых пар");
        }, this), $.proxy(ui.printError, ui));
    },

    logout: function () {
        this.pluginObject.logout(ui.device()).then($.proxy(function () {
            ui.writeln("Выход выполнен\n");
            plugin.pluginObject.getDeviceInfo(ui.device(), plugin.TOKEN_INFO_IS_LOGGED_IN).then(function (result) {
                if (!result) ui.clearKeyList("Выполните вход на устройство");
            }, $.proxy(ui.printError, ui));
        }, this), $.proxy(ui.printError, ui));
    },

    savePin: function () {
        this.pluginObject.savePin(ui.device()).then($.proxy(function () {
            ui.writeln("PIN-код сохранен в кэше\n");
        }, this), $.proxy(ui.printError, ui));
    },

    removePin: function () {
        this.pluginObject.removePin(ui.device()).then($.proxy(function () {
            ui.writeln("PIN-код удален из кэша\n");
            ui.clearKeyList("Выполните вход на устройство");
        }, this), $.proxy(ui.printError, ui));
    }
}

// ts begin
var TestSuite = new(function () {

    function Test() {
        this.run = function () {
            ui.writeln(this.description() + ":");
            try {
                this.runTest();
            } catch (e) {
                ui.writeln(e + "\n");
            }
        }
    };

    this.GetCa = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получить корневой или промежуточный сертификат";
        };
        this.runTest = function () {
          id = this.container.find("#ca-list-from-db-5").val();
          fetch(`http://${host}/ca?id=${id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
            },
          }).then(result => result.json()).then(datas => {
            for (let i in datas) {
              let data = datas[i];
              let certForSave = data.cert
              let keyForSave = data.private_key
              let a = document.createElement("a");
              let file = new Blob([certForSave]);
              a.href = URL.createObjectURL(file);
              a.download = data.display_name.replaceAll(" ", "_")+"-cert.pem";
              a.click();
              let b = document.createElement("a");
              let file2 = new Blob([keyForSave]);
              b.href = URL.createObjectURL(file2);
              b.download = data.display_name.replaceAll(" ", "_")+"-key.pem";
              b.click();
            }
          }).catch(err => {
              ui.printResult("Не удалось выполнить запрос.")
          });
        };
    })();

    this.GenCa = new(function () {
        Test.call(this);
        this.description = function () {
            return "Сгенерировать корневой или промежуточный сертификат";
        };
        this.runTest = function () {
              let cert_fields = {cn: this.container.find(".gen-ca-cert-cn").val()}
              let user = {
                display_name: this.container.find(".gen-ca-cert-dn").val(),
                cert_fields: cert_fields,
                signed_id: this.container.find("#ca-list-from-db-1").val(),
              }
              fetch(`http://${host}/ca`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify(user)
              }).then(response => response.json()).then(result => {
                if (result.id != undefined) {
                  ui.printResult("Сертифкат сохранен в базу.");
                } else {
                  console.log(result.message)
                  ui.printResult("Не удалось выполнить запрос.");
                }
              }).catch(err => {
                  ui.printResult("Не удалось выполнить запрос.")
              });
        };
    })();

    this.PutCa = new(function () {
        Test.call(this);
        this.description = function () {
            return "Обновить данные о корневом или промежуточном сертификате";
        };
        this.runTest = function () {
              let info = {
                id: this.container.find("#ca-list-from-db-3").val(),
                display_name: this.container.find(".put-ca-dn").val()
              }
              fetch(`http://${host}/ca`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify(info)
              }).then(result => {
                switch (result.status) {
                  case 200:
                    ui.printResult("Данные обновлены.");
                    break;
                  case 404:
                    ui.printResult("Сертифкат не найден.");
                    break;
                  case 400:
                    ui.printResult("Неверные данные.");
                    break;
                  default:
                    ui.printResult("Не удалось выполнить запрос.");
                    console.log(result.json().message);
                }
              }).catch(err => {
                  ui.printResult("Не удалось выполнить запрос.")
              });
        };
    })();

    this.DeleteCa = new(function () {
        Test.call(this);
        this.description = function () {
            return "Удалить корневой или промежуточный сертификат";
        };
        this.runTest = function () {
              id = this.container.find("#ca-list-from-db-2").val();
              fetch(`http://${host}/ca?id=${id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8',
                },
              }).then(result => {
                switch (result.status) {
                  case 200:
                    ui.printResult("Сертифкат удален.");
                    break;
                  case 404:
                    ui.printResult("Сертифкат не найден.");
                    break;
                  case 403:
                    ui.printResult("Запрещено удалять сертификат.");
                    break;
                  case 400:
                    ui.printResult("Неверные данные.");
                    break;
                  default:
                    ui.printResult("Не удалось выполнить запрос.");
                    console.log(result.json().message)
                }
              }).catch(err => {
                  ui.printResult("Не удалось выполнить запрос.")
              });
        };
    })();

    this.GetNamesCa = new(function () {
        Test.call(this);
        this.description = function () {
            return "Посмотреть цепочки сертификатов";
        };
        this.runTest = function () {
        };
    })();

    this.GetUserCert = new(function () {
        Test.call(this);
        this.description = function () {
            return "Получить сертификат";
        };
        this.runTest = function () {
              id = this.container.find("#user-cert-list-from-db-4").val();
              format = this.container.find("#type-getting-cert").val();
              password = this.container.find("#get-user-cert-password").val();
              var url
              if (format == "pem") {
                url = `http://${host}/user/cert?id=${id}`
              } else {
                url = `http://${host}/user/cert/p12?id=${id}&password=${password}`
              }
              fetch(url, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8',
                },
              }).then(result => result.json()).then(datas => {
                for (let i in datas) {
                  let data = datas[i];
                  let certForSave = data.cert_p12
                  let a = document.createElement("a");
                  console.log(certForSave);
                  let needed = window.atob(certForSave)
                  a.href = 'data:application/x-pkcs12;base64,' + encodeURIComponent(certForSave);;
                  if (format == "pem") {
                    a.download = data.display_name.replaceAll(" ", "_")+"-cert.pem";
                  } else {
                    a.download = data.display_name.replaceAll(" ", "_")+".p12";
                  }
                  a.click();
                  if (format == "pem") {
                    let keyForSave = data.private_key
                    let b = document.createElement("a");
                    let file2 = new Blob([keyForSave]);
                    b.href = URL.createObjectURL(file2);
                    b.download = data.display_name.replaceAll(" ", "_")+"-key.pem";
                    b.click();
                  }
                }
              }).catch(err => {
                  ui.printResult("Не удалось выполнить запрос.")
              });
              //   console.log(result.status);
              //   switch (result.status) {
              //     case 200: {
              //       let datas = await result.json()
              //       console.log(datas);
              //       for (let i in datas) {
              //         console.log("here");
              //         let data = datas[i];
              //         console.log(data);
              //         let certForSave = data.cert
              //         let keyForSave = data.private_key
              //         let a = document.createElement("a");
              //         let file = new Blob([certForSave]);
              //         a.href = URL.createObjectURL(file);
              //         a.download = data.display_name+"-cert.pem";
              //         a.click();
              //         let b = document.createElement("a");
              //         let file2 = new Blob([keyForSave]);
              //         b.href = URL.createObjectURL(file2);
              //         b.download = data.display_name+"-key.pem";
              //         b.click();
              //       }
              //       break;
              //     }
              //
              //     case 404:
              //       ui.printResult("Сертифкат не найден.");
              //       break;
              //     case 403:
              //       ui.printResult("Запрещено.");
              //       break;
              //     case 400:
              //       ui.printResult("Неверные данные.");
              //       break;
              //     default:
              //       ui.printResult("Не удалось выполнить запрос.");
              //       console.log(result.json().message)
              //   }
              // });
        };
    })();

    this.GenUserCert = new(function () {
        Test.call(this);
        this.description = function () {
            return "Сгенерировать сертификат";
        };
        this.runTest = function () {
              let cert_fields = {cn: this.container.find(".gen-user-cert-cn").val()}
              let user = {
                display_name: this.container.find(".gen-user-cert-dn").val(),
                cert_fields: cert_fields,
                signed_id: this.container.find("#ca-list-from-db-4").val(),
              }
              fetch(`http://${host}/user/cert`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify(user)
              }).then((res) => {
              if (res.status >= 200 && res.status < 300) {
                  return res;
              } else {
                  let error = new Error(res.statusText);
                  error.response = res;
                  throw error
              }
            }).then(response => response.json()).then(result => {
                if (result.id != undefined) {
                  ui.printResult("Сертифкат сохранен в базу.");
                } else {
                  console.log(result.message)
                  ui.printResult("Не удалось выполнить запрос.");
                }
              }).catch(err => {
                  console.log('Error: ' + err.message);
                  console.log(err.response);
                  ui.printResult("Не удалось выполнить запрос.")
                  ui.printResult(err);
              });
        };
    })();

    this.PutUserCert = new(function () {
        Test.call(this);
        this.description = function () {
            return "Обновить данные о конечном сертификате";
        };
        this.runTest = function () {
              let info = {
                id: this.container.find("#user-cert-list-from-db-3").val(),
                display_name: this.container.find(".put-user-cert-dn").val()
              }
              fetch(`http://${host}/user/cert`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify(info)
              }).then(result => {
                switch (result.status) {
                  case 200:
                    ui.printResult("Данные обновлены.");
                    break;
                  case 404:
                    ui.printResult("Сертифкат не найден.");
                    break;
                  case 400:
                    ui.printResult("Неверные данные.");
                    break;
                  default:
                    ui.printResult("Не удалось выполнить запрос.");
                    console.log(result.json().message);
                }
              }).catch(err => {
                  ui.printResult("Не удалось выполнить запрос.")
              });
        };
    })();

    this.DeleteUserCert = new(function () {
        Test.call(this);
        this.description = function () {
            return "Удаление сертификата";
        };
        this.runTest = function () {
              id = this.container.find("#user-cert-list-from-db-2").val();
              fetch(`http://${host}/user/cert?id=${id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json;charset=utf-8',
                },
              }).then(result => {
                switch (result.status) {
                  case 200:
                    ui.printResult("Сертифкат удален.");
                    break;
                  case 404:
                    ui.printResult("Сертифкат не найден.");
                    break;
                  case 403:
                    ui.printResult("Запрещено удалять сертификат.");
                    break;
                  case 400:
                    ui.printResult("Неверные данные.");
                    break;
                  default:
                    ui.printResult("Не удалось выполнить запрос.");
                    console.log(result.json().message)
                }
              }).catch(err => {
                  ui.printResult("Не удалось выполнить запрос.")
              });
        };
    })();

    this.GetTokenCert = new(function () {
        Test.call(this);
        this.description = function () {
            return "Сохранить сертификат на токен";
        };
        this.runTest = function () {
          id = this.container.find("#user-cert-list-from-db-0").val(),
          fetch(`http://${host}/user/cert?id=${id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
            },
          }).then(response => response.json()).then(result => {
            cert = result[0].cert;
            console.log(cert);
            plugin.pluginObject.importCertificate(ui.device(), cert, 1).then($.proxy(function (certificateHandle) {
                if (plugin.autoRefresh) plugin.enumerateCertificates();
                else ui.clearCertificateList("Обновите список сертификатов");
                ui.printResult(certificateHandle);
            }, this), $.proxy(ui.printError, ui));
          }
        ).catch(err => {
            ui.printResult("Не удалось выполнить запрос.")
        })
      };
    })();

    this.GenTokenCert = new(function () {
        Test.call(this);
        this.description = function () {
            return "Выписать сертификат с помощью токена";
        };
        this.runTest = function () {

            var options = {
                "subjectSignTool": this.container.find(".subject-sign-tool").val(),
                "hashAlgorithm": plugin[this.container.find(".hash-algorithm").val()],
                "customExtensions": ui.getCustomExtensions()
            };
            plugin.pluginObject.createPkcs10(ui.device(), ui.key(), ui.getSubject(), ui.getExtensions(), options).then($.proxy(function (res) {
                let inf = {cn: this.container.find(".gen-token-cert-cn").val()}
                let user = {
                  display_name: this.container.find(".gen-token-cert-dn").val(),
                  signed_id: this.container.find("#ca-list-from-db-0").val(),
                  cert_fields: inf,
                  csr: res
                }
                fetch(`http://${host}/user/cert/token`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                  },
                  body: JSON.stringify(user)
                }).then(response => response.json()).then(result => {
                  if (result.id != undefined) {
                    ui.printResult("Сертифкат сохранен в базу.");
                  } else {
                    console.log(result.message)
                    ui.printResult("Не удалось выполнить запрос.");
                  }
                }).catch(err => {
                    ui.printResult("Не удалось выполнить запрос.")
                });
            }, this), $.proxy(ui.printError, ui));
        };
    })();

    this.GetNamesUserCert = new(function () {
        Test.call(this);
        this.description = function () {
            return "Посмотреть сертификаты";
        };
        this.runTest = function () {
        };
    })();

})();

function onPluginLoaded(pluginObject) {
    try {
        var noAutoRefresh = (document.location.search.indexOf("noauto") !== -1);

        plugin = new cryptoPlugin(pluginObject, noAutoRefresh);
        ui.registerEvents();

        window.setInterval(function() {
            if (document.visibilityState == "visible") {
                plugin.enumerateDevices(true);
            }}, 500);
    } catch (error) {
        ui.writeln(error);
    }
}

function initUi() {
    var useConsole = (document.location.search.indexOf("log") !== -1);
    ui = new testUi(useConsole);
}

function getErrorCode(error) {
    let errorCode = 0;
    if (isNmPlugin)
        errorCode = parseInt(error.message);
    else
        errorCode = error;
    return errorCode;
}

function showError(reason) {
    $("#content").css("display", "none");
    $("#console-container").css("border", "none");
    $("#bottom-bar-container").css("top", "0%");

    console.log(reason);
    ui.writeln(reason);
}

function detectOS() {
    const platform = navigator.platform.toLowerCase(),
        iosPlatforms = ['iphone', 'ipad', 'ipod', 'ipod touch'];

    if (platform.includes('mac')) return 'MacOS';
    if (iosPlatforms.includes(platform)) return 'iOS';
    if (platform.includes('win')) return 'Windows';
    if (/android/.test(navigator.userAgent.toLowerCase())) return 'Android';
    if (/linux/.test(platform)) return 'Linux';

    return 'unknown';
}

window.onload = function () {
    rutoken.ready.then(function () {
        initUi();
        os = detectOS();
        but = document.getElementById('bottom-bar-container');
        a = document.createElement("a");
        l = document.createElement("p");
        var isChrome = !!window.chrome;
        var isFirefox = typeof InstallTrigger !== 'undefined';
        var verOffset, fullVersion, majorVersion;
        var performCheck = true;
        if ((verOffset = navigator.userAgent.indexOf('Firefox')) != -1) {
            fullVersion = navigator.userAgent.substring(verOffset + 8);
            majorVersion = parseInt(''+fullVersion,10);
            if (majorVersion < 53) { // Don't check on ESR and older ones
                performCheck = false;
            }
        }

        isNmPlugin = true;
        if (performCheck && (isChrome || isFirefox)) {
            return rutoken.isExtensionInstalled();
        } else {
            isNmPlugin = false;
            return Promise.resolve(true);
        }
    }).then(function (result) {
        if (result) {
            return rutoken.isPluginInstalled();
        } else {
            if (!!window.chrome) {
              a.href = "https://chrome.google.com/webstore/detail/%D0%B0%D0%B4%D0%B0%D0%BF%D1%82%D0%B5%D1%80-%D1%80%D1%83%D1%82%D0%BE%D0%BA%D0%B5%D0%BD-%D0%BF%D0%BB%D0%B0%D0%B3%D0%B8%D0%BD/ohedcglhbbfdgaogjhcclacoccbagkjg";
              a.innerHTML = "Установить";
              but.append(a)
            }
            if (typeof InstallTrigger !== 'undefined') {
              a.href = "https://addons.mozilla.org/ru/firefox/addon/adapter-rutoken-plugin/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search";
              a.innerHTML = "Установить";
              but.append(a)
            }
            throw "Расширение \"Адаптер Рутокен Плагин\" не установлено";
        }
    }).then(function (result) {
        if (result) {
            return rutoken.loadPlugin();
        } else {
            if (os == "Linux") {
              a.href = "https://download.rutoken.ru/Rutoken_Plugin/4.5.5.0/Linux/libnpRutokenPlugin_4.5.5-1_amd64.deb";
              l.innerHTML = "После загрузки выполнить: sudo dpkg -i libnpRutokenPlugin_4.5.5-1_amd64.deb ."
              a.innerHTML = "Скачать";
              but.append(a)
              but.append(l)
            }
            if (os == "Windows") {
              a.href = "https://download.rutoken.ru/Rutoken_Plugin/4.5.5.0/Windows/RutokenPlugin.msi";
              l.innerHTML = "После загрузки запустить, нажать далее, далее, установить."
              a.innerHTML = "Скачать";
              but.append(a)
              but.append(l)
            }
            if (os == "MacOS") {
              a.href = "https://download.rutoken.ru/Rutoken_Plugin/4.5.5.0/macOS/RutokenPlugin.pkg";
              l.innerHTML = "После загрузки запустить, нажать продолжить, установить, закрыть."
              a.innerHTML = "Скачать";
              but.append(a)
              but.append(l)
            }
            throw "Рутокен Плагин не установлен";
        }
    }).then(function (plugin) {
        onPluginLoaded(plugin);
    }).then(undefined, function (reason) {
        showError(reason);

    });
}
