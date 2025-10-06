import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function ChatApp() {
  const [selectedChannelId, setSelectedChannelId] = useState<Id<"channels"> | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  const channels = useQuery(api.channels.list);
  const messages = useQuery(
    api.messages.list,
    selectedChannelId ? { channelId: selectedChannelId } : "skip"
  );
  const user = useQuery(api.auth.loggedInUser);

  const sendMessage = useMutation(api.messages.send);
  const createChannel = useMutation(api.channels.create);
  const getDefaultChannel = useMutation(api.channels.getDefault);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set default channel on load
  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0]._id);
    } else if (channels && channels.length === 0) {
      // Create default channel if none exist
      getDefaultChannel().then((channel) => {
        if (channel) {
          setSelectedChannelId(channel._id);
        }
      });
    }
  }, [channels, selectedChannelId, getDefaultChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannelId) return;

    try {
      await sendMessage({
        content: newMessage,
        channelId: selectedChannelId,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const channelId = await createChannel({
        name: newChannelName,
        description: `Channel created by ${user?.name || user?.email}`,
      });
      setNewChannelName("");
      setShowCreateChannel(false);
      setSelectedChannelId(channelId);
    } catch (error) {
      console.error("Failed to create channel:", error);
    }
  };

  const selectedChannel = channels?.find(c => c._id === selectedChannelId);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Channels</h3>
            <button
              onClick={() => setShowCreateChannel(!showCreateChannel)}
              className="text-gray-300 hover:text-white text-xl"
            >
              +
            </button>
          </div>
          {showCreateChannel && (
            <form onSubmit={handleCreateChannel} className="mt-2">
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Channel name"
                className="w-full px-2 py-1 text-sm bg-gray-700 rounded text-white placeholder-gray-400"
                autoFocus
              />
            </form>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {channels?.map((channel) => (
            <button
              key={channel._id}
              onClick={() => setSelectedChannelId(channel._id)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${
                selectedChannelId === channel._id ? "bg-gray-700" : ""
              }`}
            >
              # {channel.name}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-700">
          <div className="text-sm text-gray-300">
            Signed in as {user?.name || user?.email}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b px-6 py-4">
          <h2 className="text-xl font-semibold">
            {selectedChannel ? `# ${selectedChannel.name}` : "Select a channel"}
          </h2>
          {selectedChannel?.description && (
            <p className="text-gray-600 text-sm">{selectedChannel.description}</p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages?.map((message) => (
            <div key={message._id} className="flex space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {message.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{message.authorName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(message._creationTime).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {selectedChannelId && (
          <div className="bg-white border-t p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${selectedChannel?.name}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
