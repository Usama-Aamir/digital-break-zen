import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { 
  getDirectConversations, 
  getDirectMessages, 
  sendDirectMessage, 
  markConversationRead,
  getOrCreateDirectConversation,
  type ConversationWithDetails,
  type DirectMessage 
} from "@/lib/directMessages";
import { getFriends, areFriends, type UserProfile } from "@/lib/friends";
import { Send, MessageCircle, Users, ArrowLeft, Search } from "lucide-react";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages | The Digital Breakroom" },
      { name: "description", content: "Chat with your breakroom friends." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { t } = useLanguage();
  const { user, isConfigured } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [showFriendPicker, setShowFriendPicker] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user || !isConfigured) {
        setLoading(false);
        return;
      }

      try {
        const [conversationsData, friendsData] = await Promise.all([
          getDirectConversations(user.id),
          getFriends(user.id),
        ]);

        if (conversationsData.conversations) setConversations(conversationsData.conversations);
        if (friendsData.friends) setFriends(friendsData.friends);
      } catch (err) {
        console.error("Failed to load messages data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, isConfigured]);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedConversation) return;

      try {
        const { messages: messagesData } = await getDirectMessages(selectedConversation.id);
        if (messagesData) setMessages(messagesData);
        
        // Mark conversation as read
        await markConversationRead(selectedConversation.id);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    }

    loadMessages();
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) return;

    setSending(true);
    setError(null);

    const { message, error } = await sendDirectMessage(selectedConversation.id, messageText);
    
    if (error) {
      setError(error);
    } else if (message) {
      setMessages([...messages, message]);
      setMessageText("");
      
      // Update conversation with last message
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, last_message: message.body, last_message_at: message.created_at }
          : conv
      ));
    }
    
    setSending(false);
  };

  const handleSelectFriend = async (friend: UserProfile) => {
    if (!user) return;

    // Check if they are friends
    const { isFriend } = await areFriends(user.id, friend.id);
    if (!isFriend) {
      setError(t("addFriendBeforeMessaging"));
      return;
    }

    // Get or create conversation
    const { conversationId, error } = await getOrCreateDirectConversation(friend.id);
    
    if (error) {
      setError(error);
      return;
    }

    if (conversationId) {
      // Find or create conversation in state
      const existingConv = conversations.find(c => c.friend_id === friend.id);
      if (existingConv) {
        setSelectedConversation(existingConv);
      } else {
        const newConv: ConversationWithDetails = {
          id: conversationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          friend_id: friend.id,
          friend_display_name: friend.display_name,
          friend_username: friend.username,
          friend_avatar_url: friend.avatar_url,
          friend_role_label: friend.role_label,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
        };
        setConversations([newConv, ...conversations]);
        setSelectedConversation(newConv);
      }
      
      setShowFriendPicker(false);
    }
  };

  if (!user || !isConfigured) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t("messages")}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t("messagesSubtitle")}
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
          {t("messages")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("messagesSubtitle")}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100/50 border border-red-200/50 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="md:col-span-1">
            <div className="glass-card rounded-3xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {t("conversations")}
                </h2>
                <button
                  onClick={() => setShowFriendPicker(true)}
                  className="p-2 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-lg hover:opacity-95 transition-opacity"
                  title={t("startNewConversation")}
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-foreground font-medium mb-2">
                    {t("noMessagesYet")}
                  </p>
                  <button
                    onClick={() => setShowFriendPicker(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t("startConversation")}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-3 rounded-xl text-left transition-colors ${
                        selectedConversation?.id === conv.id
                          ? "bg-white/50 border-2 border-[var(--gradient-mint)]"
                          : "bg-white/30 hover:bg-white/40 border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-lg flex-shrink-0">
                          {conv.friend_avatar_url || conv.friend_display_name?.[0] || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {conv.friend_display_name || conv.friend_username}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message || t("noMessages")}
                          </p>
                        </div>
                        {conv.unread_count > 0 && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                            {conv.unread_count}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="md:col-span-2">
            <div className="glass-card rounded-3xl p-4 h-[500px] flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-white/20 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-mint)] to-[var(--gradient-lav)] flex items-center justify-center text-lg">
                      {selectedConversation.friend_avatar_url || selectedConversation.friend_display_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {selectedConversation.friend_display_name || selectedConversation.friend_username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{selectedConversation.friend_username}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t("startChatting")}
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl ${
                              msg.sender_id === user.id
                                ? "bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground"
                                : "bg-white/30 text-foreground"
                            }`}
                          >
                            <p className="text-sm break-words">{msg.body}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder={t("writeMessage")}
                      className="flex-1 bg-white/50 border border-white/30 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !messageText.trim()}
                      className="px-4 py-3 bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground rounded-xl font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                  <div>
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-foreground font-medium mb-2">
                      {t("selectFriendToChat")}
                    </p>
                    <button
                      onClick={() => setShowFriendPicker(true)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {t("startConversation")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Friend Picker Modal */}
        {showFriendPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("selectFriend")}
                </h3>
                <button
                  onClick={() => setShowFriendPicker(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>

              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">
                    {t("noFriendsYet")}
                  </p>
                  <Link
                    to="/friends"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t("findFriends")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => handleSelectFriend(friend)}
                      className="w-full p-3 bg-white/30 rounded-xl text-left hover:bg-white/40 transition-colors"
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
