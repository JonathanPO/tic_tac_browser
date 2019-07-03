//GAME CODE

//VARIABLES
var board_ = [["_", "_", "_"], ["_", "_", "_"], ["_", "_", "_"]];
var winner_;
var draw_;
var player_turn;

//FUNCTIONS
/*Game(){
	initGame();
}*/

function initGame(){
	player_turn = true;
}

function play(i, j){
	if((board_[i][j] != "_") || i>=3 || j>=3){
		return false;
	} else{
		if(player_turn){
			board_[i][j] = "x";
		} else{
			board_[i][j] = "o";
		}
	}

	return true;

}

function showBoard(){
	var jsonB = JSON.stringify(board_);

	return jsonB;
}

function getPlayerTurn(){
	return player_turn;
}

function changeTurn(){
	if(player_turn){
		player_turn = false;
	} else{
		player_turn = true;
	}
}


function testWin(){
	var anyWin = false;
	var tempWinner = false;
	var tempDraw = true;
	var toTestWin = "o";

	if(player_turn){
		toTestWin = "x";
		tempWinner = true;
	}

	//HORIZONTAL
	if(board_[0][0] == toTestWin && board_[0][1] == toTestWin && board_[0][2] == toTestWin){
		anyWin = true;
		winner_ = tempWinner;
	}

	if(board_[1][0] == toTestWin && board_[1][1] == toTestWin && board_[1][2] == toTestWin){
		anyWin = true;
		winner_ = tempWinner;
	}

	if(board_[2][0] == toTestWin && board_[2][1] == toTestWin && board_[2][2] == toTestWin){
		anyWin = true;
		winner_ = tempWinner;
	}


	//VERTICAL
	if(board_[0][0] == toTestWin && board_[1][0] == toTestWin && board_[2][0] == toTestWin){
		anyWin = true;
		winner_ = tempWinner;
	}

	if(board_[0][1] == toTestWin && board_[1][1] == toTestWin && board_[2][1] == toTestWin){
		anyWin = true;
		winner_ = tempWinner;
	}

	if(board_[0][2] == toTestWin && board_[1][2] == toTestWin && board_[2][2] == toTestWin){
		anyWin = true;
		winner_ = tempWinner;
	}

	//DIAGONAL
	if(board_[0][0] == toTestWin && board_[1][1] == toTestWin && board_[2][2] == toTestWin){
		anyWin = true;
		winner_ = tempWinner;
	}

	if(board_[0][2] == toTestWin && board_[1][1] == toTestWin && board_[2][0] == toTestWin){
		anyWin = true;
		winner_ = tempWinner;
	}

	for(var i=0; i < 3; i++){
		for(var j=0; j < 3; j++){
			if(board_[i][j] == "_"){
				tempDraw = false;
			}
		}	
	}

	if(!anyWin){
		draw_ = tempDraw;

		if(draw_){
			anyWin = true;
		}
	}

	return anyWin;
}

function getWinner(){
	return winner_;
}

function getDraw(){
	return draw_;
}

//SERVER CODE

var http = require('http');

var server = http.createServer(function(req, res){
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Game start");
});

server.listen(8080, function (){
    console.log("Servidor ouvindo na porta 8080");
});

var WebsocketServer = require('websocket').server;
var wbServer = new WebsocketServer({ httpServer: server});
var countp = 0;
var clients = [];
var disabI = [];
var disabJ = [];

wbServer.on('request', function (req){
	if(countp < 2){
		var websocket = req.accept();
		clients.push(websocket);
		
		websocket.on('message', function (message) {

			if(message.utf8Data == "init"){
				initGame();
				clients.forEach(function(client) {
					client.send("board|" + showBoard());
				});
				countp+=1;

				if(countp == 2){
					clients[1].send("SYM|O");
					clients[1].send("dALL");
					clients.forEach(function(client) {
						client.send("board|" + showBoard());
					});
				} else if(countp == 1){
					clients[0].send("SYM|X");
				}
			}

			if(message.utf8Data.startsWith("play") && countp>1){
				var i = parseInt(message.utf8Data.charAt(5));
				var j = parseInt(message.utf8Data.charAt(7));

				play(i, j);
				disab(i, j);
				whoWin();
				changeTurn();

			}
			
			clients.forEach(function(client) {
				client.send("board|" + showBoard());
			});

			function disab(i, j){
				disabI.push(i);
				disabJ.push(j);

				if(player_turn){
					clients[0].send("dALL");
					clients[1].send("eALL");

					for(var k=0;k<disabI.length;k++){
						clients[1].send("disab|" + disabI[k] + "|" + disabJ[k]);
					}
				} else{
					clients[1].send("dALL");
					clients[0].send("eALL");

					for(var k=0;k<disabI.length;k++){
						clients[0].send("disab|" + disabI[k] + "|" + disabJ[k]);
					}
				}
			}
			
			function whoWin(){
				if(testWin()){
					if(getDraw()){
						clients.forEach(function(client) {
							client.send("draw");
						});
					} else{
						var who = "O";

						if(getWinner()){
							who = "X";
						}

						clients.forEach(function(client) {
							client.send("win|"+who);
						});
					}

					clients.forEach(function(client) {
						client.send("board|" + showBoard());
					});
					
					restartGame();
				}
			}

			function restartGame(){
				countp = 0;
				clients = [];
				disabI = [];
				disabJ = [];
				board_ = [["_", "_", "_"], ["_", "_", "_"], ["_", "_", "_"]];
			}
		});
	}
});
