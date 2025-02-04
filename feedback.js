const room = new WebsimSocket();

function FeedbackSystem() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('submit');
  const [feedback, setFeedback] = React.useState([]);
  const [replyStates, setReplyStates] = React.useState({});
  const [currentUser, setCurrentUser] = React.useState(null);
  const [expandedReplies, setExpandedReplies] = React.useState({});

  // Get the current user when component mounts
  React.useEffect(() => {
    async function fetchUser() {
      const user = await window.websim.getUser();
      setCurrentUser(user);
    }
    fetchUser();
  }, []);

  // Subscribe to feedback collection
  React.useEffect(() => {
    return room.collection('feedback').subscribe(feedback => {
      // Sort feedback: main posts first, then replies under their parents
      const sortedFeedback = feedback.sort((a, b) => {
        // Sort by parent_id (null first) then by date
        if (!a.parent_id && b.parent_id) return -1;
        if (a.parent_id && !b.parent_id) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setFeedback(sortedFeedback);
    });
  }, []);

  // Handle new feedback submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await room.collection('feedback').create({
        message: message.trim(),
        parent_id: null
      });
      setMessage('');
      setActiveTab('view');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  // Handle reply submission
  const handleReply = async (feedbackId, replyText) => {
    if (!replyText.trim()) return;

    try {
      await room.collection('feedback').create({
        message: replyText.trim(),
        parent_id: feedbackId
      });
      // Clear reply state for this feedback
      setReplyStates(prev => ({
        ...prev,
        [feedbackId]: {
          ...prev[feedbackId],
          text: '',
          isReplying: false
        }
      }));
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  // Toggle reply state for a feedback item
  const toggleReply = (feedbackId) => {
    setReplyStates(prev => ({
      ...prev,
      [feedbackId]: {
        text: '',
        isReplying: !(prev[feedbackId]?.isReplying || false)
      }
    }));
  };

  // Toggle expanded replies view
  const toggleExpandedReplies = (feedbackId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [feedbackId]: !prev[feedbackId]
    }));
  };

  // Update reply text
  const updateReplyText = (feedbackId, text) => {
    setReplyStates(prev => ({
      ...prev,
      [feedbackId]: {
        ...prev[feedbackId],
        text
      }
    }));
  };

  const FeedbackItem = ({ item }) => {
    const replies = feedback.filter(f => f.parent_id === item.id);
    const replyState = replyStates[item.id] || { text: '', isReplying: false };
    const isExpanded = expandedReplies[item.id];

    if (item.parent_id) return null; // Don't render replies here

    return (
      <div className="feedback-item">
        <div className="feedback-content">
          <div className="feedback-meta">
            <img 
              src={`https://images.websim.ai/avatar/${item.username}`}
              alt={item.username}
              className="feedback-avatar"
            />
            <span className="feedback-author">{item.username}</span>
            <span className="feedback-date">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="feedback-message">{item.message}</div>
          <div className="reply-actions">
            {!replyState.isReplying ? (
              <button 
                className="reply-button"
                onClick={() => toggleReply(item.id)}
              >
                Reply
              </button>
            ) : (
              <div className="reply-form">
                <textarea
                  value={replyState.text}
                  onChange={(e) => updateReplyText(item.id, e.target.value)}
                  placeholder="Write your reply..."
                />
                <div className="reply-buttons">
                  <button 
                    className="submit-reply"
                    onClick={() => handleReply(item.id, replyState.text)}
                  >
                    Submit
                  </button>
                  <button 
                    className="cancel-reply"
                    onClick={() => toggleReply(item.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Render initial 2 replies */}
        {replies.length > 0 && (
          <div className="replies-section">
            {(isExpanded ? replies : replies.slice(0, 2)).map(reply => (
              <div key={reply.id} className="feedback-reply">
                <div className="feedback-meta">
                  <img 
                    src={`https://images.websim.ai/avatar/${reply.username}`}
                    alt={reply.username}
                    className="feedback-avatar"
                  />
                  <span className="feedback-author">{reply.username}</span>
                  <span className="feedback-date">
                    {new Date(reply.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="feedback-message">{reply.message}</div>
              </div>
            ))}
            {replies.length > 2 && (
              <button 
                className="view-all-replies"
                onClick={() => toggleExpandedReplies(item.id)}
              >
                {isExpanded ? 'Show Less' : `View All ${replies.length} Replies`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <button 
        className="feedback-button" 
        onClick={() => setIsOpen(true)}
        title="Feedback Chat"
      >
        💭
      </button>

      {isOpen && (
        <div className="feedback-modal" onClick={(e) => {
          if (e.target.className === 'feedback-modal') setIsOpen(false);
        }}>
          <div className="feedback-content">
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>

            <div className="feedback-tabs">
              <button 
                className={`feedback-tab ${activeTab === 'submit' ? 'active' : ''}`}
                onClick={() => setActiveTab('submit')}
              >
                New Message
              </button>
              <button 
                className={`feedback-tab ${activeTab === 'view' ? 'active' : ''}`}
                onClick={() => setActiveTab('view')}
              >
                View Chat ({feedback.filter(f => !f.parent_id).length})
              </button>
            </div>

            {activeTab === 'submit' ? (
              <form className="feedback-form" onSubmit={handleSubmit}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  required
                />
                <button type="submit">Send Message</button>
              </form>
            ) : (
              <div className="feedback-list">
                {feedback
                  .filter(item => !item.parent_id)
                  .map((item) => (
                    <FeedbackItem key={item.id} item={item} />
                  ))}
                {feedback.filter(f => !f.parent_id).length === 0 && (
                  <div className="no-feedback">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

ReactDOM.render(
  <FeedbackSystem />,
  document.getElementById('feedback-root')
);