sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "br/com/gestao/fioriappusers358/util/Formatter",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/ODataModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "br/com/gestao/fioriappusers358/util/Validator",
    "sap/ui/core/ValueState",
    "sap/m/MessageBox",
    "sap/m/BusyDialog"
  ],
  function (Controller, Formatter, Fragment, JSONModel, ODataModel, MessageToast, Filter, FilterOperator, Validator, ValueState, MessageBox, BusyDialog) {
    "use strict";

    return Controller.extend("br.com.gestao.fioriappusers358.controller.Detalhes", {

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
        oRouter.getRoute("Detalhes").attachMatched(this.onBindingUsuarioDetalhes, this);

        //1 - Chamar a função onde irá fazer o carregamento dos fragments iniciais
        this._formFragments = {};

        this._showFormFragments("DisplayBasicInfo", "vboxViewBasicInfo");

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
            name: "br.com.gestao.fioriappusers358.frags." + sFragmentName,
            controller: this
          });

          this._formFragments[sFragmentName] = oFormFragment;
        }

        return oFormFragment;

      },

      onBindingUsuarioDetalhes: function (oEvent) {

        // Capturando o parametro trafegado no Route Detalhes (userId)
        var oUsuario = oEvent.getParameter("arguments").userId;

        // Objeto referente a view Detalhes
        var oView = this.getView();

        // Criar um parâmetro de controle para redirecionamento da view após o delete
        this._bDelete = false;

        // Criar a URL de chamada da nossa entidade de Produtos
        var sUrl = "/UsersSet('" + oUsuario + "')";

        oView.bindElement({
          path: sUrl,
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
          this._oUsuario = Object.assign({}, oElementBinding.getBoundContext().getObject());
        }

      },

      criarModel: function () {

        // Model Usuario
        var oModel = new JSONModel();
        this.getView().setModel(oModel, "MDL_Usuario")

      },

      onNavBack: function () {
        //Desabilitar a edição. Ficar somente leitura
        this._HabilitaEdicao(false);

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("Lista");
      },

      handleEditPress: function () {

        //Criamos nosso model de usuario
        this.criarModel();

        //Atribui no objeto model o registro clonado
        var oModelUsuario = this.getView().getModel("MDL_Usuario");
        oModelUsuario.setData(this._oUsuario);

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
        oView.byId("_IDGenObjectPageSection3").setVisible(bEdit);

        if (bEdit) {
          this._showFormFragments("Change", "vboxChangeUser");
        } else {
          this._showFormFragments("DisplayBasicInfo", "vboxViewBasicInfo");
        }

      },

      handleCancelPress: function () {
        //Restore do registro atual do model
        var oModel = this.getView().getModel();
        oModel.refresh(true);

        //Voltamos para somente leitura
        this._HabilitaEdicao(false);
      },

      onValida: function () {

        // Criação do objeto Validator
        var validator = new Validator();

        // Checo a validação
        if (validator.validate(this.byId("vboxChangeUser"))) {
          this.onUpdate();
        }
      },

      onUpdate: function () {

        // 1 - Criando uma referencia do objeto model que está recebendo as informações do fragment
        var oModel = this.getView().getModel("MDL_Usuario");
        var objUpdate = oModel.getData();
        var sPath = this.getView().getElementBinding().getPath();

        delete objUpdate.__metadata;

        // 2 - Criando uma referencia do arquivo i18n
        var bundle = this.getView().getModel("i18n").getResourceBundle();

        //Variável de contexto da view
        var t = this;

        // 3 - Criar o objeto model referencia do model default (OData)
        var oModelUsuario = this.getView().getModel();

        MessageBox.confirm(
          bundle.getText("updateDialogMsg", [objUpdate.Userid]), // Pergunta para o processo
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
                var oModelSend = new ODataModel(oModelUsuario.sServiceUrl, true);

                oModelSend.update(sPath, objUpdate, null,
                  function (d, r) { // Função de retorno sucesso 
                    if (r.statusCode === 204) { //Sucesso na atualização

                      // Fechar o busy dialog
                      t._oBusyDialog.close();

                      MessageBox.success(bundle.getText("updateDialogSuccess", [objUpdate.Userid]));

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
        var oModelUsuario = this.getView().getModel();
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        MessageBox.confirm(
          bundle.getText("deleteDialogMsg", [objDelete.Userid]), // Pergunta para o processo
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
                var oModelSend = new ODataModel(oModelUsuario.sServiceUrl, true);

                oModelSend.remove(sPath, {
                  success: function (d, r) { // Função de retorno sucesso 
                    if (r.statusCode === 204) { //Sucesso no delete

                      // Fechar o busy dialog
                      t._oBusyDialog.close();

                      // Setar parâmetro de delete
                      t._bDelete = true;

                      MessageBox["information"](bundle.getText("deleteDialogSuccess", [objDelete.Userid]), {
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
