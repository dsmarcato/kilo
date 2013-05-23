// JavaScript Document
var jQT = $.jQTouch({
	icon: 'kilo.png'
});

function teste(msg){
	alert(msg);	
}

var db;

$(document).ready(function(){
	$("#novaEntrada form").submit(salvarDados);	
	$("#config form").submit(salvarConfig);	

	$("#datas li form").submit(outrasDatas);	
	
	$("#config").bind("pageAnimationStart",carregarConfig);	// para evitar que ao modificar as variaveis e nao salvar. o formulario mantenha os dados originais

	$("#datas li a").bind("click touchend", function(){
		var id = this.id; // pega o id setado no index para os "#datas li a"
		var data = new Date();
		var pre_dia = data.setDate((data.getDate()-id));
		//teste(pre_dia);
		
		var dia = (data.getDate() < 10)?"0"+data.getDate():data.getDate();
		var mes = ((data.getMonth()+1) < 10)?"0"+(data.getMonth()+1):(data.getMonth()+1);
		var ano = data.getFullYear();
		
		
		//teste(data.getDate()-3);
		
		var dt = dia+"/"+mes+"/"+ano;
		
		sessionStorage.dt_select = dt;
		atualizaDados();
	});
	

//configurando o banco de dados cliente - recurso do HML5 que cria um banco de dados no cliente.
	//db.openDatabase("nome_db","versao","nome exibido", tamanho em kb);
	db = openDatabase("kilo_db","1.0","Kilo", 65536);
	
	db.transaction(
		function(transaction){
			var sqlCreate = "CREATE TABLE IF NOT EXISTS tb_dados (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, data DATE NOT NULL, alimento TEXT NOT NULL, calorias  INTEGER NOT NULL);";
			transaction.executeSql(sqlCreate);
		}
	);
});

function atualizaDados(){
	var dt_select = sessionStorage.dt_select;
	//coloca a data selcionada no titulo
	$("#data h1").text(dt_select);	
	
	//remove todos os elementos antes do elemento em questao. pag 125. =)
	$("#data ul li:gt(0)").remove();	
	
	db.transaction(
		function(transaction){
			transaction.executeSql(
				"SELECT * FROM tb_dados WHERE data = ? ORDER BY alimento;",
				[dt_select],
				function(transaction, result){
					for(var i=0; i < result.rows.length; i++){
						var arr = result.rows.item(i);
						
						var novaLinha = $("#template").clone();
						novaLinha.removeAttr("id");
						novaLinha.removeAttr("style");
						
						novaLinha.data("entryId", arr.id);
						novaLinha.appendTo("#data ul");
						novaLinha.find(".label").text(arr.alimento);
						novaLinha.find(".calorias").text(arr.calorias);
						
						//Configurando o delete, 1º) procuro todas as classes que tenham "delete", em seguida pego o ID e chamo a função dentro do click
						novaLinha.find(".delete").click(function(){
							var clicked = $(this).parent();
							var clickedId = clicked.data("entryId");
							
							
							if(confirm("Realmente deseja deletar o alimento "+arr.alimento)){
								deletaDados(clickedId);
								clicked.slideUp();
							}
						});
					}
				}, 
				errorHandler
			);
		}
	);	
}

function deletaDados(id){
	db.transaction(
		function(transaction){
			transaction.executeSql(
				"DELETE FROM tb_dados WHERE id = ?;",				   
				[id],
				null,
				errorHandler
			);
		}
	);	
}
	
function salvarConfig(){
	localStorage.idade = $("#idade").val();
	localStorage.peso = $("#peso").val();
	localStorage.orc = $("#orc").val();
	jQT.goBack();  // após enviar o formulario retorna a pagina anterior	
	return false;
}

function validarData(dt) {
	var date=dt;
	var ardt=new Array;
	var ExpReg=new RegExp("(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/[12][0-9]{3}");
	ardt=date.split("/");
	erro=false;
	if ( date.search(ExpReg)==-1){
		erro = true;
		}
	else if (((ardt[1]==4)||(ardt[1]==6)||(ardt[1]==9)||(ardt[1]==11))&&(ardt[0]>30))
		erro = true;
	else if ( ardt[1]==2) {
		if ((ardt[0]>28)&&((ardt[2]%4)!=0))
			erro = true;
		if ((ardt[0]>29)&&((ardt[2]%4)==0))
			erro = true;
	}
	if (erro) {
		return false;
	}else{
		return true;
	}
}

function outrasDatas(){
	var dt = $("#odt").val();
	if(validarData(dt)){
		sessionStorage.dt_select = $("#odt").val();
		atualizaDados();
		jQT.goTo("#data","slideup");
	}else{
		alert("Data inválida!");
		return false;
	}
}

function salvarDados(){

	if($("#calorias").val() < 1){
		alert("Calorias devem ser maiores que 0(zero)");
	}else{
		var calorias = $("#calorias").val();
		var data = sessionStorage.dt_select;
		if($("#alimento").val() == ""){
			alert("Nome do alimento nao foi preenchido!");
		}else{
			var alimento = $("#alimento").val();	
		
			db.transaction(
				function(transaction){
					transaction.executeSql(
						"INSERT INTO tb_dados (data, alimento, calorias) VALUES (?,?,?);",
						[data, alimento, calorias],
						function(){
							atualizaDados();
							$("#alimento").val("");
							$("#calorias").val("");
							jQT.goBack();
						}, 
						errorHandler
					);
				}
			);
		}
	}
	return false;
}

function errorHandler(transaction, error){
	var txt = "";
	switch(error.code){
		case 0:
		  txt = "Nem imagino! I don'r known - UNKNOWN_ERR"
		  break;
		case 1:
		  txt = "Bug no Banco de dados! - DATABASE_ERR"
		  break;
		case 2:
		  txt = "Quem mudou Versão?!? - VERSION_ERR"
		  break;
		case 3:
		  txt = "Quanta coisa, não?!? - TOO_LARGE_ERR"
		  break;
		case 4:
		  txt = "Tô de Banco cheio!!! - QUOTA_ERR"
		  break;
		case 5:
		  txt = "Aii que burro! Dá zero pra ele!!! - SYNTAX_ERR"
		  break;
		case 6:
		  txt = "Sem moral para alterar o Banco!!! - CONSTRAINT_ERR"
		  break;
		case 7:
		  txt = "Que lerdeza! - TIMEOUT_ERR!"
		  break;
	}	
	
	
	alert("Deu ruim! "+error.message+" (Cod: "+error.code+":"+txt+")");
	return true;
}


function carregarConfig(){
	if(!localStorage.idade){
		localStorage.idade = "";
	}
	
	if(!localStorage.peso){
		localStorage.peso = "";
	}
	
	if(!localStorage.orc){
		localStorage.orc = "";
	}
	
	$("#idade").val(localStorage.idade);
	$("#peso").val(localStorage.peso);
	$("#orc").val(localStorage.orc);
}