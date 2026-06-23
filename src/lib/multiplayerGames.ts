import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export interface GameRoom {
  id: string;
  room_code: string;
  host_id: string;
  game_type: string;
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
  max_players: number;
  current_turn_user_id: string | null;
  winner_user_id: string | null;
  game_state: any;
  created_at: string;
  updated_at: string;
}

export interface GameRoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  symbol: 'X' | 'O' | null;
  status: 'joined' | 'left';
  joined_at: string;
}

export interface GameInvite {
  id: string;
  room_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface GameResult {
  id: string;
  room_id: string;
  game_type: string;
  player_one_id: string | null;
  player_two_id: string | null;
  winner_user_id: string | null;
  result: 'player_one_win' | 'player_two_win' | 'draw' | 'cancelled';
  created_at: string;
}

export interface TicTacToeState {
  board: string[];
  moves: number[];
  winner: string | null;
  isDraw: boolean;
}

// Generate a random 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new game room
export async function createGameRoom(userId: string, gameType: string = 'tic_tac_toe'): Promise<{ room: GameRoom | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const roomCode = generateRoomCode();
    
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        room_code: roomCode,
        host_id: userId,
        game_type: gameType,
        status: 'waiting',
        max_players: 2,
        game_state: {
          board: ['', '', '', '', '', '', '', '', ''],
          moves: [],
          winner: null,
          isDraw: false
        }
      })
      .select('*')
      .single();
    
    if (error) {
      console.warn('Failed to create game room:', error.message);
      return { room: null, error: error.message };
    }
    
    // Add host as first player with symbol X
    const { error: playerError } = await supabase
      .from('game_room_players')
      .insert({
        room_id: data.id,
        user_id: userId,
        symbol: 'X',
        status: 'joined'
      });
    
    if (playerError) {
      console.warn('Failed to add host as player:', playerError.message);
      return { room: null, error: playerError.message };
    }
    
    return { room: data, error: null };
  } catch (err) {
    console.warn('Error creating game room:', err);
    return { room: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Join a game room by room code
export async function joinGameRoom(roomCode: string, userId: string): Promise<{ room: GameRoom | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the room
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single();
    
    if (roomError) {
      console.warn('Failed to get game room:', roomError.message);
      return { room: null, error: roomError.message };
    }
    
    // Check if room is waiting and not full
    if (room.status !== 'waiting') {
      return { room: null, error: 'Room is not available for joining' };
    }
    
    // Get current players
    const { data: players, error: playersError } = await supabase
      .from('game_room_players')
      .select('*')
      .eq('room_id', room.id);
    
    if (playersError) {
      console.warn('Failed to get players:', playersError.message);
      return { room: null, error: playersError.message };
    }
    
    if (players && players.length >= room.max_players) {
      return { room: null, error: 'Room is full' };
    }
    
    // Check if user is already in the room
    if (players && players.some(p => p.user_id === userId)) {
      return { room: null, error: 'You are already in this room' };
    }
    
    // Add user as second player with symbol O
    const { error: addPlayerError } = await supabase
      .from('game_room_players')
      .insert({
        room_id: room.id,
        user_id: userId,
        symbol: 'O',
        status: 'joined'
      });
    
    if (addPlayerError) {
      console.warn('Failed to add player:', addPlayerError.message);
      return { room: null, error: addPlayerError.message };
    }
    
    // Update room status to active and set current turn to host (X)
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        status: 'active',
        current_turn_user_id: room.host_id
      })
      .eq('id', room.id);
    
    if (updateError) {
      console.warn('Failed to update room status:', updateError.message);
      return { room: null, error: updateError.message };
    }
    
    return { room: { ...room, status: 'active', current_turn_user_id: room.host_id }, error: null };
  } catch (err) {
    console.warn('Error joining game room:', err);
    return { room: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get a game room by room code
export async function getGameRoom(roomCode: string): Promise<{ room: GameRoom | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single();
    
    if (error) {
      console.warn('Failed to get game room:', error.message);
      return { room: null, error: error.message };
    }
    
    return { room: data, error: null };
  } catch (err) {
    console.warn('Error getting game room:', err);
    return { room: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get all game rooms for a user
export async function getMyGameRooms(userId: string): Promise<{ rooms: GameRoom[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .or(`host_id.eq.${userId},id.in.(select room_id from game_room_players where user_id.eq.${userId})`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Failed to get game rooms:', error.message);
      return { rooms: [], error: error.message };
    }
    
    return { rooms: data || [], error: null };
  } catch (err) {
    console.warn('Error getting game rooms:', err);
    return { rooms: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get players in a room
export async function getRoomPlayers(roomId: string): Promise<{ players: GameRoomPlayer[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('game_room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'joined');
    
    if (error) {
      console.warn('Failed to get room players:', error.message);
      return { players: [], error: error.message };
    }
    
    return { players: data || [], error: null };
  } catch (err) {
    console.warn('Error getting room players:', err);
    return { players: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Invite a friend to a game
export async function inviteFriendToGame(roomId: string, friendId: string): Promise<{ invite: GameInvite | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { invite: null, error: 'Not authenticated' };
    }
    
    const { data, error } = await supabase
      .from('game_invites')
      .insert({
        room_id: roomId,
        inviter_id: user.id,
        invitee_id: friendId,
        status: 'pending'
      })
      .select('*')
      .single();
    
    if (error) {
      console.warn('Failed to invite friend:', error.message);
      return { invite: null, error: error.message };
    }
    
    return { invite: data, error: null };
  } catch (err) {
    console.warn('Error inviting friend:', err);
    return { invite: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get game invites for a user
export async function getMyGameInvites(userId: string): Promise<{ invites: GameInvite[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('game_invites')
      .select('*')
      .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Failed to get game invites:', error.message);
      return { invites: [], error: error.message };
    }
    
    return { invites: data || [], error: null };
  } catch (err) {
    console.warn('Error getting game invites:', err);
    return { invites: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Respond to a game invite
export async function respondToGameInvite(inviteId: string, status: 'accepted' | 'rejected'): Promise<{ error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { error } = await supabase
      .from('game_invites')
      .update({ status })
      .eq('id', inviteId);
    
    if (error) {
      console.warn('Failed to respond to invite:', error.message);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.warn('Error responding to invite:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Make a Tic Tac Toe move
export async function makeTicTacToeMove(roomId: string, userId: string, cellIndex: number): Promise<{ room: GameRoom | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get current room state
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (roomError) {
      console.warn('Failed to get room:', roomError.message);
      return { room: null, error: roomError.message };
    }
    
    // Check if it's the user's turn
    if (room.current_turn_user_id !== userId) {
      return { room: null, error: 'Not your turn' };
    }
    
    // Check if room is active
    if (room.status !== 'active') {
      return { room: null, error: 'Game is not active' };
    }
    
    const gameState = room.game_state as TicTacToeState;
    
    // Check if cell is empty
    if (gameState.board[cellIndex] !== '') {
      return { room: null, error: 'Cell is already occupied' };
    }
    
    // Get user's symbol
    const { data: players, error: playersError } = await supabase
      .from('game_room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();
    
    if (playersError || !players) {
      return { room: null, error: 'Could not find player' };
    }
    
    const symbol = players.symbol;
    
    // Update board
    const newBoard = [...gameState.board];
    newBoard[cellIndex] = symbol;
    
    const newMoves = [...gameState.moves, cellIndex];
    
    // Calculate winner
    const winner = calculateTicTacToeWinner(newBoard);
    const isDraw = !winner && newMoves.length === 9;
    
    const newGameState: TicTacToeState = {
      board: newBoard,
      moves: newMoves,
      winner,
      isDraw
    };
    
    // Determine next turn
    let nextTurnUserId: string | null = null;
    let newStatus = room.status;
    let winnerUserId: string | null = room.winner_user_id;
    
    if (winner) {
      newStatus = 'finished';
      winnerUserId = userId;
    } else if (isDraw) {
      newStatus = 'finished';
    } else {
      // Switch turn
      const { data: allPlayers } = await supabase
        .from('game_room_players')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'joined');
      
      if (allPlayers && allPlayers.length === 2) {
        nextTurnUserId = allPlayers.find(p => p.user_id !== userId)?.user_id || null;
      }
    }
    
    // Update room
    const { data: updatedRoom, error: updateError } = await supabase
      .from('game_rooms')
      .update({
        game_state: newGameState,
        current_turn_user_id: nextTurnUserId,
        status: newStatus,
        winner_user_id: winnerUserId
      })
      .eq('id', roomId)
      .select('*')
      .single();
    
    if (updateError) {
      console.warn('Failed to update room:', updateError.message);
      return { room: null, error: updateError.message };
    }
    
    // If game finished, save result
    if (newStatus === 'finished' && allPlayers) {
      const playerOne = allPlayers.find(p => p.symbol === 'X');
      const playerTwo = allPlayers.find(p => p.symbol === 'O');
      
      let result: 'player_one_win' | 'player_two_win' | 'draw' | 'cancelled';
      
      if (winner) {
        result = symbol === 'X' ? 'player_one_win' : 'player_two_win';
      } else {
        result = 'draw';
      }
      
      await supabase
        .from('game_results')
        .insert({
          room_id: roomId,
          game_type: 'tic_tac_toe',
          player_one_id: playerOne?.user_id || null,
          player_two_id: playerTwo?.user_id || null,
          winner_user_id: winnerUserId,
          result
        });
    }
    
    return { room: updatedRoom, error: null };
  } catch (err) {
    console.warn('Error making move:', err);
    return { room: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Calculate Tic Tac Toe winner
export function calculateTicTacToeWinner(board: string[]): string | null {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];
  
  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  
  return null;
}

// Reset or cancel a room
export async function resetOrCancelRoom(roomId: string, userId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get room to check if user is host
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (roomError) {
      console.warn('Failed to get room:', roomError.message);
      return { error: roomError.message };
    }
    
    // Only host can cancel
    if (room.host_id !== userId) {
      return { error: 'Only host can cancel room' };
    }
    
    // Update room status to cancelled
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({ status: 'cancelled' })
      .eq('id', roomId);
    
    if (updateError) {
      console.warn('Failed to cancel room:', updateError.message);
      return { error: updateError.message };
    }
    
    return { error: null };
  } catch (err) {
    console.warn('Error cancelling room:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Subscribe to game room updates (Supabase Realtime)
export function subscribeToGameRoom(roomId: string, callback: (payload: any) => void) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const channel = supabase
    .channel(`game-room-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`
      },
      callback
    )
    .subscribe();
  
  return channel;
}
