import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { 
  searchUsers, 
  sendFriendRequest, 
  getIncomingFriendRequests, 
  getOutgoingFriendRequests, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  cancelFriendRequest, 
  getFriends, 
  removeFriend,
  areFriends,
  getFriendRequestStatus,
  type UserProfile,
  type FriendRequest 
} from "@/lib/friends";
import { UserPlus, UserMinus, Check, X, Search, MessageCircle, Users } from "lucide-react";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Friends | The Digital Breakroom" },
      { name: "description", content: "Find people, send requests, and stay connected." },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  const { t } = useLanguage();
  const { user, isConfigured } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user || !isConfigured) {
        setLoading(false);
        return;
      }

      try {
        const [incomingData, outgoingData, friendsData] = await Promise.all([
          getIncomingFriendRequests(user.id),
          getOutgoingFriendRequests(user.id),
          getFriends(user.id),
        ]);

        if (incomingData.requests) setIncomingRequests(incomingData.requests);
        if (outgoingData.requests) setOutgoingRequests(outgoingData.requests);
        if (friendsData.friends) setFriends(friendsData.friends);
      } catch (err) {
        console.error("Failed to load friends data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, isConfigured]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    setSearching(true);
    setError(null);

    const { users, error } = await searchUsers(searchQuery, user.id);
    
    if (error) {
      setError(error);
    } else {
      setSearchResults(users);
    }
    
    setSearching(false);
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!user) return;

    const { error } = await sendFriendRequest(receiverId);
    
    if (error) {
      setError(error);
    } else {
      setSuccessMessage(t("friendRequestSent"));
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh outgoing requests
      const { requests } = await getOutgoingFriendRequests(user.id);
      if (requests) setOutgoingRequests(requests);
      
      // Clear search results
      setSearchResults([]);
      setSearchQuery("");
    }
  };

  const handleAcceptRequest = async (requestId: string, requesterId: string) => {
    if (!user) return;

    const { error } = await acceptFriendRequest(requestId, requesterId, user.id);
    
    if (error) {
      setError(error);
    } else {
      setSuccessMessage(t("friendRequestAccepted"));
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh data
      const [incomingData, friendsData] = await Promise.all([
        getIncomingFriendRequests(user.id),
        getFriends(user.id),
      ]);
      if (incomingData.requests) setIncomingRequests(incomingData.requests);
      if (friendsData.friends) setFriends(friendsData.friends);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const { error } = await rejectFriendRequest(requestId);
    
    if (error) {
      setError(error);
    } else {
      setSuccessMessage(t("friendRequestRejected"));
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh incoming requests
      const { requests } = await getIncomingFriendRequests(user.id);
      if (requests) setIncomingRequests(requests);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const { error } = await cancelFriendRequest(requestId);
    
    if (error) {
      setError(error);
    } else {
      setSuccessMessage(t("requestCancelled"));
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh outgoing requests
      const { requests } = await getOutgoingFriendRequests(user.id);
      if (requests) setOutgoingRequests(requests);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;

    const { error } = await removeFriend(friendId);
    
    if (error) {
      setError(error);
    } else {
      setSuccessMessage(t("friendRemoved"));
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh friends
      const { friends: friendsData } = await getFriends(user.id);
      if (friendsData) setFriends(friendsData);
    }
  };

  // Check friendship and request status for search results
  const checkStatus = async (profileId: string) => {
    if (!user) return { isFriend: false, requestStatus: null };

    const [friendCheck, requestCheck] = await Promise.all([
      areFriends(user.id, profileId),
      getFriendRequestStatus(user.id, profileId),
    ]);

    return { 
      isFriend: friendCheck.isFriend, 
      requestStatus: requestCheck.status 
    };
  };

  if (!user || !isConfigured) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t("friends")}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t("friendsSubtitle")}
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
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {t("friends")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("friendsSubtitle")}
        </p>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100/50 border border-green-200/50 rounded-xl text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100/50 border border-red-200/50 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search Section */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t("findFriends")}
          </h2>
          
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("searchByUsername")}
              className="flex-1 bg-white/50 border border-white/30 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-xl font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? "Searching..." : t("search")}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((profile) => (
                <FriendSearchResult
                  key={profile.id}
                  profile={profile}
                  onSendRequest={handleSendRequest}
                  currentUserId={user.id}
                />
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found. Try a different search term.
            </p>
          )}
        </div>

        {/* Incoming Requests */}
        {incomingRequests.length > 0 && (
          <div className="glass-card rounded-3xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("incomingRequests")} ({incomingRequests.length})
            </h2>
            
            <div className="space-y-3">
              {incomingRequests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  type="incoming"
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                  currentUserId={user.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Requests */}
        {outgoingRequests.length > 0 && (
          <div className="glass-card rounded-3xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("outgoingRequests")} ({outgoingRequests.length})
            </h2>
            
            <div className="space-y-3">
              {outgoingRequests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  type="outgoing"
                  onCancel={handleCancelRequest}
                  currentUserId={user.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("friendsList")} ({friends.length})
          </h2>
          
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-foreground font-medium mb-2">
                {t("noFriendsYet")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("startConnecting")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onRemove={handleRemoveFriend}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function FriendSearchResult({ profile, onSendRequest, currentUserId }: { profile: UserProfile; onSendRequest: (id: string) => void; currentUserId: string }) {
  const [status, setStatus] = useState<{ isFriend: boolean; requestStatus: string | null }>({ isFriend: false, requestStatus: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      const supabase = await import("@supabase/supabase-js").then(m => m.createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      ));
      
      const [friendCheck, requestCheck] = await Promise.all([
        supabase.from("friendships").select("id").eq("user_id", currentUserId).eq("friend_id", profile.id).single(),
        supabase.from("friend_requests").select("status").eq("requester_id", currentUserId).eq("receiver_id", profile.id).single(),
      ]);

      setStatus({
        isFriend: !!friendCheck.data,
        requestStatus: requestCheck.data?.status || null,
      });
      setLoading(false);
    }

    checkStatus();
  }, [profile.id, currentUserId]);

  if (loading) {
    return <div className="p-4 bg-white/30 rounded-xl text-sm text-muted-foreground">Loading...</div>;
  }

  if (status.isFriend) {
    return (
      <div className="p-4 bg-white/30 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-lg">
            {profile.avatar_url || profile.display_name?.[0] || "?"}
          </div>
          <div>
            <p className="font-medium text-foreground">{profile.display_name || profile.username}</p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>
        <span className="text-sm text-green-600 font-medium">{t("friends")}</span>
      </div>
    );
  }

  if (status.requestStatus === "pending") {
    return (
      <div className="p-4 bg-white/30 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-lg">
            {profile.avatar_url || profile.display_name?.[0] || "?"}
          </div>
          <div>
            <p className="font-medium text-foreground">{profile.display_name || profile.username}</p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">{t("requestSent")}</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/30 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-lg">
          {profile.avatar_url || profile.display_name?.[0] || "?"}
        </div>
        <div>
          <p className="font-medium text-foreground">{profile.display_name || profile.username}</p>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      </div>
      <button
        onClick={() => onSendRequest(profile.id)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-lg text-sm font-semibold hover:opacity-95 transition-opacity"
      >
        <UserPlus className="h-4 w-4" />
        {t("addFriend")}
      </button>
    </div>
  );
}

function FriendRequestCard({ request, type, onAccept, onReject, onCancel, currentUserId }: { 
  request: FriendRequest; 
  type: "incoming" | "outgoing"; 
  onAccept?: (id: string, requesterId: string) => void; 
  onReject?: (id: string) => void; 
  onCancel?: (id: string) => void;
  currentUserId: string;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = await import("@supabase/supabase-js").then(m => m.createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      ));
      
      const otherUserId = type === "incoming" ? request.requester_id : request.receiver_id;
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, role_label")
        .eq("id", otherUserId)
        .single();
      
      setProfile(data);
    }

    loadProfile();
  }, [request, type]);

  if (!profile) return null;

  return (
    <div className="p-4 bg-white/30 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-lg">
          {profile.avatar_url || profile.display_name?.[0] || "?"}
        </div>
        <div>
          <p className="font-medium text-foreground">{profile.display_name || profile.username}</p>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      </div>
      
      {type === "incoming" ? (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept?.(request.id, request.requester_id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-600 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
          >
            <Check className="h-4 w-4" />
            {t("accept")}
          </button>
          <button
            onClick={() => onReject?.(request.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-600 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            <X className="h-4 w-4" />
            {t("reject")}
          </button>
        </div>
      ) : (
        <button
          onClick={() => onCancel?.(request.id)}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/20 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-500/30 transition-colors"
        >
          <X className="h-4 w-4" />
          {t("cancelRequest")}
        </button>
      )}
    </div>
  );
}

function FriendCard({ friend, onRemove }: { friend: UserProfile; onRemove: (id: string) => void }) {
  return (
    <div className="p-4 bg-white/30 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-lg">
          {friend.avatar_url || friend.display_name?.[0] || "?"}
        </div>
        <div>
          <p className="font-medium text-foreground">{friend.display_name || friend.username}</p>
          <p className="text-sm text-muted-foreground">@{friend.username}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Link
          to="/messages"
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {t("message")}
        </Link>
        <button
          onClick={() => onRemove(friend.id)}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-600 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
        >
          <UserMinus className="h-4 w-4" />
          {t("removeFriend")}
        </button>
      </div>
    </div>
  );
}
