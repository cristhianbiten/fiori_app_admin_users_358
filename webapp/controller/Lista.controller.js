sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "br/com/gestao/fioriappusers358/util/Formatter",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "sap/ui/model/json/JSONModel",
    "br/com/gestao/fioriappusers358/util/Validator",
    "sap/m/MessageBox",
    "sap/m/BusyDialog",
    "sap/ui/model/odata/ODataModel",
    "sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, FilterOperator, Formatter, Fragment, ValueState, JSONModel, Validator, MessageBox, BusyDialog, ODataModel, MessageToast) {
        "use strict";

        return Controller.extend("br.com.gestao.fioriappusers358.controller.Lista", {

            objFormatter: Formatter,

            onInit: function () {

                //Busca informações das configurações
                //var oConfiguration = sap.ui.getCore().getConfiguration();
                //Configura o formatador para o local
                //oConfiguration.setFormatLocale("pt-BR");

                sap.ui.getCore().attachValidationError(function (oEvent) {
                    oEvent.getParameter("element").setValueState(ValueState.Error);
                });

                sap.ui.getCore().attachValidationSuccess(function (oEvent) {
                    oEvent.getParameter("element").setValueState(ValueState.Success);
                });

            },

            criarModel: function () {

                // Model Usuario
                var oModel = new JSONModel();
                this.getView().setModel(oModel, "MDL_Usuario")

            },

            onSearch: function () {

                //Capturando individulamente cada objeto Input do objeto Filter Bar
                var oUsuarioIdInput = this.getView().byId("usuarioIdInput");
                var oUsuarioPrimeiroNomeInput = this.getView().byId("usuarioFirstNameInput");
                var oUsuarioEmailInput = this.getView().byId("emailInput");

                var objFilter = { filters: [], and: true };

                if (oUsuarioIdInput.getValue()) {
                    objFilter.filters.push(new Filter("Userid", FilterOperator.EQ, oUsuarioIdInput.getValue().toUpperCase()));
                }

                if (oUsuarioPrimeiroNomeInput.getValue()) {
                    objFilter.filters.push(new Filter("Firstname", FilterOperator.Contains, oUsuarioPrimeiroNomeInput.getValue().toUpperCase()));
                }

                if (oUsuarioEmailInput.getValue()) {
                    objFilter.filters.push(new Filter("Email", FilterOperator.Contains, oUsuarioEmailInput.getValue().toUpperCase()));
                }

                //Cria o objeto Filter baseado no valor do objeto
                var oFilter = new Filter(objFilter);

                //Busca objeto Table
                var oTable = this.getView().byId("tableUsuarios");

                //Localiza a agregação items onde sabemos qual a entetidade onde será aplicado o filtro
                var binding = oTable.getBinding("items");

                //É aplicado o filtro para o databinding
                binding.filter(oFilter);
            },

            onRouting: function () {

                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("Detalhes");

            },

            onSelectedItem: function (oEvent) {

                // Passo 1 - Captura do valor do usuario (id)
                var oUserId = oEvent.getSource().getBindingContext().getProperty("Userid");

                // Passo 2 - Envio para o Route de Detalhes com parametro
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("Detalhes", { userId: oUserId });

            },

            onNovoUsuario: function (oEvent) {

                // Criar o Model Usuario
                this.criarModel();

                var oView = this.getView();

                var t = this;

                //Verifica se o objeto fragment existe. Se não, cria e adiciona na View
                if (!this._Usuario) {
                    this._Usuario = Fragment.load({
                        id: oView.getId(),
                        name: "br.com.gestao.fioriappusers358.frags.Insert",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }

                this._Usuario.then(function (oDialog) {
                    //Abertura do Fragment
                    oDialog.open();

                    // Chamada da função para pegar usuários
                    t.onGetUsuarios();
                })

            },

            onValida: function () {

                // Criação do objeto Validator
                var validator = new Validator();

                // Checo a validação
                if (validator.validate(this.byId("_IDGenDialog1"))) {
                    this.onInsert();
                }
            },

            onInsert: function () {

                // 1 - Criando uma referencia do objeto model que está recebendo as informações do fragment
                var oModel = this.getView().getModel("MDL_Usuario");
                var objNovo = oModel.getData();

                // 2 - Criando uma referencia do arquivo i18n
                var bundle = this.getView().getModel("i18n").getResourceBundle();

                //Variável de contexto da view
                var t = this;

                // 3 - Criar o objeto model referencia do model default (OData)
                var oModelUsuario = this.getView().getModel();

                MessageBox.confirm(
                    bundle.getText("insertDialogMsg"), // Pergunta para o processo
                    function (oAction) { // Função de disparo do insert

                        // Verificando se o usuário confirmou ou não a operação
                        if (MessageBox.Action.OK === oAction) {

                            // Criamos um BusyDialog
                            t._oBusyDialog = new BusyDialog({
                                text: bundle.getText("sending")
                            });

                            t._oBusyDialog.open();

                            setTimeout(function () {

                                //Realizar a chamada para o SAP
                                var oModelSend = new ODataModel(oModelUsuario.sServiceUrl, true);

                                oModelSend.create("UsersSet", objNovo, null,
                                    function (d, r) { // Função de retorno sucesso 
                                        if (r.statusCode === 201) { //Sucesso na criação

                                            MessageToast.show(bundle.getText("insertDialogSuccess", [objNovo.Userid]), {
                                                duration: 3000
                                            });

                                            // Iremos fechar o objeto dialog do fragment
                                            t.dialogClose();

                                            // Dar um refresh no model default
                                            t.getView().getModel().refresh();

                                            // Fechar o busy dialog
                                            t._oBusyDialog.close();
                                        }
                                    }, function (e) { // Função de retorno erro

                                        // Fechar o busy dialog
                                        t._oBusyDialog.close();

                                        var oRet = JSON.parse(e.response.body);
                                        MessageToast.show(oRet.error.message.value, {
                                            duration: 4000
                                        });
                                    });

                            }, 2000);

                        }
                    },

                    bundle.getText("insertDialogTitle") //Exibe o titulo do Diaglog

                );

            },

            // Fechamento do Dialog do fragment de insert
            dialogClose: function () {

                this._Usuario.then(function (oDialog) {
                    oDialog.close();
                })

            },

            // Capturar a coleção de usuário de um novo serviço OData
            onGetUsuarios: function () {
                var t = this;
                var strEntity = "/sap/opu/odata/sap/ZSB_USERS_358";

                // Realizar a chamada para o SAP
                var oModelSend = new ODataModel(strEntity, true);

                oModelSend.read("/Usuarios", {
                    success: function (oData, results) {

                        if (results.statusCode === 200) { //Sucesso do get
                            var oModelUsers = new JSONModel();
                            oModelUsers.setData(oData.results)
                            t.getView().setModel(oModelUsers, "MDL_Users");
                        }

                    },
                    error: function (e) {
                        var oRet = JSON.parse(e.response.body);
                        MessageToast.show(oRet.error.message.value, {
                            duration: 4000
                        });
                    }
                });
            },

        });
    });
