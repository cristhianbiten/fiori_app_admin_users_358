sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Label, Input, TextArea, SimpleForm, JSONModel) {
        "use strict";

        return Controller.extend("br.com.gestao.fioriappadmin358.controller.DataBiding", {
            onInit: function () {

                var objtModelJSON = new JSONModel();
                objtModelJSON.loadData("dados/Produtos.json");
                this.getView().setModel(objtModelJSON, "Model_JSON_Produtos");

            },

            getRegion: function () {
                var objtRegionModel = new JSONModel();
                objtRegionModel.loadData("dados/Regions.json");
                this.getView().setModel(objtRegionModel, "Model_JSON_Regions");

                var objFormulario = this.getView().byId("form_regions")
                objFormulario.bindElement("Model_JSON_Regions>/regions/1");
            }

        });
    });
