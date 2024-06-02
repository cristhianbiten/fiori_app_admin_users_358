sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/ui/layout/form/SimpleForm",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Label, Input, TextArea, SimpleForm, MessageBox) {
        "use strict";

        return Controller.extend("br.com.gestao.fioriappadmin358.controller.i18n", {
            onInit: function () {
                this.trocaIdioma();
            },

            enviaCadastro: function () {

                var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

                // busca valores dos inputs
                var cliente = this.getView().byId("cliente").getValue();
                var cidade = this.getView().byId("cidade").getValue();
                var estado = this.getView().byId("estado").getValue();

                // Busca a mensagem no i18n e coloca os parametros
                var sMensagem = oResourceBundle.getText("msgConfirmacao", [cliente, cidade, estado])

                // Cria a mensagem
                MessageBox.confirm(sMensagem, {
                    onClose: function(sButton) {
                        if (sButton === MessageBox.Action.OK) {
                            console.log("teste")
                        }
                    }
                });
                
                

            },

            trocaIdioma: function () {
                var i18nModel = new sap.ui.model.resource.ResourceModel({
                    bundleUrl: "i18n/i18n.properties",
                    bundleLocale: "de",
                    bundleName: "br.com.gestao.fioriappadmin358.i18n.i18n_de"
                });

                this.getView().setModel(i18nModel, "i18n");
            }

        });
    });
