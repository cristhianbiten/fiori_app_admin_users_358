sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "br/com/gestao/fioriappadmin358/util/Formatter",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/ODataModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "br/com/gestao/fioriappadmin358/util/Validator",
    "sap/ui/core/ValueState",
    "sap/m/MessageBox",
    "sap/m/BusyDialog"
  ],
  function (Controller, Formatter, Fragment, JSONModel, ODataModel, MessageToast, Filter, FilterOperator, Validator, ValueState, MessageBox, BusyDialog) {
    "use strict";

    return Controller.extend("br.com.gestao.fioriappadmin358.controller.Detalhes", {

      objFormatter: Formatter,

      //Criar o meu objeto Route e acoplando a função que fará o bindingElement
      onInit: function () {

        sap.ui.getCore().attachValidationError(function (oEvent) {
          oEvent.getParameter("element").setValueState(ValueState.Error);
        });

        sap.ui.getCore().attachValidationSuccess(function (oEvent) {
          oEvent.getParameter("element").setValueState(ValueState.Success);
        });

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("Detalhes").attachMatched(this.onBindingProdutoDetalhes, this);

        //1 - Chamar a função onde irá fazer o carregamento dos fragments iniciais
        this._formFragments = {};

        this._showFormFragments("DisplayBasicInfo", "vboxViewBasicInfo");
        this._showFormFragments("DisplayTechInfo", "vboxViewTechInfo");

      },

      //2 - Recebe como parametro o nome do Fragment e o nome do VBox de destino
      _showFormFragments: function (sFragmentName, sVBoxName) {
        var objVBox = this.byId(sVBoxName);
        objVBox.removeAllItems();

        this._getFormAllItems(sFragmentName).then(function (oVBox) {
          objVBox.insertItem(oVBox);
        });
      },

      //3- Cria o objeto fragment baseado no nome e adiciona em um objeto com uma coleção de fragments
      _getFormAllItems: function (sFragmentName) {
        var oFormFragment = this._formFragments[sFragmentName];
        var oView = this.getView();

        if (!oFormFragment) {
          oFormFragment = Fragment.load({
            id: oView.getId(),
            name: "br.com.gestao.fioriappadmin358.frags." + sFragmentName,
            controller: this
          });

          this._formFragments[sFragmentName] = oFormFragment;
        }

        return oFormFragment;

      },

      onBindingProdutoDetalhes: function (oEvent) {

        // Capturando o parametro trafegado no Route Detalhes (productId)
        var oProduto = oEvent.getParameter("arguments").productId;

        // Objeto referente a view Detalhes
        var oView = this.getView();

        // Criar um parâmetro de controle para redirecionamento da view após o delete
        this._bDelete = false;

        // Criar a URL de chamada da nossa entidade de Produtos
        var sUrl = "/Produtos('" + oProduto + "')";

        oView.bindElement({
          path: sUrl,
          parameters: { expand: 'to_Cat' },
          events: {
            change: this.onBindingChange.bind(this),
            dataRequested: function () {
              oView.setBusy(true);
            },
            dataReceived: function () {
              oView.setBusy(false);
            },
          }
        })

      },

      onBindingChange: function (oEvent) {

        var oView = this.getView();
        var oElementBinding = oView.getElementBinding();

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        //Se não existir um elemento (registro) válido eu farei uma ação que é redirecionar para uma nova View
        if (!oElementBinding.getBoundContext()) {
          // Se não existir o registro e não estamos na operação de delete
          if (!this._bDelete) {
            oRouter.getTargets().display("objNotFound");
            return;
          }

        } else {
          //Clonamos o registro atual
          this._oProduto = Object.assign({}, oElementBinding.getBoundContext().getObject());
        }

      },

      criarModel: function () {

        // Model Produto
        var oModel = new JSONModel();
        this.getView().setModel(oModel, "MDL_Produto")

      },

      onNavBack: function () {
        //Desabilitar a edição. Ficar somente leitura
        this._HabilitaEdicao(false);

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("Lista");
      },

      handleEditPress: function () {

        //Criamos nosso model de produto
        this.criarModel();

        //Atribui no objeto model o registro clonado
        var oModelProduto = this.getView().getModel("MDL_Produto");
        oModelProduto.setData(this._oProduto);

        //Recupera os usuários
        this.onGetUsuarios();

        //Habilitar a edição
        this._HabilitaEdicao(true);
      },

      _HabilitaEdicao: function (bEdit) {
        var oView = this.getView();

        //Botões de ações
        oView.byId("btnEdit").setVisible(!bEdit);
        oView.byId("btnDelete").setVisible(!bEdit);
        oView.byId("btnSave").setVisible(bEdit);
        oView.byId("btnCancel").setVisible(bEdit);

        //Habilitar/Desabilitar as seções
        oView.byId("_IDGenObjectPageSection1").setVisible(!bEdit);
        oView.byId("_IDGenObjectPageSection2").setVisible(!bEdit);
        oView.byId("_IDGenObjectPageSection3").setVisible(bEdit);

        if (bEdit) {
          this._showFormFragments("Change", "vboxChangeProduct");
        } else {
          this._showFormFragments("DisplayBasicInfo", "vboxViewBasicInfo");
          this._showFormFragments("DisplayTechInfo", "vboxViewTechInfo");
        }

      },

      handleCancelPress: function () {
        //Restore do registro atual do model
        var oModel = this.getView().getModel();
        oModel.refresh(true);

        //Voltamos para somente leitura
        this._HabilitaEdicao(false);
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

      onValida: function () {

        // Criação do objeto Validator
        var validator = new Validator();

        // Checo a validação
        if (validator.validate(this.byId("vboxChangeProduct"))) {
          this.onUpdate();
        }
      },

      onUpdate: function () {

        // 1 - Criando uma referencia do objeto model que está recebendo as informações do fragment
        var oModel = this.getView().getModel("MDL_Produto");
        var objUpdate = oModel.getData();
        var sPath = this.getView().getElementBinding().getPath();

        // 2 - Manipular propriedades
        objUpdate.Price = objUpdate.Price.toString();
        objUpdate.Weightmeasure = objUpdate.Weightmeasure.toString();
        objUpdate.Width = objUpdate.Width.toString();
        objUpdate.Depth = objUpdate.Depth.toString();
        objUpdate.Height = objUpdate.Height.toString();
        objUpdate.Changedat = new Date().toISOString().substring(0, 19);

        delete objUpdate.to_Cat;
        delete objUpdate.__metadata;

        // 3 - Criando uma referencia do arquivo i18n
        var bundle = this.getView().getModel("i18n").getResourceBundle();

        //Variável de contexto da view
        var t = this;

        // 4 - Criar o objeto model referencia do model default (OData)
        var oModelProduto = this.getView().getModel();

        MessageBox.confirm(
          bundle.getText("updateDialogMsg", [objUpdate.Productid]), // Pergunta para o processo
          function (oAction) { // Função de disparo do update

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

                oModelSend.update(sPath, objUpdate, null,
                  function (d, r) { // Função de retorno sucesso 
                    if (r.statusCode === 204) { //Sucesso na atualização

                      // Fechar o busy dialog
                      t._oBusyDialog.close();

                      MessageBox.success(bundle.getText("updateDialogSucess", [objUpdate.Productid]));

                      // Voltar para somente leitura
                      t.handleCancelPress();

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

          bundle.getText("updateDialogTitle") //Exibe o titulo do Diaglog

        );

      },

      onDelete: function () {

        var objDelete = this.getView().getElementBinding().getBoundContext().getObject();
        var sPath = this.getView().getElementBinding().getPath();
        var bundle = this.getView().getModel("i18n").getResourceBundle();
        var t = this;
        var oModelProduto = this.getView().getModel();
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        MessageBox.confirm(
          bundle.getText("deleteDialogMsg", [objDelete.Productid]), // Pergunta para o processo
          function (oAction) { // Função de disparo do delete

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

                oModelSend.remove(sPath, {
                  success: function (d, r) { // Função de retorno sucesso 
                    if (r.statusCode === 204) { //Sucesso no delete

                      // Fechar o busy dialog
                      t._oBusyDialog.close();

                      // Setar parâmetro de delete
                      t._bDelete = true;

                      MessageBox["information"](bundle.getText("deteleDialogSucess", [objDelete.Productid]), {
                        actions: [MessageBox.Action.OK],
                        onClose: function (oAction) {
                          if (oAction === MessageBox.Action.OK) {
                            t.getView().getModel().refresh();
                            oRouter.navTo("Lista");
                          }
                        }.bind(this)
                      });
                    }
                  },
                  error: function (e) { // Função de retorno erro

                    // Fechar o busy dialog
                    t._oBusyDialog.close();

                    var oRet = JSON.parse(e.response.body);
                    MessageToast.show(oRet.error.message.value, {
                      duration: 4000
                    });
                  }
                });

              }, 2000);

            }
          },

          bundle.getText("deleteDialogTitle") //Exibe o titulo do Diaglog

        );

      },

    });
  }
);
