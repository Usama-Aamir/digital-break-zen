import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";
import { 
  createGameRoom, 
  joinGameRoom, 
  getGameRoom, 
  getMyGameRooms, 
  getRoomPlayers, 
  inviteFriendToGame, 
  getMyGameInvites, 
  respondToGameInvite, 
  makeTicTacToeMove, 
  resetOrCancelRoom,
  getPendingGameInviteCount,
  subscribeToGameInvites,
  type GameRoom,
  type GameRoomPlayer,
  type GameInvite,
  type TicTacToeState
} from "@/lib/multiplayerGames";
import { getFriends, type UserProfile } from "@/lib/friends";
import { getCurrentUserProfile } from "@/lib/profiles";
import { Copy, Users, RefreshCw, Gamepad2, ArrowLeft, X, Circle } from "lucide-react";

export const Route = createFileRoute("/games-multiplayer")({
  head: () => ({
    meta: [
      { title: "Multiplayer Games | The Digital Breakroom" },
      { name: "description", content: "Play quick games with your breakroom friends." },
    ],
  }),
  component: MultiplayerGamesPage,
});

function MultiplayerGamesPage() {
  const { t } = useLanguage();
  const { user, isConfigured } = useAuth();
  const [myRooms, setMyRooms] = useState<GameRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<GameRoomPlayer[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const channelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const invitesChannelRef = useRef<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !isConfigured) {
        setLoading(false);
        return;
      }

      try {
        const [roomsData, friendsData, invitesData, inviteCountData] = await Promise.all([
          getMyGameRooms(user.id),
          getFriends(user.id),
          getMyGameInvites(user.id),
          getPendingGameInviteCount(user.id),
        ]);

        if (roomsData.rooms) setMyRooms(roomsData.rooms);
        if (friendsData.friends) setFriends(friendsData.friends);
        if (invitesData.invites) setInvites(invitesData.invites);
        if (inviteCountData.count !== undefined) setPendingInviteCount(inviteCountData.count);
      } catch (err) {
        console.error("Failed to load games data:", err);
        setError("Could not load games data. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id, isConfigured]);

  // Subscribe to game invites
  useEffect(() => {
    if (!user?.id) return;

    const setupInvitesSubscription = () => {
      try {
        const channel = subscribeToGameInvites(user.id, async (payload: any) => {
          // Refresh invites when changes occur
          const [invitesData, inviteCountData] = await Promise.all([
            getMyGameInvites(user.id),
            getPendingGameInviteCount(user.id),
          ]);
          if (invitesData.invites) setInvites(invitesData.invites);
          if (inviteCountData.count !== undefined) setPendingInviteCount(inviteCountData.count);
        });

        invitesChannelRef.current = channel;
      } catch (err) {
        console.warn("Failed to setup invites realtime, will poll:", err);
      }
    };

    setupInvitesSubscription();

    return () => {
      if (invitesChannelRef.current) {
        invitesChannelRef.current.unsubscribe();
        invitesChannelRef.current = null;
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedRoom) return;

    const loadRoomData = async () => {
      try {
        const [playersData] = await Promise.all([
          getRoomPlayers(selectedRoom.id),
        ]);
        if (playersData.players) setRoomPlayers(playersData.players);
      } catch (err) {
        console.error("Failed to load room data:", err);
      }
    };

    loadRoomData();

    // Realtime subscription
    const setupRealtimeSubscription = async () => {
      try {
        const channel = subscribeToGameRoom(selectedRoom.id, (payload: any) => {
          const updatedRoom = payload.new as GameRoom;
          setSelectedRoom(updatedRoom);
          
          // Update myRooms list
          setMyRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
        });

        channelRef.current = channel;
      } catch (err) {
        console.warn("Failed to setup realtime, falling back to polling:", err);
        startPolling();
      }
    };

    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const { room } = await getGameRoom(selectedRoom.room_code);
          if (room) {
            setSelectedRoom(room);
            setMyRooms(prev => prev.map(r => r.id === room.id ? room : r));
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 5000);
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedRoom?.id]);

  const handleCreateRoom = async () => {
    if (!user) return;

    try {
      const { room, error } = await createGameRoom(user.id, 'tic_tac_toe');
      
      if (error) {
        setError(error);
      } else if (room) {
        setMyRooms([room, ...myRooms]);
        setSelectedRoom(room);
      }
    } catch (err) {
      console.error("Failed to create room:", err);
      setError("Could not create room. Please try again.");
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim() || !user) return;

    try {
      const { room, error } = await joinGameRoom(roomCodeInput.trim(), user.id);
      
      if (error) {
        setError(error);
      } else if (room) {
        setMyRooms([room, ...myRooms]);
        setSelectedRoom(room);
        setRoomCodeInput("");
      } else {
        setError("Could not join room. Please try again.");
      }
    } catch (err) {
      console.error("Failed to join room:", err);
      setError("Could not join room. Please try again.");
    }
  };

  const handleInviteFriend = async (friendId: string) => {
    if (!selectedRoom) return;

    try {
      const { invite, error } = await inviteFriendToGame(selectedRoom.id, friendId);
      
      if (error) {
        setError(error);
      } else if (invite) {
        setInvites([invite, ...invites]);
      }
    } catch (err) {
      console.error("Failed to invite friend:", err);
      setError("Could not invite friend. Please try again.");
    }
  };

  const handleRespondToInvite = async (inviteId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await respondToGameInvite(inviteId, status);
      
      if (error) {
        setError(error);
      } else {
        setInvites(invites.filter(i => i.id !== inviteId));
        
        if (status === 'accepted') {
          // Reload rooms to get the joined room
          const { rooms } = await getMyGameRooms(user.id);
          if (rooms) setMyRooms(rooms);
        }
      }
    } catch (err) {
      console.error("Failed to respond to invite:", err);
      setError("Could not respond to invite. Please try again.");
    }
  };

  const handleMakeMove = async (cellIndex: number) => {
    if (!selectedRoom || !user) return;

    try {
      const { room, error } = await makeTicTacToeMove(selectedRoom.id, user.id, cellIndex);
      
      if (error) {
        setError(error);
      } else if (room) {
        setSelectedRoom(room);
        setMyRooms(prev => prev.map(r => r.id === room.id ? room : r));
      }
    } catch (err) {
      console.error("Failed to make move:", err);
      setError("Could not make move. Please try again.");
    }
  };

  const handleCancelRoom = async () => {
    if (!selectedRoom || !user) return;

    try {
      const { error } = await resetOrCancelRoom(selectedRoom.id, user.id);
      
      if (error) {
        setError(error);
      } else {
        setSelectedRoom(null);
        setMyRooms(myRooms.filter(r => r.id !== selectedRoom.id));
      }
    } catch (err) {
      console.error("Failed to cancel room:", err);
      setError("Could not cancel room. Please try again.");
    }
  };

  const handleCopyCode = async () => {
    if (selectedRoom) {
      await navigator.clipboard.writeText(selectedRoom.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      const [roomsData, friendsData, invitesData] = await Promise.all([
        getMyGameRooms(user.id),
        getFriends(user.id),
        getMyGameInvites(user.id),
      ]);

      if (roomsData.rooms) setMyRooms(roomsData.rooms);
      if (friendsData.friends) setFriends(friendsData.friends);
      if (invitesData.invites) setInvites(invitesData.invites);
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const gameState = selectedRoom?.game_state as TicTacToeState || { board: [], moves: [], winner: null, isDraw: false };
  const isMyTurn = selectedRoom?.current_turn_user_id === user?.id;
  const mySymbol = roomPlayers.find(p => p.user_id === user?.id)?.symbol;
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      if (user?.id) {
        const userProfile = await getCurrentUserProfile(user.id);
        setProfile(userProfile);
      }
    }
    loadProfile();
  }, [user?.id]);

  if (!user || !isConfigured) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t("multiplayerGames")}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t("multiplayerGamesSubtitle")}
          </p>
          
          <div className="glass-card rounded-3xl p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {t("signInToConnect")}
            </p>
            <Link
              to="/auth"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-full font-semibold hover:opacity-95 transition-opacity shadow-[var(--shadow-glow)]"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                {t("multiplayerGames")}
                {pendingInviteCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {pendingInviteCount}
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground">
                {t("multiplayerGamesSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100/50 border border-red-200/50 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Incoming Game Invites */}
        {invites.length > 0 && !selectedRoom && (
          <div className="glass-card rounded-3xl p-6 mb-6">
            <h2 className="text-xl font-display font-bold text-foreground mb-4">
              {t("gameInvites")} ({invites.length})
            </h2>
            <div className="space-y-3">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-xl">
                      {invite.inviter_avatar_url ? (
                        <img src={invite.inviter_avatar_url} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {invite.inviter_display_name} {t("invitedYouToPlay")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("roomCode")}: {invite.room_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const { room, error } = await respondToGameInvite(invite.id, 'accepted');
                        if (error) {
                          setError(error);
                        } else if (room) {
                          setSelectedRoom(room);
                          setInvites(invites.filter(i => i.id !== invite.id));
                          setPendingInviteCount(prev => Math.max(0, prev - 1));
                        }
                      }}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:opacity-90"
                    >
                      {t("accept")}
                    </button>
                    <button
                      onClick={async () => {
                        const { error } = await respondToGameInvite(invite.id, 'rejected');
                        if (error) {
                          setError(error);
                        } else {
                          setInvites(invites.filter(i => i.id !== invite.id));
                          setPendingInviteCount(prev => Math.max(0, prev - 1));
                        }
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:opacity-90"
                    >
                      {t("reject")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedRoom ? (
          <div className="space-y-6">
            {/* Create Room Card */}
            <div className="glass-card rounded-3xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                {t("createRoom")}
              </h2>
              <button
                onClick={handleCreateRoom}
                className="w-full px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-xl font-semibold hover:opacity-95 transition-opacity"
              >
                {t("createTicTacToeRoom")}
              </button>
            </div>

            {/* Join Room Card */}
            <div className="glass-card rounded-3xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {t("joinRoom")}
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  placeholder={t("roomCode")}
                  className="flex-1 bg-white/50 border border-white/30 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-white/30 uppercase"
                />
                <button
                  onClick={handleJoinRoom}
                  className="px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-xl font-semibold hover:opacity-95 transition-opacity"
                >
                  {t("joinRoom")}
                </button>
              </div>
            </div>

            {/* Invite Friend Card */}
            <div className="glass-card rounded-3xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("inviteFriend")}
              </h2>
              {friends.length === 0 ? (
                <p className="text-muted-foreground">
                  {t("addFriendsFirst")}
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="w-full p-3 bg-white/30 rounded-xl flex items-center justify-between hover:bg-white/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-lg">
                          {friend.avatar_url || friend.display_name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {friend.display_name || friend.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInviteFriend(friend.id)}
                        className="px-3 py-1 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-lg text-sm hover:opacity-90"
                      >
                        {t("invite")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Rooms */}
            {myRooms.length > 0 && (
              <div className="glass-card rounded-3xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  My Rooms
                </h2>
                <div className="space-y-2">
                  {myRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className="w-full p-3 bg-white/30 rounded-xl text-left hover:bg-white/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {t("ticTacToe")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("roomCode")}: {room.room_code}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs ${
                          room.status === 'waiting' ? 'bg-yellow-500 text-white' :
                          room.status === 'active' ? 'bg-green-500 text-white' :
                          room.status === 'finished' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {room.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Room / Tic Tac Toe Board */
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("roomCode")}: {selectedRoom.room_code}
                </p>
                <button
                  onClick={handleCopyCode}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {copied ? t("copied") : t("copyCode")}
                </button>
              </div>
              {selectedRoom.status === 'waiting' && selectedRoom.host_id === user.id && (
                <button
                  onClick={handleCancelRoom}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:opacity-90"
                >
                  {t("cancelRoom")}
                </button>
              )}
            </div>

            {/* Players */}
            <div className="flex items-center justify-center gap-8 mb-6">
              {roomPlayers.length > 0 ? (
                roomPlayers.map((player) => {
                  const isCurrentUser = player.user_id === user.id;
                  const playerProfile = friends.find(f => f.id === player.user_id);
                  const displayName = isCurrentUser 
                    ? "You" 
                    : playerProfile?.display_name || playerProfile?.username || `Player ${player.symbol}`;
                  const avatar = isCurrentUser 
                    ? (profile?.avatar_url || "👤") 
                    : (playerProfile?.avatar_url || (player.symbol === 'X' ? "❌" : "⭕"));
                  
                  return (
                    <div key={player.id} className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-2xl mb-2">
                        {player.symbol === 'X' ? <X className="h-8 w-8" /> : <Circle className="h-8 w-8" />}
                      </div>
                      <p className="font-medium text-foreground">
                        {displayName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {player.symbol}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground">Waiting for players...</p>
                </div>
              )}
            </div>

            {/* Game Status */}
            {selectedRoom.status === 'waiting' && (
              <div className="text-center mb-6">
                <p className="text-foreground font-medium">
                  {t("waitingForPlayer")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("waitingInviteOrShare")}
                </p>
              </div>
            )}

            {selectedRoom.status === 'active' && (
              <div className="text-center mb-6">
                <p className="text-foreground font-medium">
                  {isMyTurn ? t("yourTurn") : t("friendsTurn")}
                </p>
              </div>
            )}

            {selectedRoom.status === 'finished' && (
              <div className="text-center mb-6">
                {selectedRoom.winner_user_id === user.id ? (
                  <p className="text-foreground font-medium text-green-600">
                    {t("youWon")}
                  </p>
                ) : selectedRoom.winner_user_id ? (
                  <p className="text-foreground font-medium text-red-600">
                    {t("youLost")}
                  </p>
                ) : gameState.isDraw ? (
                  <p className="text-foreground font-medium">
                    {t("draw")}
                  </p>
                ) : (
                  <p className="text-foreground font-medium">
                    Game Finished
                  </p>
                )}
              </div>
            )}

            {/* Tic Tac Toe Board */}
            {selectedRoom.status !== 'waiting' && (
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-6">
                {gameState.board.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => handleMakeMove(index)}
                    disabled={
                      !isMyTurn ||
                      cell !== '' ||
                      selectedRoom.status !== 'active'
                    }
                    className="w-20 h-20 bg-white/50 border-2 border-white/30 rounded-xl flex items-center justify-center text-4xl font-bold hover:bg-white/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {cell === 'X' ? <X className="h-8 w-8" /> : cell === 'O' ? <Circle className="h-8 w-8" /> : ''}
                  </button>
                ))}
              </div>
            )}

            {/* Back to Lobby */}
            {selectedRoom.status === 'finished' && (
              <div className="text-center">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-xl font-semibold hover:opacity-95 transition-opacity"
                >
                  {t("backToLobby")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function subscribeToGameRoom(roomId: string, callback: (payload: any) => void) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  
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
