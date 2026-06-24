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
  return code.toUpperCase();
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
        current_turn_user_id: userId,
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
    
    // Normalize room code
    const normalizedCode = roomCode.trim().toUpperCase();
    
    // Get the room
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', normalizedCode)
      .maybeSingle();
    
    if (roomError) {
      console.warn('Failed to get game room:', roomError.message);
      return { room: null, error: roomError.message };
    }
    
    if (!room) {
      return { room: null, error: 'Invalid room code' };
    }
    
    // Check if room is available for joining
    if (room.status === 'finished' || room.status === 'cancelled') {
      return { room: null, error: 'Room is not available for joining' };
    }
    
    // Check if user is already in the room
    const { data: existingPlayer, error: existingPlayerError } = await supabase
      .from('game_room_players')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingPlayerError) {
      console.warn('Failed to check existing player:', existingPlayerError.message);
      return { room: null, error: existingPlayerError.message };
    }
    
    if (existingPlayer) {
      // User is already in the room, return the room
      return { room, error: null };
    }
    
    // Get current joined players
    const { data: players, error: playersError } = await supabase
      .from('game_room_players')
      .select('*')
      .eq('room_id', room.id)
      .eq('status', 'joined');
    
    if (playersError) {
      console.warn('Failed to get players:', playersError.message);
      return { room: null, error: playersError.message };
    }
    
    const joinedPlayers = players || [];
    
    if (joinedPlayers.length >= room.max_players) {
      return { room: null, error: 'Room is full' };
    }
    
    // Assign symbol based on player count
    const symbol = joinedPlayers.length === 0 ? 'X' : 'O';
    
    // Add user as player
    const { error: addPlayerError } = await supabase
      .from('game_room_players')
      .insert({
        room_id: room.id,
        user_id: userId,
        symbol,
        status: 'joined'
      });
    
    if (addPlayerError) {
      console.warn('Failed to add player:', addPlayerError.message);
      return { room: null, error: addPlayerError.message };
    }
    
    // If this makes 2 players, update room status to active
    if (joinedPlayers.length === 1) {
      const xPlayer = joinedPlayers.find(p => p.symbol === 'X');
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({
          status: 'active',
          current_turn_user_id: xPlayer?.user_id || userId
        })
        .eq('id', room.id);
      
      if (updateError) {
        console.warn('Failed to update room status:', updateError.message);
        return { room: null, error: updateError.message };
      }
      
      return { room: { ...room, status: 'active', current_turn_user_id: xPlayer?.user_id || userId }, error: null };
    }
    
    return { room, error: null };
  } catch (err) {
    console.warn('Error joining game room:', err);
    return { room: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get a game room by room code
export async function getGameRoom(roomCode: string): Promise<{ room: GameRoom | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const normalizedCode = roomCode.trim().toUpperCase();
    
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', normalizedCode)
      .maybeSingle();
    
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
    
    // Step A: Get hosted rooms
    const { data: hostedRooms, error: hostedError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('host_id', userId)
      .order('created_at', { ascending: false });
    
    if (hostedError) {
      console.warn('Failed to get hosted rooms:', hostedError.message);
      return { rooms: [], error: hostedError.message };
    }
    
    // Step B: Get player rows to find rooms user is in
    const { data: playerRows, error: playerError } = await supabase
      .from('game_room_players')
      .select('room_id')
      .eq('user_id', userId)
      .eq('status', 'joined');
    
    if (playerError) {
      console.warn('Failed to get player rows:', playerError.message);
      return { rooms: [], error: playerError.message };
    }
    
    // Step C: Fetch rooms by ids from player rows
    const roomIds = playerRows?.map(p => p.room_id) || [];
    let playerRooms: GameRoom[] = [];
    
    if (roomIds.length > 0) {
      const { data: roomsData, error: roomsError } = await supabase
        .from('game_rooms')
        .select('*')
        .in('id', roomIds)
        .order('created_at', { ascending: false });
      
      if (roomsError) {
        console.warn('Failed to get player rooms:', roomsError.message);
        return { rooms: [], error: roomsError.message };
      }
      
      playerRooms = roomsData || [];
    }
    
    // Step D: Merge by id, prioritizing hosted rooms
    const roomMap = new Map<string, GameRoom>();
    
    // Add hosted rooms first
    (hostedRooms || []).forEach(room => {
      roomMap.set(room.id, room);
    });
    
    // Add player rooms (only if not already in map)
    playerRooms.forEach(room => {
      if (!roomMap.has(room.id)) {
        roomMap.set(room.id, room);
      }
    });
    
    // Convert to array and sort by created_at
    const allRooms = Array.from(roomMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return { rooms: allRooms, error: null };
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
    
    if (user.id === friendId) {
      return { invite: null, error: 'Cannot invite yourself' };
    }
    
    // Check room exists and user is host/player
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .maybeSingle();
    
    if (roomError || !room) {
      return { invite: null, error: 'Room not found' };
    }
    
    if (room.status === 'finished' || room.status === 'cancelled') {
      return { invite: null, error: 'Room is not available for inviting' };
    }
    
    // Check if user is host or player in room
    const { data: playerCheck } = await supabase
      .from('game_room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (room.host_id !== user.id && !playerCheck) {
      return { invite: null, error: 'You must be the host or a player to invite' };
    }
    
    // Check existing invite
    const { data: existingInvite } = await supabase
      .from('game_invites')
      .select('*')
      .eq('room_id', roomId)
      .eq('invitee_id', friendId)
      .maybeSingle();
    
    if (existingInvite) {
      if (existingInvite.status === 'pending') {
        return { invite: null, error: 'Invite already sent' };
      } else if (existingInvite.status === 'accepted') {
        return { invite: null, error: 'Friend already accepted' };
      }
      // If rejected or cancelled, update back to pending
      const { data, error } = await supabase
        .from('game_invites')
        .update({ status: 'pending' })
        .eq('id', existingInvite.id)
        .select('*')
        .single();
      
      if (error) {
        console.warn('Failed to update invite:', error.message);
        return { invite: null, error: error.message };
      }
      
      return { invite: data, error: null };
    }
    
    // Create new invite
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

// Get game invites for a user (incoming pending invites)
export async function getMyGameInvites(userId: string): Promise<{ invites: any[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get pending invites where user is invitee
    const { data: invites, error: invitesError } = await supabase
      .from('game_invites')
      .select('*')
      .eq('invitee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (invitesError) {
      console.warn('Failed to get game invites:', invitesError.message);
      return { invites: [], error: invitesError.message };
    }
    
    if (!invites || invites.length === 0) {
      return { invites: [], error: null };
    }
    
    // Get room details
    const roomIds = invites.map(i => i.room_id);
    const { data: rooms } = await supabase
      .from('game_rooms')
      .select('*')
      .in('id', roomIds);
    
    // Get inviter profiles
    const inviterIds = invites.map(i => i.inviter_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', inviterIds);
    
    // Combine data
    const enrichedInvites = invites.map(invite => {
      const room = rooms?.find(r => r.id === invite.room_id);
      const inviter = profiles?.find(p => p.id === invite.inviter_id);
      return {
        ...invite,
        room_code: room?.room_code || '',
        game_type: room?.game_type || 'tic_tac_toe',
        inviter_display_name: inviter?.display_name || inviter?.username || 'Friend',
        inviter_username: inviter?.username || '',
        inviter_avatar_url: inviter?.avatar_url || null
      };
    });
    
    return { invites: enrichedInvites, error: null };
  } catch (err) {
    console.warn('Error getting game invites:', err);
    return { invites: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Respond to a game invite
export async function respondToGameInvite(inviteId: string, status: 'accepted' | 'rejected'): Promise<{ room: GameRoom | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { room: null, error: 'Not authenticated' };
    }
    
    // Get invite details
    const { data: invite, error: inviteError } = await supabase
      .from('game_invites')
      .select('*')
      .eq('id', inviteId)
      .maybeSingle();
    
    if (inviteError || !invite) {
      return { room: null, error: 'Invite not found' };
    }
    
    if (invite.invitee_id !== user.id) {
      return { room: null, error: 'You can only respond to invites sent to you' };
    }
    
    if (invite.status !== 'pending') {
      return { room: null, error: 'Invite no longer available' };
    }
    
    // Get room details
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', invite.room_id)
      .maybeSingle();
    
    if (roomError || !room) {
      return { room: null, error: 'Room not found' };
    }
    
    if (room.status === 'finished' || room.status === 'cancelled') {
      return { room: null, error: 'Game already finished' };
    }
    
    // Update invite status
    const { error: updateError } = await supabase
      .from('game_invites')
      .update({ status })
      .eq('id', inviteId);
    
    if (updateError) {
      console.warn('Failed to respond to invite:', updateError.message);
      return { room: null, error: updateError.message };
    }
    
    if (status === 'rejected') {
      return { room: null, error: null };
    }
    
    // If accepted, join the room
    const { room: joinedRoom, error: joinError } = await joinGameRoom(room.room_code, user.id);
    
    if (joinError) {
      return { room: null, error: joinError };
    }
    
    return { room: joinedRoom, error: null };
  } catch (err) {
    console.warn('Error responding to invite:', err);
    return { room: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Cancel a game invite
export async function cancelGameInvite(inviteId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }
    
    // Get invite to verify ownership
    const { data: invite, error: inviteError } = await supabase
      .from('game_invites')
      .select('*')
      .eq('id', inviteId)
      .maybeSingle();
    
    if (inviteError || !invite) {
      return { error: 'Invite not found' };
    }
    
    if (invite.inviter_id !== user.id) {
      return { error: 'You can only cancel your own invites' };
    }
    
    if (invite.status !== 'pending') {
      return { error: 'Invite can only be cancelled when pending' };
    }
    
    // Update invite status
    const { error: updateError } = await supabase
      .from('game_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId);
    
    if (updateError) {
      console.warn('Failed to cancel invite:', updateError.message);
      return { error: updateError.message };
    }
    
    return { error: null };
  } catch (err) {
    console.warn('Error cancelling invite:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get pending game invite count for a user
export async function getPendingGameInviteCount(userId: string): Promise<{ count: number; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('game_invites')
      .select('id', { count: 'exact' })
      .eq('invitee_id', userId)
      .eq('status', 'pending');
    
    if (error) {
      console.warn('Failed to get pending invite count:', error.message);
      return { count: 0, error: error.message };
    }
    
    return { count: data?.length || 0, error: null };
  } catch (err) {
    console.warn('Error getting pending invite count:', err);
    return { count: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Subscribe to game invites for a user
export function subscribeToGameInvites(userId: string, callback: (payload: any) => void) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const channel = supabase
    .channel(`game-invites-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_invites',
        filter: `invitee_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
  
  return channel;
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
      .maybeSingle();
    
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
    
    // Get all players for turn switching and result saving
    const { data: allPlayers } = await supabase
      .from('game_room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'joined');
    
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
      .maybeSingle();
    
    if (roomError) {
      console.warn('Failed to get room:', roomError.message);
      return { error: roomError.message };
    }
    
    if (!room) {
      return { error: 'Room not found' };
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
