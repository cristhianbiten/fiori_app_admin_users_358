sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/ui/layout/form/SimpleForm"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Label, Input, TextArea, SimpleForm) {
        "use strict";

        return Controller.extend("br.com.gestao.fioriappusers358.controller.Objetos", {
            onInit: function () {

            },
            onClicaSet: function (event) {

                var objTitle = this.getView().byId("headerTitle");
                objTitle.setText("Novo Titulo do Header");

            },
            onClicaGet: function (event) {
                var objTitle = this.getView().byId("headerTitle");
                var sValorText = objTitle.getText();
                console.log(sValorText);
            },
            addForm: function (event) {
                //Criando uma referência do obj Panel
                var objPanel = this.getView().byId("panel_form");

                //Chama o método destroyContent para eliminar todo o conteúdo do Panel
                objPanel.destroyContent();

                //Criando os objetos do Formulario 
                var objItensForm = [];

                objItensForm.push(new Label("lblPergunta1", {
                    text: "Pergunta 1",
                    required: true
                }));

                objItensForm.push(new Input("inputPergunta1", {
                    value: "Valor da Pergunta 1"
                }));

                objItensForm.push(new Label("lblPergunta2", {
                    text: "Pergunta 2",
                    required: false
                }));

                objItensForm.push(new TextArea("txtArea", {
                    rows: 7
                }));

                //Criando simple form
                var oForm = new SimpleForm("simpleForm", {
                    content: objItensForm
                });

                //Adicionar o Form dentro do Panel
                objPanel.addContent(oForm);


            }
        });
    });
