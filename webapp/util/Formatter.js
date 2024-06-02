sap.ui.define([
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat"
],
    function (DateFormat, NumberFormat) {
        "use strict";

        var Formatter = {

            date: function (value) {

                //Busca informações das configurações
                var oConfiguration = sap.ui.getCore().getConfiguration();
                //Busca o local
                var oLocale = oConfiguration.getFormatLocale();

                var oPattern;

                if (oLocale === "pt-BR") {
                    oPattern = "dd/MM/yyyy";
                } else {
                    oPattern = "MM/dd/yyyy";
                }

                if (value) {
                    var year = new Date(value).getFullYear();
                    if (year === 9999) {
                        return "";
                    } else {
                        var oDateFormat = DateFormat.getDateTimeInstance({
                            //style: "short"
                            pattern: oPattern
                        });

                        return oDateFormat.format(new Date(value));
                    }
                } else {
                    return value;
                }

            },

            dateSAP: function (value) {
                if (value) {

                    var dateParts = value.split("/");
                    var dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                    var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                        pattern: "yyyy-MM-ddTHH:mm:ss"
                    });

                    return oDateFormat.format(new Date(dateObject));

                } else {
                    return value;
                }
            },

            // Apresentar o texto do status mediante a propriedade Status do model
            statusProduto: function (value) {
                // Busca informações do arquivo i18n
                var oBundle = this.getView().getModel("i18n").getResourceBundle();

                try {
                    return oBundle.getText("status" + value);
                } catch (error) {
                    return "";
                }
            },

            //Apresentar o estado (cor) do objeto status mediante a propriedade Status do model
            stateProduto: function (value) {

                try {

                    const statusMap = {
                        "E": "Success",
                        "P": "Warning",
                        "F": "Error"
                    };

                    return statusMap[value] || "None";

                } catch (error) {
                    return "None";
                }
            },
            //Apresentar o ícone correspondente mediante a propriedade Status do model
            iconProduto: function (value) {

                try {

                    const iconMap = {
                        "E": "sap-icon://sys-enter-2",
                        "P": "sap-icon://alert",
                        "F": "sap-icon://error"
                    };

                    return iconMap[value] || "";

                } catch (error) {
                    return "";
                }
            },
            //Apresentar os valores númericos formatados tipo decimal
            floatNumber: function (value) {

                var numFloat = NumberFormat.getFloatInstance({
                    maxFractionDigits: 2,
                    minFractionDigits: 2,
                    groupingEnabled: true,
                    groupingSeparator: ".",
                    decimalSeparator: ","
                })

                return numFloat.format(value);

            },

        };

        return Formatter;

    }, true);