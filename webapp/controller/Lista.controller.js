sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "br/com/gestao/fioriappadmin358/util/Formatter",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "sap/ui/model/json/JSONModel",
    "br/com/gestao/fioriappadmin358/util/Validator",
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

        return Controller.extend("br.com.gestao.fioriappadmin358.controller.Lista", {

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

                // Model Produto
                var oModel = new JSONModel();
                this.getView().setModel(oModel, "MDL_Produto")

            },

            onSearch: function () {

                //Capturando individulamente cada objeto Input do objeto Filter Bar
                var oProdutoInput = this.getView().byId("productIDInput");
                var oProdutoNomeInput = this.getView().byId("productNameInput");
                var oCategoriaInput = this.getView().byId("productCategoryInput");

                var objFilter = { filters: [], and: true };
                objFilter.filters.push(new Filter("Productid", FilterOperator.Contains, oProdutoInput.getValue()));
                objFilter.filters.push(new Filter("Name", FilterOperator.Contains, oProdutoNomeInput.getValue()));
                objFilter.filters.push(new Filter("Category", FilterOperator.Contains, oCategoriaInput.getValue()));

                //Cria o objeto Filter baseado no valor do objeto
                var oFilter = new Filter(objFilter);

                /*                 var oFilter = new Filter({
                                    filters: [
                                        new Filter({
                                            path: "Productid",
                                            operator: FilterOperator.Contains,
                                            value1: oProdutoInput.getValue(),
                                        }),
                                        new Filter({
                                            path: "Name",
                                            operator: FilterOperator.Contains,
                                            value1: oProdutoNomeInput.getValue(),
                                        }),
                                    ],
                                    and: true
                                }) */

                //Busca objeto Table
                var oTable = this.getView().byId("tableProdutos");

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

                //var oProductId = oEvent.getSource().getBindingContext().getObject().Productid;

                // Nós acessamos um contexto de um model com nome 
                //var oProductId = oEvent.getSource().getBindingContext("Nome do Model").getProperty("Productid");

                // Passo 1 - Captura do valor do produto (id)
                var oProductId = oEvent.getSource().getBindingContext().getProperty("Productid");

                // Passo 2 - Envio para o Route de Detalhes com parametro
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("Detalhes", { productId: oProductId });

            },

            onCategoria: function (oEvent) {

                this._oInput = oEvent.getSource().getId();
                var oView = this.getView();

                //Verifico se o objeto fragment existe. Se não, crio e adiciona na View
                if (!this._CategoriaSerchHelp) {
                    this._CategoriaSerchHelp = Fragment.load({
                        id: oView.getId(),
                        name: "br.com.gestao.fioriappadmin358.frags.SH_Categorias",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }

                this._CategoriaSerchHelp.then(function (oDialog) {

                    //Limpando o filtro de categorias na abertura do fragment
                    oDialog.getBinding("items").filter([]);

                    //Abertura do Fragment
                    oDialog.open();
                })

            },

            onValueHelpSearch: function (oEvent) {

                //Capturando o valor digitado pelo usuário
                var sValue = oEvent.getParameter("value");

                //Opção 1 - Cria um único objeto filtro
                //Criando um objeto do tipo Filter que irá receber o valor e associar na propriedade Description
                //var oFilter = new Filter("Description", FilterOperator.Contains, sValue)
                //oEvent.getSource().getBinding("items").filter([oFilter]);

                //Opção 2- Podemos criar um objeto (dinamico) onde adiciono várias propriedades
                var objFilter = { filters: [], and: false };
                objFilter.filters.push(new Filter("Description", FilterOperator.Contains, sValue));
                objFilter.filters.push(new Filter("Category", FilterOperator.Contains, sValue));

                var oFilter = new Filter(objFilter);
                oEvent.getSource().getBinding("items").filter(oFilter);

            },

            onValueHelpClose: function (oEvent) {

                var oSelectedItem = oEvent.getParameter("selectedItem");
                var oInput = null;

                //Verifica se existe um objeto para o id correspondente para o this._oInput, caso sim, ele cria a referencia
                if (this.byId(this._oInput)) {
                    oInput = this.byId(this._oInput);
                } else {
                    oInput = sap.ui.getCore().byId(this._oInput);
                }

                if (!oSelectedItem) {
                    oInput.resetProperty("value");
                    return;
                }

                oInput.setValue(oSelectedItem.getTitle());
            },

            onNovoProduto: function (oEvent) {

                // Criar o Model Produto
                this.criarModel();

                var oView = this.getView();

                var t = this;

                //Verifica se o objeto fragment existe. Se não, cria e adiciona na View
                if (!this._Produto) {
                    this._Produto = Fragment.load({
                        id: oView.getId(),
                        name: "br.com.gestao.fioriappadmin358.frags.Insert",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }

                this._Produto.then(function (oDialog) {
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
                var oModel = this.getView().getModel("MDL_Produto");
                var objNovo = oModel.getData();

                // 2 - Manipular propriedades
                objNovo.Productid = this.geraID();
                objNovo.Price = objNovo.Price[0].toString();
                objNovo.Weightmeasure = objNovo.Weightmeasure.toString();
                objNovo.Width = objNovo.Width.toString();
                objNovo.Depth = objNovo.Depth.toString();
                objNovo.Height = objNovo.Height.toString();
                objNovo.Createdat = this.objFormatter.dateSAP(objNovo.Createdat);
                objNovo.Currencycode = "BRL";
                objNovo.Userupdate = "";

                // 3 - Criando uma referencia do arquivo i18n
                var bundle = this.getView().getModel("i18n").getResourceBundle();

                //Variável de contexto da view
                var t = this;

                // 4 - Criar o objeto model referencia do model default (OData)
                var oModelProduto = this.getView().getModel();

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
                                var oModelSend = new ODataModel(oModelProduto.sServiceUrl, true);

                                oModelSend.create("Produtos", objNovo, null,
                                    function (d, r) { // Função de retorno sucesso 
                                        if (r.statusCode === 201) { //Sucesso na criação

                                            MessageToast.show(bundle.getText("insertDialogSucess", [objNovo.Productid]), {
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

            // Geramos um ID de Produto Dinamino
            geraID: function () {
                return 'xxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16).toUpperCase();
                });

            },

            // Fechamento do Dialog do fragment de insert
            dialogClose: function () {

                this._Produto.then(function (oDialog) {
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

            // Localizar um fornecedor baseado no input do usuário
            getSupplier: function (evt) {

                this._oInput = evt.getSource().getId();
                var oValue = evt.getSource().getValue();

                var sElement = "/Fornecedores('" + oValue + "')";

                // Cria o objeto model default
                var oModel = this.getView().getModel();

                // Model onde o usuário realiza o preenchimento das informações de produto
                var oModelProduto = this.getView().getModel("MDL_Produto");

                // Realizar a chamada para o SAP
                var oModelSend = new ODataModel(oModel.sServiceUrl, true);

                oModelSend.read(sElement, {
                    success: function (oData, results) {

                        if (results.statusCode === 200) { //Sucesso do get
                            oModelProduto.setProperty("/Supplierid", oData.Lifnr);
                            oModelProduto.setProperty("/Suppliername", oData.Name1);
                        }

                    },
                    error: function (e) {

                        oModelProduto.setProperty("/Supplierid", "");
                        oModelProduto.setProperty("/Suppliername", "");

                        var oRet = JSON.parse(e.response.body);
                        MessageToast.show(oRet.error.message.value, {
                            duration: 4000
                        });
                    }
                });

            },

            // Aplicar um filtro na entidade fornecedores 
            onSuggest: function (event) {
                var sText = event.getParameter("suggestValue");
                var aFilters = { filters: [], and: true };
                if (sText) {
                    aFilters.filters.push(new Filter("Lifnr", FilterOperator.Contains, sText));
                    aFilters.filters.push(new Filter("Name1", FilterOperator.Contains, sText));
                }
                event.getSource().getBinding("suggestionItems").filter(aFilters)
            },

            getReadOpcoes: function () {

                // Item 1 - Chamada via URL
                var sElement = "/Produtos";
                //var sElement = "/Produtos('322E3BBF5A')";
                //var sElement = "/Produtos('322E3BBF5A')/to_cat";

                var afilters = [];

                afilters.push(new Filter("Status", FilterOperator.EQ, 'E'));

                afilters.push(new Filter("Category", FilterOperator.EQ, 'CPDA'));

                // Cria o objeto model default 
                var oModel = this.getView().getModel();

                // Realizar a chamada para o SAP
                var oModelSend = new ODataModel(oModel.sServiceUrl, true);
                oModelSend.read(sElement, {
                    filters: afilters,

                    urlParameters: {

                        $expand: "to_cat"

                    },
                    success: function (oData, results) {
                        if (results.statusCode === 200) { // Sucesso do Get

                        }
                    },
                    error: function (e) {
                        var oRet = JSON.parse(e.response.body);

                        MessageToast.show(oRet.error.message.value, {

                            duration: 4000

                        });
                    }
                })

            }

        });
    });
