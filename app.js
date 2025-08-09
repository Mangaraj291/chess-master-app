// Chess Game Application
class ChessGame {
    constructor() {
        this.currentUser = null;
        this.gameState = null;
        this.selectedSquare = null;
        this.gameMode = null; // 'pvp' or 'pvc'
        this.aiDifficulty = null;
        this.gameTimer = null;
        this.timeLeft = 600; // 10 minutes
        this.moveHistory = [];
        this.currentAnalysis = null;
        this.analysisPosition = 0;
        
        // Initialize game data
        this.initializeGame();
        this.bindEvents();
    }

    initializeGame() {
        // Load user data from localStorage
        this.users = JSON.parse(localStorage.getItem('chessUsers') || '{}');
        this.gameHistory = JSON.parse(localStorage.getItem('chessGameHistory') || '{}');
        
        // Initialize chess board
        this.initializeBoard();
        
        // Show login screen initially
        this.showScreen('loginScreen');
    }

    initializeBoard() {
        this.board = [
            ['r','n','b','q','k','b','n','r'],
            ['p','p','p','p','p','p','p','p'],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            ['P','P','P','P','P','P','P','P'],
            ['R','N','B','Q','K','B','N','R']
        ];
        this.currentPlayer = 'white';
        this.gameOver = false;
        this.winner = null;
    }

    bindEvents() {
        // Login events
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Dashboard events
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        document.getElementById('playVsPlayerBtn').addEventListener('click', () => this.startPvPGame());
        document.getElementById('playVsComputerBtn').addEventListener('click', () => this.showDifficultyModal());
        document.getElementById('addFriendBtn').addEventListener('click', () => this.addFriend());

        // Difficulty modal events
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectDifficulty(btn.dataset.difficulty));
        });
        document.getElementById('cancelDifficultyBtn').addEventListener('click', () => this.hideDifficultyModal());

        // Game controls
        document.getElementById('resignBtn').addEventListener('click', () => this.resign());
        document.getElementById('drawOfferBtn').addEventListener('click', () => this.offerDraw());
        document.getElementById('backToDashboardBtn').addEventListener('click', () => this.backToDashboard());
        document.getElementById('sendChatBtn').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // Game result modal events
        document.getElementById('analyzeGameBtn').addEventListener('click', () => this.startAnalysis());
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('closeResultBtn').addEventListener('click', () => this.closeResultModal());

        // Analysis events
        document.getElementById('backFromAnalysisBtn').addEventListener('click', () => this.backFromAnalysis());
        document.getElementById('prevMoveBtn').addEventListener('click', () => this.previousAnalysisMove());
        document.getElementById('nextMoveBtn').addEventListener('click', () => this.nextAnalysisMove());
        document.getElementById('resetPositionBtn').addEventListener('click', () => this.resetAnalysisPosition());

        // Online players modal
        document.getElementById('cancelOnlineBtn').addEventListener('click', () => this.hideOnlinePlayersModal());
    }

    // Authentication
    handleLogin() {
        const username = document.getElementById('usernameInput').value.trim();
        if (!username) {
            alert('Please enter a username');
            return;
        }

        // Create user if doesn't exist
        if (!this.users[username]) {
            this.users[username] = {
                rating: 1200,
                friends: [],
                gamesPlayed: 0,
                wins: 0,
                draws: 0,
                losses: 0
            };
            this.saveUserData();
        }

        this.currentUser = username;
        this.showDashboard();
    }

    handleLogout() {
        this.currentUser = null;
        this.showScreen('loginScreen');
        // Clear the username input
        document.getElementById('usernameInput').value = '';
    }

    showDashboard() {
        document.getElementById('usernameDisplay').textContent = this.currentUser;
        document.getElementById('userRating').textContent = this.users[this.currentUser].rating;
        this.loadFriendsList();
        this.loadGameHistory();
        this.showScreen('dashboard');
    }

    // Screen management
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show the requested screen
        document.getElementById(screenId).classList.remove('hidden');
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    // Game modes
    startPvPGame() {
        this.gameMode = 'pvp';
        this.showOnlinePlayersModal();
    }

    showOnlinePlayersModal() {
        // Simulate online players
        const onlinePlayersList = document.getElementById('onlinePlayersList');
        onlinePlayersList.innerHTML = '';

        const simulatedPlayers = [
            { name: 'AliceChess', rating: 1350 },
            { name: 'BobMaster', rating: 1180 },
            { name: 'CharlieKnight', rating: 1420 },
            { name: 'DianaQueen', rating: 1250 }
        ].filter(p => p.name !== this.currentUser);

        simulatedPlayers.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'online-player-item';
            playerDiv.innerHTML = `
                <div class="online-player-info">
                    <div class="online-player-name">${player.name}</div>
                    <div class="online-player-rating">Rating: ${player.rating}</div>
                </div>
                <button class="btn btn--primary btn--sm invite-btn" onclick="chessGame.invitePlayer('${player.name}', ${player.rating})">Invite</button>
            `;
            onlinePlayersList.appendChild(playerDiv);
        });

        this.showModal('onlinePlayersModal');
    }

    hideOnlinePlayersModal() {
        this.hideModal('onlinePlayersModal');
    }

    invitePlayer(playerName, playerRating) {
        this.hideOnlinePlayersModal();
        this.opponent = { name: playerName, rating: playerRating };
        this.startGame();
    }

    showDifficultyModal() {
        this.showModal('difficultyModal');
    }

    hideDifficultyModal() {
        this.hideModal('difficultyModal');
    }

    selectDifficulty(difficulty) {
        this.gameMode = 'pvc';
        this.aiDifficulty = difficulty;
        this.opponent = { name: `AI (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`, rating: null };
        this.hideDifficultyModal();
        this.startGame();
    }

    startGame() {
        this.initializeBoard();
        this.moveHistory = [];
        this.timeLeft = 600;
        this.gameOver = false;
        this.winner = null;

        // Set up players
        document.getElementById('whitePlayerName').textContent = this.currentUser;
        document.getElementById('whitePlayerRating').textContent = this.users[this.currentUser].rating;
        document.getElementById('blackPlayerName').textContent = this.opponent.name;
        document.getElementById('blackPlayerRating').textContent = this.opponent.rating || 'N/A';

        this.renderBoard();
        this.startGameTimer();
        this.showScreen('gameScreen');
        this.updateTurnIndicator();
        
        // Clear move list
        document.getElementById('moveList').innerHTML = '';
        document.getElementById('chatMessages').innerHTML = '';
    }

    // Chess board rendering
    renderBoard(boardId = 'chessBoard') {
        const boardElement = document.getElementById(boardId);
        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = this.board[row][col];
                if (piece) {
                    square.textContent = this.getPieceSymbol(piece);
                }

                if (boardId === 'chessBoard') {
                    square.addEventListener('click', () => this.handleSquareClick(row, col));
                }

                boardElement.appendChild(square);
            }
        }
    }

    getPieceSymbol(piece) {
        const symbols = {
            'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
            'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
        };
        return symbols[piece] || '';
    }

    handleSquareClick(row, col) {
        if (this.gameOver) return;

        // If it's AI's turn and we're playing against computer, ignore clicks
        if (this.gameMode === 'pvc' && this.currentPlayer === 'black') return;

        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

        if (this.selectedSquare) {
            if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
                // Deselect current square
                this.clearSelection();
                return;
            }

            // Try to make a move
            if (this.isValidMove(this.selectedSquare.row, this.selectedSquare.col, row, col)) {
                this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
                this.clearSelection();
                return;
            }
        }

        // Select new square if it has a piece of current player
        const piece = this.board[row][col];
        if (piece && this.isPieceOfCurrentPlayer(piece)) {
            this.clearSelection();
            this.selectedSquare = { row, col };
            square.classList.add('selected');
            this.highlightValidMoves(row, col);
        }
    }

    clearSelection() {
        document.querySelectorAll('.chess-square').forEach(sq => {
            sq.classList.remove('selected', 'valid-move', 'has-piece');
        });
        this.selectedSquare = null;
    }

    highlightValidMoves(fromRow, fromCol) {
        const validMoves = this.getValidMoves(fromRow, fromCol);
        validMoves.forEach(([toRow, toCol]) => {
            const targetSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
            if (targetSquare) {
                targetSquare.classList.add('valid-move');
                if (this.board[toRow][toCol]) {
                    targetSquare.classList.add('has-piece');
                }
            }
        });
    }

    isPieceOfCurrentPlayer(piece) {
        return (this.currentPlayer === 'white' && piece === piece.toUpperCase()) ||
               (this.currentPlayer === 'black' && piece === piece.toLowerCase());
    }

    // Chess move validation and execution
    isValidMove(fromRow, fromCol, toRow, toCol) {
        const validMoves = this.getValidMoves(fromRow, fromCol);
        return validMoves.some(([row, col]) => row === toRow && col === toCol);
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const moves = [];
        const pieceType = piece.toLowerCase();

        switch (pieceType) {
            case 'p':
                moves.push(...this.getPawnMoves(row, col, piece));
                break;
            case 'r':
                moves.push(...this.getRookMoves(row, col, piece));
                break;
            case 'n':
                moves.push(...this.getKnightMoves(row, col, piece));
                break;
            case 'b':
                moves.push(...this.getBishopMoves(row, col, piece));
                break;
            case 'q':
                moves.push(...this.getQueenMoves(row, col, piece));
                break;
            case 'k':
                moves.push(...this.getKingMoves(row, col, piece));
                break;
        }

        // Filter out moves that would put own king in check
        return moves.filter(([toRow, toCol]) => {
            return this.isMoveLegal(row, col, toRow, toCol);
        });
    }

    getPawnMoves(row, col, piece) {
        const moves = [];
        const isWhite = piece === piece.toUpperCase();
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;

        // Forward move
        if (this.isInBounds(row + direction, col) && !this.board[row + direction][col]) {
            moves.push([row + direction, col]);

            // Double move from start position
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push([row + 2 * direction, col]);
            }
        }

        // Diagonal captures
        [-1, 1].forEach(colOffset => {
            const newRow = row + direction;
            const newCol = col + colOffset;
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (targetPiece && this.isOpponentPiece(piece, targetPiece)) {
                    moves.push([newRow, newCol]);
                }
            }
        });

        return moves;
    }

    getRookMoves(row, col, piece) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        directions.forEach(([dRow, dCol]) => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * dRow;
                const newCol = col + i * dCol;
                
                if (!this.isInBounds(newRow, newCol)) break;
                
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push([newRow, newCol]);
                } else {
                    if (this.isOpponentPiece(piece, targetPiece)) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }
            }
        });

        return moves;
    }

    getKnightMoves(row, col, piece) {
        const moves = [];
        const knightMoves = [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]];

        knightMoves.forEach(([dRow, dCol]) => {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || this.isOpponentPiece(piece, targetPiece)) {
                    moves.push([newRow, newCol]);
                }
            }
        });

        return moves;
    }

    getBishopMoves(row, col, piece) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        directions.forEach(([dRow, dCol]) => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * dRow;
                const newCol = col + i * dCol;
                
                if (!this.isInBounds(newRow, newCol)) break;
                
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push([newRow, newCol]);
                } else {
                    if (this.isOpponentPiece(piece, targetPiece)) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }
            }
        });

        return moves;
    }

    getQueenMoves(row, col, piece) {
        return [...this.getRookMoves(row, col, piece), ...this.getBishopMoves(row, col, piece)];
    }

    getKingMoves(row, col, piece) {
        const moves = [];
        const kingMoves = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];

        kingMoves.forEach(([dRow, dCol]) => {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || this.isOpponentPiece(piece, targetPiece)) {
                    moves.push([newRow, newCol]);
                }
            }
        });

        return moves;
    }

    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isOpponentPiece(piece1, piece2) {
        return (piece1 === piece1.toUpperCase()) !== (piece2 === piece2.toUpperCase());
    }

    isMoveLegal(fromRow, fromCol, toRow, toCol) {
        // Simulate the move to check if it puts own king in check
        const originalPiece = this.board[toRow][toCol];
        const movingPiece = this.board[fromRow][fromCol];
        
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = null;
        
        const isLegal = !this.isKingInCheck(movingPiece === movingPiece.toUpperCase() ? 'white' : 'black');
        
        // Restore the board
        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = originalPiece;
        
        return isLegal;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // Make the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Record the move
        const move = {
            from: [fromRow, fromCol],
            to: [toRow, toCol],
            piece: piece,
            captured: capturedPiece,
            notation: this.getMoveNotation(fromRow, fromCol, toRow, toCol, piece, capturedPiece)
        };
        this.moveHistory.push(move);
        
        // Update UI
        this.renderBoard();
        this.addMoveToHistory(move.notation);
        this.highlightLastMove(fromRow, fromCol, toRow, toCol);
        
        // Check for game over
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        if (this.isCheckmate()) {
            this.endGame(this.currentPlayer === 'white' ? 'black' : 'white');
        } else if (this.isStalemate()) {
            this.endGame('draw');
        } else {
            this.updateTurnIndicator();
            
            // Make AI move if playing against computer
            if (this.gameMode === 'pvc' && this.currentPlayer === 'black') {
                setTimeout(() => this.makeAIMove(), 1000);
            }
        }
    }

    getMoveNotation(fromRow, fromCol, toRow, toCol, piece, captured) {
        const files = 'abcdefgh';
        const ranks = '87654321';
        
        const fromSquare = files[fromCol] + ranks[fromRow];
        const toSquare = files[toCol] + ranks[toRow];
        
        let notation = piece.toUpperCase();
        if (piece.toLowerCase() === 'p') {
            notation = '';
            if (captured) {
                notation = files[fromCol];
            }
        }
        
        if (captured) notation += 'x';
        notation += toSquare;
        
        return notation;
    }

    addMoveToHistory(notation) {
        const moveList = document.getElementById('moveList');
        const moveNumber = Math.ceil(this.moveHistory.length / 2);
        
        if (this.moveHistory.length % 2 === 1) {
            // White's move
            const movePair = document.createElement('div');
            movePair.className = 'move-pair';
            movePair.innerHTML = `
                <span class="move-number">${moveNumber}.</span>
                <span class="move">${notation}</span>
                <span class="move"></span>
            `;
            moveList.appendChild(movePair);
        } else {
            // Black's move
            const lastPair = moveList.lastElementChild;
            if (lastPair) {
                const blackMove = lastPair.querySelector('.move:last-child');
                if (blackMove) {
                    blackMove.textContent = notation;
                }
            }
        }
        
        moveList.scrollTop = moveList.scrollHeight;
    }

    highlightLastMove(fromRow, fromCol, toRow, toCol) {
        document.querySelectorAll('.last-move').forEach(sq => sq.classList.remove('last-move'));
        const fromSquare = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
        const toSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
        if (fromSquare) fromSquare.classList.add('last-move');
        if (toSquare) toSquare.classList.add('last-move');
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('currentTurn');
        indicator.textContent = this.currentPlayer === 'white' ? 'White to move' : 'Black to move';
    }

    // AI Logic
    makeAIMove() {
        if (this.gameOver) return;
        
        let move;
        switch (this.aiDifficulty) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                move = this.getBestMove(2);
                break;
            case 'hard':
                move = this.getBestMove(3);
                break;
        }
        
        if (move) {
            this.makeMove(move.from[0], move.from[1], move.to[0], move.to[1]);
        }
    }

    getRandomMove() {
        const allMoves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece === piece.toLowerCase()) {
                    const moves = this.getValidMoves(row, col);
                    moves.forEach(([toRow, toCol]) => {
                        allMoves.push({ from: [row, col], to: [toRow, toCol] });
                    });
                }
            }
        }
        
        return allMoves.length > 0 ? allMoves[Math.floor(Math.random() * allMoves.length)] : null;
    }

    getBestMove(depth) {
        const result = this.minimax(depth, -Infinity, Infinity, true);
        return result.move;
    }

    minimax(depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || this.isGameOver()) {
            return { score: this.evaluatePosition(), move: null };
        }

        const moves = this.getAllValidMoves(maximizingPlayer ? 'black' : 'white');
        let bestMove = null;

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                this.makeTemporaryMove(move);
                const evaluation = this.minimax(depth - 1, alpha, beta, false);
                this.undoTemporaryMove(move);

                if (eval.score > maxEval) {
                    maxEval = eval.score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, eval.score);
                if (beta <= alpha) break;
            }
            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                this.makeTemporaryMove(move);
                const evaluation = this.minimax(depth - 1, alpha, beta, true);
                this.undoTemporaryMove(move);

                if (eval.score < minEval) {
                    minEval = eval.score;
                    bestMove = move;
                }
                beta = Math.min(beta, eval.score);
                if (beta <= alpha) break;
            }
            return { score: minEval, move: bestMove };
        }
    }

    getAllValidMoves(color) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && ((color === 'white' && piece === piece.toUpperCase()) || 
                             (color === 'black' && piece === piece.toLowerCase()))) {
                    const validMoves = this.getValidMoves(row, col);
                    validMoves.forEach(([toRow, toCol]) => {
                        moves.push({
                            from: [row, col],
                            to: [toRow, toCol],
                            piece: piece,
                            captured: this.board[toRow][toCol]
                        });
                    });
                }
            }
        }
        
        return moves;
    }

    makeTemporaryMove(move) {
        move.originalPiece = this.board[move.to[0]][move.to[1]];
        this.board[move.to[0]][move.to[1]] = this.board[move.from[0]][move.from[1]];
        this.board[move.from[0]][move.from[1]] = null;
    }

    undoTemporaryMove(move) {
        this.board[move.from[0]][move.from[1]] = this.board[move.to[0]][move.to[1]];
        this.board[move.to[0]][move.to[1]] = move.originalPiece;
    }

    evaluatePosition() {
        let score = 0;
        const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const value = pieceValues[piece.toLowerCase()];
                    if (piece === piece.toLowerCase()) {
                        score += value; // Black pieces (AI)
                    } else {
                        score -= value; // White pieces (human)
                    }
                }
            }
        }
        
        return score;
    }

    // Game state checks
    isKingInCheck(color) {
        const kingPosition = this.findKing(color);
        if (!kingPosition) return false;
        
        return this.isSquareAttacked(kingPosition[0], kingPosition[1], color === 'white' ? 'black' : 'white');
    }

    findKing(color) {
        const kingSymbol = color === 'white' ? 'K' : 'k';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === kingSymbol) {
                    return [row, col];
                }
            }
        }
        return null;
    }

    isSquareAttacked(row, col, attackingColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && ((attackingColor === 'white' && piece === piece.toUpperCase()) || 
                             (attackingColor === 'black' && piece === piece.toLowerCase()))) {
                    const moves = this.getPieceAttacks(r, c, piece);
                    if (moves.some(([attackRow, attackCol]) => attackRow === row && attackCol === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getPieceAttacks(row, col, piece) {
        // Similar to getValidMoves but doesn't check for king safety
        const moves = [];
        const pieceType = piece.toLowerCase();

        switch (pieceType) {
            case 'p':
                moves.push(...this.getPawnAttacks(row, col, piece));
                break;
            case 'r':
                moves.push(...this.getRookMoves(row, col, piece));
                break;
            case 'n':
                moves.push(...this.getKnightMoves(row, col, piece));
                break;
            case 'b':
                moves.push(...this.getBishopMoves(row, col, piece));
                break;
            case 'q':
                moves.push(...this.getQueenMoves(row, col, piece));
                break;
            case 'k':
                moves.push(...this.getKingMoves(row, col, piece));
                break;
        }

        return moves;
    }

    getPawnAttacks(row, col, piece) {
        const moves = [];
        const isWhite = piece === piece.toUpperCase();
        const direction = isWhite ? -1 : 1;

        // Diagonal attacks only
        [-1, 1].forEach(colOffset => {
            const newRow = row + direction;
            const newCol = col + colOffset;
            if (this.isInBounds(newRow, newCol)) {
                moves.push([newRow, newCol]);
            }
        });

        return moves;
    }

    isCheckmate() {
        if (!this.isKingInCheck(this.currentPlayer)) return false;
        
        const moves = this.getAllValidMoves(this.currentPlayer);
        return moves.length === 0;
    }

    isStalemate() {
        if (this.isKingInCheck(this.currentPlayer)) return false;
        
        const moves = this.getAllValidMoves(this.currentPlayer);
        return moves.length === 0;
    }

    isGameOver() {
        return this.isCheckmate() || this.isStalemate();
    }

    // Game end handling
    endGame(winner) {
        this.gameOver = true;
        this.winner = winner;
        this.stopGameTimer();
        
        let resultText = '';
        let ratingChange = { white: 0, black: 0 };
        
        if (winner === 'draw') {
            resultText = 'Game drawn!';
            if (this.gameMode === 'pvp') {
                ratingChange = this.calculateRatingChange('draw');
            }
        } else {
            resultText = `${winner === 'white' ? 'White' : 'Black'} wins!`;
            if (this.gameMode === 'pvp') {
                ratingChange = this.calculateRatingChange(winner);
            }
        }
        
        this.showGameResult(resultText, ratingChange);
    }

    calculateRatingChange(result) {
        if (this.gameMode !== 'pvp') return { white: 0, black: 0 };
        
        const whiteRating = this.users[this.currentUser].rating;
        const blackRating = this.opponent.rating;
        const K = 32;
        
        const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
        const expectedBlack = 1 - expectedWhite;
        
        let actualWhite, actualBlack;
        if (result === 'white') {
            actualWhite = 1;
            actualBlack = 0;
        } else if (result === 'black') {
            actualWhite = 0;
            actualBlack = 1;
        } else { // draw
            actualWhite = 0.5;
            actualBlack = 0.5;
        }
        
        const whiteChange = Math.round(K * (actualWhite - expectedWhite));
        const blackChange = Math.round(K * (actualBlack - expectedBlack));
        
        return { white: whiteChange, black: blackChange };
    }

    showGameResult(resultText, ratingChange) {
        document.getElementById('gameResultTitle').textContent = 'Game Over';
        document.getElementById('gameResult').textContent = resultText;
        
        let ratingChangeText = '';
        if (this.gameMode === 'pvp') {
            const userChange = ratingChange.white;
            ratingChangeText = `Rating change: ${userChange >= 0 ? '+' : ''}${userChange}`;
            
            // Update user rating
            this.users[this.currentUser].rating += userChange;
            this.saveUserData();
            
            // Update stats
            this.users[this.currentUser].gamesPlayed++;
            if (this.winner === 'white') {
                this.users[this.currentUser].wins++;
            } else if (this.winner === 'black') {
                this.users[this.currentUser].losses++;
            } else {
                this.users[this.currentUser].draws++;
            }
        }
        
        const ratingChangeElement = document.getElementById('ratingChange');
        ratingChangeElement.innerHTML = ratingChangeText;
        if (ratingChange.white > 0) {
            ratingChangeElement.className = 'rating-change rating-gain';
        } else if (ratingChange.white < 0) {
            ratingChangeElement.className = 'rating-change rating-loss';
        } else {
            ratingChangeElement.className = 'rating-change';
        }
        
        this.saveGameToHistory();
        this.showModal('gameResultModal');
    }

    saveGameToHistory() {
        if (!this.gameHistory[this.currentUser]) {
            this.gameHistory[this.currentUser] = [];
        }
        
        const gameRecord = {
            date: new Date().toISOString(),
            opponent: this.opponent.name,
            result: this.winner,
            moves: [...this.moveHistory],
            gameMode: this.gameMode,
            userColor: 'white'
        };
        
        this.gameHistory[this.currentUser].push(gameRecord);
        localStorage.setItem('chessGameHistory', JSON.stringify(this.gameHistory));
    }

    closeResultModal() {
        this.hideModal('gameResultModal');
    }

    startNewGame() {
        this.closeResultModal();
        this.backToDashboard();
    }

    // Timer
    startGameTimer() {
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.endGame(this.currentPlayer === 'white' ? 'black' : 'white');
            }
        }, 1000);
    }

    stopGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('gameTimer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Chat
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addChatMessage(this.currentUser, message);
        input.value = '';
        
        // Simulate opponent response (in real app, this would be network communication)
        if (this.gameMode === 'pvc') {
            setTimeout(() => {
                const responses = [
                    'Good move!', 'Interesting strategy', 'Nice game!',
                    'Well played', 'That was unexpected'
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                this.addChatMessage(this.opponent.name, response);
            }, 1000 + Math.random() * 2000);
        }
    }

    addChatMessage(sender, message) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `
            <span class="message-sender">${sender}:</span>
            <span class="message-text">${message}</span>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Game controls
    resign() {
        if (confirm('Are you sure you want to resign?')) {
            this.endGame(this.currentPlayer === 'white' ? 'black' : 'white');
        }
    }

    offerDraw() {
        if (confirm('Offer a draw?')) {
            // In a real game, this would send a draw offer to the opponent
            // For now, we'll just accept it
            this.endGame('draw');
        }
    }

    backToDashboard() {
        this.stopGameTimer();
        this.gameOver = true;
        this.showDashboard();
    }

    // Friends system
    addFriend() {
        const friendUsername = document.getElementById('friendUsernameInput').value.trim();
        
        if (!friendUsername) {
            alert('Please enter a username');
            return;
        }
        
        if (friendUsername === this.currentUser) {
            alert('You cannot add yourself as a friend');
            return;
        }
        
        if (this.users[this.currentUser].friends.includes(friendUsername)) {
            alert('User is already in your friends list');
            return;
        }
        
        // In a real app, we'd check if the user exists
        // For demo purposes, we'll just add them
        this.users[this.currentUser].friends.push(friendUsername);
        this.saveUserData();
        this.loadFriendsList();
        
        document.getElementById('friendUsernameInput').value = '';
        alert(`Added ${friendUsername} to your friends list!`);
    }

    loadFriendsList() {
        const friendsList = document.getElementById('friendsList');
        friendsList.innerHTML = '';
        
        this.users[this.currentUser].friends.forEach(friendName => {
            const friendDiv = document.createElement('div');
            friendDiv.className = 'friend-item';
            friendDiv.innerHTML = `
                <span>${friendName}</span>
                <button class="btn btn--sm btn--primary" onclick="chessGame.invitePlayer('${friendName}', 1200)">Invite</button>
            `;
            friendsList.appendChild(friendDiv);
        });
        
        if (this.users[this.currentUser].friends.length === 0) {
            friendsList.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center;">No friends added yet</p>';
        }
    }

    loadGameHistory() {
        const historyList = document.getElementById('gameHistoryList');
        historyList.innerHTML = '';
        
        const userHistory = this.gameHistory[this.currentUser] || [];
        const recentGames = userHistory.slice(-5).reverse();
        
        recentGames.forEach(game => {
            const date = new Date(game.date).toLocaleDateString();
            let resultText = '';
            if (game.result === 'white') {
                resultText = 'Won';
            } else if (game.result === 'black') {
                resultText = 'Lost';
            } else {
                resultText = 'Draw';
            }
            
            const gameDiv = document.createElement('div');
            gameDiv.className = 'history-item';
            gameDiv.innerHTML = `
                <div><strong>vs ${game.opponent}</strong></div>
                <div>${resultText} • ${date}</div>
            `;
            historyList.appendChild(gameDiv);
        });
        
        if (recentGames.length === 0) {
            historyList.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center;">No games played yet</p>';
        }
    }

    // Analysis system
    startAnalysis() {
        this.currentAnalysis = {
            moves: [...this.moveHistory],
            board: this.cloneBoard(this.getInitialBoard()),
            evaluations: []
        };
        
        this.analyzeGame();
        this.hideModal('gameResultModal');
        this.showScreen('analysisScreen');
    }

    cloneBoard(board) {
        return board.map(row => [...row]);
    }

    getInitialBoard() {
        return [
            ['r','n','b','q','k','b','n','r'],
            ['p','p','p','p','p','p','p','p'],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            ['P','P','P','P','P','P','P','P'],
            ['R','N','B','Q','K','B','N','R']
        ];
    }

    analyzeGame() {
        const analysisResults = document.getElementById('analysisResults');
        analysisResults.innerHTML = '<div style="text-align: center; padding: 20px;">Analyzing game...</div>';
        
        // Simulate analysis (in a real app, this would use a stronger engine)
        setTimeout(() => {
            this.performAnalysis();
            this.displayAnalysisResults();
        }, 2000);
    }

    performAnalysis() {
        const tempBoard = this.cloneBoard(this.getInitialBoard());
        let tempCurrentPlayer = 'white';
        
        this.currentAnalysis.evaluations = this.currentAnalysis.moves.map((move, index) => {
            // Get the best move for this position
            const savedBoard = this.board;
            const savedPlayer = this.currentPlayer;
            
            this.board = this.cloneBoard(tempBoard);
            this.currentPlayer = tempCurrentPlayer;
            
            const bestMove = this.getBestMove(2);
            const bestMoveScore = this.evaluatePosition();
            
            // Make the actual move on temp board
            tempBoard[move.to[0]][move.to[1]] = tempBoard[move.from[0]][move.from[1]];
            tempBoard[move.from[0]][move.from[1]] = null;
            
            this.board = this.cloneBoard(tempBoard);
            const actualMoveScore = this.evaluatePosition();
            
            // Restore original board state
            this.board = savedBoard;
            this.currentPlayer = savedPlayer;
            
            tempCurrentPlayer = tempCurrentPlayer === 'white' ? 'black' : 'white';
            
            // Calculate move quality
            const scoreDifference = Math.abs(bestMoveScore - actualMoveScore);
            let evaluation = 'brilliant';
            
            if (scoreDifference <= 0.3) {
                evaluation = 'good';
            } else if (scoreDifference <= 0.7) {
                evaluation = 'inaccuracy';
            } else if (scoreDifference <= 1.5) {
                evaluation = 'mistake';
            } else {
                evaluation = 'blunder';
            }
            
            return {
                move: move,
                evaluation: evaluation,
                bestMove: bestMove,
                scoreDifference: scoreDifference
            };
        });
    }

    displayAnalysisResults() {
        const analysisResults = document.getElementById('analysisResults');
        analysisResults.innerHTML = '';
        
        this.currentAnalysis.evaluations.forEach((analysis, index) => {
            const moveDiv = document.createElement('div');
            moveDiv.className = 'analysis-move';
            moveDiv.innerHTML = `
                <div class="move-info">
                    <div class="move-notation">${analysis.move.notation}</div>
                    ${analysis.evaluation !== 'brilliant' && analysis.evaluation !== 'good' ? 
                        `<div class="move-suggestion">Best: ${this.getBestMoveNotation(analysis.bestMove)}</div>` : ''}
                </div>
                <div class="move-evaluation eval-${analysis.evaluation}">${this.getEvaluationText(analysis.evaluation)}</div>
            `;
            analysisResults.appendChild(moveDiv);
        });
        
        // Initialize analysis board
        this.analysisPosition = 0;
        this.updateAnalysisBoard();
    }

    getEvaluationText(evaluation) {
        const texts = {
            brilliant: 'Brilliant',
            good: 'Good',
            inaccuracy: 'Inaccuracy',
            mistake: 'Mistake',
            blunder: 'Blunder'
        };
        return texts[evaluation] || 'Unknown';
    }

    getBestMoveNotation(move) {
        if (!move) return '---';
        
        const files = 'abcdefgh';
        const ranks = '87654321';
        return files[move.to[1]] + ranks[move.to[0]];
    }

    updateAnalysisBoard() {
        // Recreate board state at current analysis position
        const tempBoard = this.cloneBoard(this.getInitialBoard());
        
        for (let i = 0; i < this.analysisPosition; i++) {
            const move = this.currentAnalysis.moves[i];
            tempBoard[move.to[0]][move.to[1]] = tempBoard[move.from[0]][move.from[1]];
            tempBoard[move.from[0]][move.from[1]] = null;
        }
        
        // Render the analysis board
        this.renderAnalysisBoard(tempBoard);
    }

    renderAnalysisBoard(board) {
        const boardElement = document.getElementById('analysisBoard');
        if (!boardElement) return;
        
        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = board[row][col];
                if (piece) {
                    square.textContent = this.getPieceSymbol(piece);
                }

                boardElement.appendChild(square);
            }
        }
    }

    previousAnalysisMove() {
        if (this.analysisPosition > 0) {
            this.analysisPosition--;
            this.updateAnalysisBoard();
        }
    }

    nextAnalysisMove() {
        if (this.analysisPosition < this.currentAnalysis.moves.length) {
            this.analysisPosition++;
            this.updateAnalysisBoard();
        }
    }

    resetAnalysisPosition() {
        this.analysisPosition = 0;
        this.updateAnalysisBoard();
    }

    backFromAnalysis() {
        this.showDashboard();
    }

    // Data persistence
    saveUserData() {
        localStorage.setItem('chessUsers', JSON.stringify(this.users));
    }
}

// Initialize the game when page loads
let chessGame;
document.addEventListener('DOMContentLoaded', () => {
    chessGame = new ChessGame();
});
