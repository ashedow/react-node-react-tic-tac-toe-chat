class App extends React.Component {
	constructor(props) {
		super(props);
		this.my_symbol='';
		this.currentRoom='';
		this.socket=io.connect();	 
		this.state = {
			board : [ '', '', '', '', '', '', '', '', '' ] ,
			currentPlayer: true,//1==x,0==o
			messages: [] ,
			winner: "first_screen"
		};
	}
	componentWillMount() {
		this.socket.on("your_player_symbol_and_current_room", data => {
			document.querySelector(".first_screen").style.opacity='1';
			this.my_symbol=data.my_symbol;
			if(this.my_symbol==='X')
			{
				this.setState({currentPlayer: true , currentRoom: data.room , winner: "first_screen"});
				this.socket.on('second_player',()=>{
					this.setState({winner:"on_game", board: [ '', '', '', '', '', '', '', '', '' ] , currentPlayer: true , messages: [] });
					this.socket.on('player_leaves', ()=> {
						alert("This play for two playes. Press 'Ok' for getting new game link.");
						this.setState({winner:"first_screen" });
						this.socket.off('player_leaves');
						this.socket.off("update_board");
						this.socket.off("receive-message");
					});	
					this.socket.on('end_game', ()=>{
						this.new_game();
					});				
					this.socket.off('second_player');
				});
				var self=this;
				this.socket.on("receive-message", function(msg) {
					var newArray = self.state.messages.slice();  
					newArray.push(msg);   
					self.setState({messages:newArray});
					document.querySelector(".flex-1-2-2-2").style.opacity='1';
				});
			}
			else
			{
				this.setState({currentPlayer: false , currentRoom: data.room , winner: "on_game"});
				this.socket.on('player_leaves', ()=> {
					alert("This play for two playes. Press 'Ok' for getting new game link.");
					this.setState({winner:"first_screen" });
					this.socket.off("update_board");
					this.socket.off("receive-message");
					this.socket.off('player_leaves');
				});
				var self=this;
				this.socket.on("receive-message", function(msg) {
					var newArray = self.state.messages.slice();
					newArray.push(msg);
					self.setState({messages:newArray});
					document.querySelector(".flex-1-2-2-2").style.opacity='1';
				});
			}
			this.socket.on("update_board", data => {
				this.setState({board: data.newBoard , currentPlayer: true , winner: data.winner});
			});
			this.socket.off("your_player_symbol_and_current_room");
		});
	}
	cellClick(index) {
		if(this.state.winner==="on_game" && this.state.currentPlayer && this.state.board[index] === "")
		{
			var temp_board=this.state.board;
			temp_board[index]=this.my_symbol;
			var temp_opponent_winner="on_game";
			//Check if last goal win
			var win_comb = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
			var temp_winner=win_comb.find((cur)=>{
				if( temp_board[cur[0]] === this.my_symbol && 
					temp_board[cur[1]] === this.my_symbol && 
					temp_board[cur[2]] === this.my_symbol )
					return true;
				else
					return false;
			});
			temp_winner=(temp_winner)?"win":"on_game";
			if(temp_winner==="win" )
				temp_opponent_winner="lose";
			else if(!temp_board.includes(''))
			{
				temp_winner="no_ones_win";
				temp_opponent_winner="no_ones_win";
			}	
			this.socket.emit('update_board0', {newBoard: temp_board, winner: temp_opponent_winner} );
			this.setState({winner: temp_winner, board: temp_board, currentPlayer: false});	
		}
	}
	submitMessage() {
		var message = document.getElementById('message').value;
		if(message!=='')
		{
			this.socket.emit("new-message", {message: message , from: this.socket.io.engine.id });
			document.getElementById('message').value='';
		}
	}  	
	render() {
		var messages = this.state.messages.slice(0).reverse().map( (msg,index) => 
		{
			if( msg.from === this.socket.io.engine.id )
				return <div className="left" key={index}>Me: {msg.message}</div> ;
			else 
				return <div className="right" key={index}>Opposite: {msg.message} </div> ;
		} );
		var strpath=" http://localhost:3000/"+this.socket.io.engine.id;
		var label;
		var content;
		switch(this.state.winner){
			case "first_screen":
				content=
						<div className="first_screen">
							<h1>Tic-Tac-Toe</h1>
							<div><br /></div>
							<div>Send link to opposite player</div>
							<div>{strpath}</div>
						</div>

				break;
			default:
			{
					 if(this.state.winner==="on_game")
							label=(this.state.currentPlayer)?"You turn!":"Wait for oppposite turn!";
					 else
					 {
						label=(this.state.winner==="win")?"You win!!":( (this.state.winner==="lose")?"You lose!":((this.state.winner==="no_ones_win")?"Ничья!":"") );					
					 }
					content=
							<div className="content-container">
								<div className="game-container">
										<div className="flex-1-1">
											<div className="flex-1-1-1">{label}</div>
											<div className="flex-1-1-2">
													{this.state.board.map( (current,index) =>
														{ 
															return (<div onClick={ () => this.cellClick(index)} className="square">{current}</div>)
														})
													}			    				
											</div>
										</div>   			
								</div>
								<div className="flex-1-2">
									<div className="chat-container">
										<div className="flex-1-2-2-1">	
													<input id="message" type="text" placeholder="Enter message"></input>
													<button onClick={()=>this.submitMessage()} >Enter</button>					    					
										</div>        			
										<div className="flex-1-2-2-2">
											{messages}
										</div>				
									</div> 
								</div>
							</div>
			}
		}
		return ( <div className="app-container"> {content} </div> )
	}
}

ReactDOM.render( 
	<App /> ,
	document.getElementById('root')
);